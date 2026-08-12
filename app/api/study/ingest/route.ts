import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/integrations/supabase/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const maxDuration = 60

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null
  return new OpenAI({ apiKey })
}

function chunkText(text: string, maxLen = 1600, overlap = 150): string[] {
  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    const chunk = text.slice(start, start + maxLen).trim()
    if (chunk.length > 80) chunks.push(chunk)
    start += maxLen - overlap
  }
  return chunks
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const title = (formData.get('title') as string) || file?.name?.replace(/\.pdf$/i, '') || 'Untitled'

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json({ error: 'PDF 파일만 지원합니다' }, { status: 400 })
  }
  const openai = getOpenAI()
  if (!openai) return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 503 })

  const buffer = Buffer.from(await file.arrayBuffer())
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse/lib/pdf-parse.js')

  const pageTexts: string[] = []
  await pdfParse(buffer, {
    pagerender: (pageData: any) =>
      pageData.getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false })
        .then((tc: any) => {
          const text = tc.items.map((i: any) => (i.str as string) || '').join(' ').trim()
          pageTexts.push(text)
          return text
        }),
  })
  if (pageTexts.length === 0) {
    const parsed = await pdfParse(buffer)
    pageTexts.push(parsed.text as string)
  }

  const allChunks: { content: string; page_num: number; chunk_idx: number }[] = []
  let idx = 0
  for (let p = 0; p < pageTexts.length; p++) {
    for (const content of chunkText(pageTexts[p])) {
      allChunks.push({ content, page_num: p + 1, chunk_idx: idx++ })
    }
  }
  if (allChunks.length === 0) {
    return NextResponse.json({ error: 'PDF 텍스트 추출 실패 (스캔 이미지 PDF는 미지원)' }, { status: 422 })
  }

  const { data: doc, error: docErr } = await supabase
    .from('study_docs')
    .insert({ title, source_file: file.name, page_count: pageTexts.length, chunk_count: allChunks.length })
    .select('id').single()
  if (docErr) return NextResponse.json({ error: docErr.message }, { status: 500 })

  const BATCH = 20
  for (let i = 0; i < allChunks.length; i += BATCH) {
    const batch = allChunks.slice(i, i + BATCH)
    const embRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch.map(c => c.content),
    })
    const rows = batch.map((c, j) => ({
      doc_id: doc.id, content: c.content,
      page_num: c.page_num, chunk_idx: c.chunk_idx,
      embedding: embRes.data[j].embedding,
    }))
    const { error: chunkErr } = await supabase.from('study_chunks').insert(rows)
    if (chunkErr) {
      await supabase.from('study_docs').delete().eq('id', doc.id)
      return NextResponse.json({ error: chunkErr.message }, { status: 500 })
    }
  }

  return NextResponse.json({ doc_id: doc.id, title, chunks: allChunks.length })
}
