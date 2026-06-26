import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mean, standardDeviation } from '@/lib/socialReturnIndicators'

type WeeklyPayload = {
  week_start: string
  dhi_p: number
  dhi_e: number
  dhi_f: number
  thi: number
  hads_a: number
  hads_d: number
  vss_sf: number
}

type WeeklyRow = {
  hads_a: number | null
  hads_d: number | null
}

function toNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user || user.is_anonymous) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await request.json() as Partial<WeeklyPayload>
  const payload: WeeklyPayload = {
    week_start: typeof body.week_start === 'string' ? body.week_start : new Date().toISOString().slice(0, 10),
    dhi_p: toNumber(body.dhi_p),
    dhi_e: toNumber(body.dhi_e),
    dhi_f: toNumber(body.dhi_f),
    thi: toNumber(body.thi),
    hads_a: toNumber(body.hads_a),
    hads_d: toNumber(body.hads_d),
    vss_sf: toNumber(body.vss_sf),
  }

  const { data: previousRows, error: previousError } = await supabase
    .from('weekly_checkins')
    .select('hads_a,hads_d')
    .eq('user_id', user.id)
    .lt('week_start', payload.week_start)
    .order('week_start', { ascending: false })
    .limit(6)

  if (previousError) {
    return NextResponse.json({ error: 'previous_weekly_checkins' }, { status: 500 })
  }

  const { error: insertError } = await supabase
    .from('weekly_checkins')
    .insert({
      user_id: user.id,
      ...payload,
    })

  if (insertError) {
    return NextResponse.json({ error: 'weekly_checkins' }, { status: 500 })
  }

  const previous = (previousRows ?? []) as WeeklyRow[]
  const previousA = previous.map(row => row.hads_a).filter((value): value is number => typeof value === 'number')
  const previousD = previous.map(row => row.hads_d).filter((value): value is number => typeof value === 'number')
  const elevatedA = previousA.length >= 2 && payload.hads_a > mean(previousA) + standardDeviation(previousA)
  const elevatedD = previousD.length >= 2 && payload.hads_d > mean(previousD) + standardDeviation(previousD)

  return NextResponse.json({
    saved: true,
    safety: elevatedA || elevatedD
      ? '이번 입력에서 이전 기록보다 높게 관찰된 항목이 있어요. 혼자 감당하기 어렵게 느껴진다면 의료진이나 가까운 외부 도움 자원과 함께 확인해볼까요?'
      : null,
  })
}
