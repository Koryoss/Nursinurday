import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/integrations/supabase/server'
import OpenAI from 'openai'
import { LinkNoteError, linknoteChunksByFile, normalizeServerUrl } from '@/lib/integrations/linknote'

export const runtime = 'nodejs'
export const maxDuration = 60

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null
  return new OpenAI({ apiKey })
}

// POST /api/study/linknote/import — LinkNote 자료를 스터디(study_docs/study_chunks)로 가져온다.
// LinkNote 임베딩(Ollama/OpenAI 혼재)은 스터디의 1536차원 벡터와 호환되지 않으므로
// 텍스트만 가져와 스터디와 같은 모델(text-embedding-3-small)로 다시 임베딩한다.
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { serverUrl, token, filenames } = (await req.json().catch(() => ({}))) as {
    serverUrl?: string
    token?: string
    filenames?: string[]
  }
  if (!serverUrl || !token || !filenames?.length) {
    return NextResponse.json({ error: 'serverUrl, token, filenames가 필요합니다.' }, { status: 400 })
  }

  const openai = getOpenAI()
  if (!openai) return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 503 })

  let url: string
  try {
    url = normalizeServerUrl(serverUrl)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }

  const results: { filename: string; ok: boolean; chunks?: number; message?: string }[] = []

  for (const filename of filenames) {
    const sourceFile = `linknote:${filename}`

    const { data: existing } = await supabase
      .from('study_docs')
      .select('id')
      .eq('source_file', sourceFile)
      .maybeSingle()
    if (existing) {
      results.push({ filename, ok: false, message: '이미 가져온 자료입니다.' })
      continue
    }

    let lnChunks
    try {
      lnChunks = await linknoteChunksByFile(url, token, filename)
    } catch (e) {
      const message = e instanceof LinkNoteError ? e.message : 'LinkNote 자료 조회 실패'
      results.push({ filename, ok: false, message })
      continue
    }
    if (lnChunks.length === 0) {
      results.push({ filename, ok: false, message: 'LinkNote에서 청크를 찾지 못했습니다.' })
      continue
    }

    const meta = lnChunks[0]
    const title = [meta.course, meta.title].filter(Boolean).join(' — ') || filename
    const pageCount = Math.max(...lnChunks.map(c => c.page || 0), 0)

    const { data: doc, error: docErr } = await supabase
      .from('study_docs')
      .insert({
        title,
        source_file: sourceFile,
        page_count: pageCount,
        chunk_count: lnChunks.length,
      })
      .select('id')
      .single()
    if (docErr) {
      results.push({ filename, ok: false, message: docErr.message })
      continue
    }

    const BATCH = 20
    let failed: string | null = null
    for (let i = 0; i < lnChunks.length; i += BATCH) {
      const batch = lnChunks.slice(i, i + BATCH)
      const embRes = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: batch.map(c => c.text),
      })
      const rows = batch.map((c, j) => ({
        doc_id: doc.id,
        content: c.text,
        page_num: c.page || 0,
        chunk_idx: i + j,
        embedding: embRes.data[j].embedding,
      }))
      const { error: chunkErr } = await supabase.from('study_chunks').insert(rows)
      if (chunkErr) {
        failed = chunkErr.message
        break
      }
    }

    if (failed) {
      await supabase.from('study_docs').delete().eq('id', doc.id)
      results.push({ filename, ok: false, message: failed })
    } else {
      results.push({ filename, ok: true, chunks: lnChunks.length })
    }
  }

  return NextResponse.json({ results })
}
