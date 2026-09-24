import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/integrations/supabase/server'
import { fetchHealthRecordEntries, fetchWeeklyNotes, isValidDateRange } from '@/lib/domain/assistants/fetchHealthRecords'
import { runSummaryAssistant } from '@/lib/domain/assistants/summaryAssistant'
import { addDays, formatKstDate } from '@/lib/domain/socialReturnIndicators'
import OpenAI from 'openai'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 30

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null
  return new OpenAI({ apiKey })
}

// POST /api/assistants/summary — body: { from?: string, to?: string }
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

  const openai = getOpenAI()
  if (!openai) return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 503 })

  const { from: fromInput, to: toInput } = await req.json().catch(() => ({})) as { from?: string; to?: string }
  const to = toInput || formatKstDate()
  const from = fromInput || addDays(to, -7)

  const rangeError = isValidDateRange(from, to)
  if (rangeError) return NextResponse.json({ error: rangeError }, { status: 400 })

  try {
    const [entries, weeklyNotes] = await Promise.all([
      fetchHealthRecordEntries(supabase, user.id, from, to),
      // weeklyNotes는 entries 기간(from~to)보다 7일 더 이른 시점부터 조회한다.
      // meaning_notes는 주 단위(week_start)로 저장되므로, from 직전 주에 기록된 메모가
      // entries 기간과 겹칠 수 있어 여유 범위를 둔다 (의도된 동작).
      fetchWeeklyNotes(supabase, user.id, addDays(from, -7), to),
    ])

    const result = await runSummaryAssistant(openai, { entries, weeklyNotes })

    return NextResponse.json({ from, to, ...result })
  } catch (err) {
    console.error('[POST /api/assistants/summary] failed to build summary:', err)
    return NextResponse.json(
      { error: '기록을 요약하는 중 문제가 생겼어요. 잠시 후 다시 시도해볼까요?' },
      { status: 502 }
    )
  }
}
