import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/integrations/supabase/server'
import { fetchHealthRecordEntries, fetchWeeklyNotes } from '@/lib/domain/assistants/fetchHealthRecords'
import { runSummaryAssistant } from '@/lib/domain/assistants/summaryAssistant'
import { addDays, formatKstDate } from '@/lib/domain/socialReturnIndicators'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const maxDuration = 30

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null
  return new OpenAI({ apiKey })
}

// POST /api/assistants/summary — body: { from?: string, to?: string }
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const openai = getOpenAI()
  if (!openai) return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 503 })

  const { from: fromInput, to: toInput } = await req.json().catch(() => ({})) as { from?: string; to?: string }
  const to = toInput || formatKstDate()
  const from = fromInput || addDays(to, -7)

  const [entries, weeklyNotes] = await Promise.all([
    fetchHealthRecordEntries(supabase, user.id, from, to),
    fetchWeeklyNotes(supabase, user.id, addDays(from, -7), to),
  ])

  const result = await runSummaryAssistant(openai, { entries, weeklyNotes })

  return NextResponse.json({ from, to, ...result })
}
