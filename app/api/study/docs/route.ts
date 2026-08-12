import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/integrations/supabase/server'

export const runtime = 'nodejs'

// GET /api/study/docs — 문서 목록
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('study_docs')
    .select('id, title, source_file, page_count, chunk_count, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ docs: data })
}

// DELETE /api/study/docs — 문서 삭제
export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let bodyId: string | null = null
  try {
    bodyId = ((await req.json()) as { id?: string }).id ?? null
  } catch {
    bodyId = null
  }

  const id = req.nextUrl.searchParams.get('id') ?? bodyId
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase.from('study_docs').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
