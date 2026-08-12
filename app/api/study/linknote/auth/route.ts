import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/integrations/supabase/server'
import { LinkNoteError, linknoteLogin, normalizeServerUrl } from '@/lib/integrations/linknote'

export const runtime = 'nodejs'

// POST /api/study/linknote/auth — LinkNote 계정으로 로그인해 토큰을 발급받는다.
// 브라우저에서 LinkNote 서버로 직접 요청하면 CORS에 막히므로 서버에서 프록시한다.
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { serverUrl, email, password } = (await req.json().catch(() => ({}))) as {
    serverUrl?: string
    email?: string
    password?: string
  }
  if (!serverUrl || !email || !password) {
    return NextResponse.json({ error: 'serverUrl, email, password가 필요합니다.' }, { status: 400 })
  }

  try {
    const url = normalizeServerUrl(serverUrl)
    const { token, user: lnUser } = await linknoteLogin(url, email, password)
    return NextResponse.json({ token, user: lnUser, serverUrl: url })
  } catch (e) {
    if (e instanceof LinkNoteError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    return NextResponse.json({ error: 'LinkNote 로그인에 실패했습니다.' }, { status: 500 })
  }
}
