import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 30

// GET /api/study/linknote/export — 스터디 문서를 LinkNote 수입용 JSON으로 내보낸다.
// pages 배열은 LinkNote의 add_pdf_pages_to_db(pages=[{page, text}]) 입력과 같은 구조라
// LinkNote 쪽에서 그대로 학습(ingest)할 수 있다.
// LinkNote에서 가져온 문서(source_file이 linknote:)는 중복을 막기 위해 제외한다.
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: docs, error: docErr } = await supabase
    .from('study_docs')
    .select('id, title, source_file, page_count, created_at')
    .not('source_file', 'like', 'linknote:%')
    .order('created_at', { ascending: true })
  if (docErr) return NextResponse.json({ error: docErr.message }, { status: 500 })

  const exported = []
  for (const doc of docs ?? []) {
    const { data: chunks, error: chunkErr } = await supabase
      .from('study_chunks')
      .select('content, page_num, chunk_idx')
      .eq('doc_id', doc.id)
      .order('page_num', { ascending: true })
      .order('chunk_idx', { ascending: true })
    if (chunkErr) return NextResponse.json({ error: chunkErr.message }, { status: 500 })

    const pageMap = new Map<number, string[]>()
    for (const c of chunks ?? []) {
      const page = c.page_num || 1
      if (!pageMap.has(page)) pageMap.set(page, [])
      pageMap.get(page)!.push(c.content)
    }
    const pages = Array.from(pageMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([page, texts]) => ({ page, text: texts.join('\n') }))

    exported.push({
      semester: 'CareFlow',
      course: '스터디 논문',
      title: doc.title,
      filename: doc.source_file,
      unit: '',
      pages,
    })
  }

  return NextResponse.json(
    {
      format: 'linknote-pages-v1',
      exported_at: new Date().toISOString(),
      docs: exported,
    },
    {
      headers: {
        'Content-Disposition': 'attachment; filename="careflow-study-linknote-export.json"',
      },
    },
  )
}
