import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/integrations/supabase/server'
import { fetchHealthRecordEntries, isValidDateRange } from '@/lib/domain/assistants/fetchHealthRecords'
import { runTimelineAssistant } from '@/lib/domain/assistants/timelineAssistant'
import { addDays, formatKstDate } from '@/lib/domain/socialReturnIndicators'
import type { TimelineGranularity } from '@/lib/domain/assistants/types'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 30

const VALID_GRANULARITY: TimelineGranularity[] = ['day', 'week', 'month']

// GET /api/assistants/timeline?from=YYYY-MM-DD&to=YYYY-MM-DD&granularity=week
//
// 인증: 웹은 쿠키 세션(createClient가 자동 처리)을, 모바일 앱(careflow-app)은 쿠키를 공유하지
// 않으므로 Authorization: Bearer <supabase access token> 헤더로 인증한다. 헤더가 있으면
// supabase.auth.getUser(token)으로 그 토큰을 직접 검증하고, 없으면 기존 쿠키 세션으로 폴백한다.
// (app/api/assistants/context, summary와 동일한 패턴)
export async function GET(req: NextRequest) {
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

  const { searchParams } = new URL(req.url)
  const to = searchParams.get('to') || formatKstDate()
  const from = searchParams.get('from') || addDays(to, -90)
  const granularityParam = searchParams.get('granularity') as TimelineGranularity | null
  const granularity: TimelineGranularity = granularityParam && VALID_GRANULARITY.includes(granularityParam)
    ? granularityParam
    : 'week'

  const rangeError = isValidDateRange(from, to)
  if (rangeError) return NextResponse.json({ error: rangeError }, { status: 400 })

  const entries = await fetchHealthRecordEntries(supabase, user.id, from, to)
  const result = runTimelineAssistant({ entries, granularity })

  return NextResponse.json({ from, to, granularity, ...result })
}
