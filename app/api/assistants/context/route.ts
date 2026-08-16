import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/integrations/supabase/server'
import { fetchHealthRecordEntries } from '@/lib/domain/assistants/fetchHealthRecords'
import { runContextAssistant } from '@/lib/domain/assistants/contextAssistant'
import { addDays } from '@/lib/domain/socialReturnIndicators'

export const runtime = 'nodejs'
export const maxDuration = 30

// POST /api/assistants/context — body: { date: string, lookbackDays?: number, limit?: number }
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
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
