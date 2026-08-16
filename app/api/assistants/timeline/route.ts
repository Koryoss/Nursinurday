import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/integrations/supabase/server'
import { fetchHealthRecordEntries } from '@/lib/domain/assistants/fetchHealthRecords'
import { runTimelineAssistant } from '@/lib/domain/assistants/timelineAssistant'
import { addDays, formatKstDate } from '@/lib/domain/socialReturnIndicators'
import type { TimelineGranularity } from '@/lib/domain/assistants/types'

export const runtime = 'nodejs'
export const maxDuration = 30

const VALID_GRANULARITY: TimelineGranularity[] = ['day', 'week', 'month']

// GET /api/assistants/timeline?from=YYYY-MM-DD&to=YYYY-MM-DD&granularity=week
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const to = searchParams.get('to') || formatKstDate()
  const from = searchParams.get('from') || addDays(to, -90)
  const granularityParam = searchParams.get('granularity') as TimelineGranularity | null
  const granularity: TimelineGranularity = granularityParam && VALID_GRANULARITY.includes(granularityParam)
    ? granularityParam
    : 'week'

  const entries = await fetchHealthRecordEntries(supabase, user.id, from, to)
  const result = runTimelineAssistant({ entries, granularity })

  return NextResponse.json({ from, to, granularity, ...result })
}
