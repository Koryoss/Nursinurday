import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { LinkNoteError, linknoteLibrary, normalizeServerUrl } from '@/lib/linknote'

export const runtime = 'nodejs'

// POST /api/study/linknote/library — LinkNote 서재(과목/파일 목록) 조회 프록시
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { serverUrl, token } = (await req.json().catch(() => ({}))) as {
    serverUrl?: string
    token?: string
  }
  if (!serverUrl || !token) {
    return NextResponse.json({ error: 'serverUrl, token이 필요합니다.' }, { status: 400 })
  }

  try {
    const url = normalizeServerUrl(serverUrl)
    const library = await linknoteLibrary(url, token)

    // 이미 스터디로 가져온 파일 표시용
    const { data: docs } = await supabase
      .from('study_docs')
      .select('source_file')
      .like('source_file', 'linknote:%')
    const imported = new Set((docs ?? []).map(d => d.source_file.replace(/^linknote:/, '')))

    return NextResponse.json({ library, imported: Array.from(imported) })
  } catch (e) {
    if (e instanceof LinkNoteError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    return NextResponse.json({ error: 'LinkNote 서재 조회에 실패했습니다.' }, { status: 500 })
  }
}
