import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/integrations/supabase/server'
import { fetchHealthRecordEntries } from '@/lib/domain/assistants/fetchHealthRecords'
import { runContextAssistant } from '@/lib/domain/assistants/contextAssistant'
import { addDays } from '@/lib/domain/socialReturnIndicators'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 30

// POST /api/assistants/context — body: { date: string, lookbackDays?: number, limit?: number }
//
// 인증: 웹은 쿠키 세션(createClient가 자동 처리)을, 모바일 앱(careflow-app)은 쿠키를 공유하지
// 않으므로 Authorization: Bearer <supabase access token> 헤더로 인증한다. 헤더가 있으면
// supabase.auth.getUser(token)으로 그 토큰을 직접 검증하고, 없으면 기존 쿠키 세션으로 폴백한다.
export async function POST(req: NextRequest) {
  const cookieClient = createClient()

  const authHeader = req.headers.get('authorization')
  const bearerToken = authHeader?.toLowerCase().startsWith('bearer ')
    ? authHeader.slice('bearer '.length).trim()
    : null

  const supabase = bearerToken
    ? createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: { headers: { Authorization: `Bearer ${bearerToken}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        }
      )
    : cookieClient
  const { data: { user } } = bearerToken
    ? await supabase.auth.getUser(bearerToken)
    : await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { date, lookbackDays, limit } = await req.json() as { date?: string; lookbackDays?: number; limit?: number }
  if (!date?.trim()) return NextResponse.json({ error: 'date required' }, { status: 400 })

  const from = addDays(date, -(lookbackDays ?? 90))
  const entries = await fetchHealthRecordEntries(supabase, user.id, from, date)

  const current = entries.find(entry => entry.date === date)
  if (!current) {
    return NextResponse.json({ error: '해당 날짜의 기록을 찾을 수 없어요.' }, { status: 404 })
  }

  const past = entries.filter(entry => entry.date < date)
  const result = runContextAssistant({ current, past, limit })

  return NextResponse.json(result)
}
