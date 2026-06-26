import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  addDays,
  buildBaselines,
  buildCorrelations,
  calculateIndicatorBands,
  formatKstDate,
  type DailyMetricPoint,
  type MetricKey,
  type TrendPoint,
} from '@/lib/socialReturnIndicators'

type DailyLogRow = {
  id: string
  log_date: string
}

type SymptomRow = {
  daily_log_id: string
  symptom: MetricKey | string
  score: number | null
}

type AffectRow = {
  daily_log_id: string
  anxiety: number | null
  tension: number | null
}

type SleepRow = {
  sleep_date: string
  psqi_q1: number | null
  psqi_q2: number | null
  psqi_q3: number | null
}

function averageByDate(rows: { date: string; value: number }[]) {
  const grouped = new Map<string, number[]>()
  rows.forEach(row => {
    grouped.set(row.date, [...(grouped.get(row.date) ?? []), row.value])
  })

  return grouped
}

function avg(values: number[]) {
  if (values.length === 0) return undefined
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function buildDailyMetricPoints(logs: DailyLogRow[], symptoms: SymptomRow[], affects: AffectRow[], sleeps: SleepRow[]) {
  const logDateById = new Map(logs.map(log => [log.id, log.log_date]))
  const dates = Array.from(new Set([
    ...logs.map(log => log.log_date),
    ...sleeps.map(sleep => sleep.sleep_date),
  ])).sort()

  const symptomByMetric: Partial<Record<MetricKey, Map<string, number[]>>> = {}
  ;(['dizziness', 'gait'] as MetricKey[]).forEach(metric => {
    symptomByMetric[metric] = averageByDate(
      symptoms
        .filter(row => row.symptom === metric && typeof row.score === 'number')
        .map(row => ({ date: logDateById.get(row.daily_log_id) ?? '', value: row.score ?? 0 }))
        .filter(row => row.date)
    )
  })

  const anxietyByDate = averageByDate(
    affects
      .filter(row => typeof row.anxiety === 'number')
      .map(row => ({ date: logDateById.get(row.daily_log_id) ?? '', value: row.anxiety ?? 0 }))
      .filter(row => row.date)
  )
  const tensionByDate = averageByDate(
    affects
      .filter(row => typeof row.tension === 'number')
      .map(row => ({ date: logDateById.get(row.daily_log_id) ?? '', value: row.tension ?? 0 }))
      .filter(row => row.date)
  )
  const sleepByDate = averageByDate(
    sleeps.map(row => ({
      date: row.sleep_date,
      value: (row.psqi_q1 ?? 0) + (row.psqi_q2 ?? 0) + (row.psqi_q3 ?? 0),
    }))
  )

  return dates.map(date => ({
    date,
    dizziness: avg(symptomByMetric.dizziness?.get(date) ?? []),
    gait: avg(symptomByMetric.gait?.get(date) ?? []),
    anxiety: avg(anxietyByDate.get(date) ?? []),
    tension: avg(tensionByDate.get(date) ?? []),
    sleep: avg(sleepByDate.get(date) ?? []),
  })) as DailyMetricPoint[]
}

export async function POST() {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user || user.is_anonymous) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const fallbackDate = formatKstDate()
  const { data: latestLogRows, error: latestLogError } = await supabase
    .from('daily_logs')
    .select('log_date')
    .eq('user_id', user.id)
    .order('log_date', { ascending: false })
    .limit(1)

  if (latestLogError) return NextResponse.json({ error: 'latest_log_date' }, { status: 500 })

  const basisDate = ((latestLogRows ?? [])[0] as { log_date: string } | undefined)?.log_date ?? fallbackDate
  const baselineFrom = addDays(basisDate, -7)

  const { data: logRows, error: logError } = await supabase
    .from('daily_logs')
    .select('id,log_date')
    .eq('user_id', user.id)
    .lte('log_date', basisDate)
    .order('log_date', { ascending: true })

  if (logError) return NextResponse.json({ error: 'daily_logs' }, { status: 500 })

  const logs = (logRows ?? []) as DailyLogRow[]
  const ids = logs.map(log => log.id)

  let symptomRows: SymptomRow[] = []
  let affectRows: AffectRow[] = []

  if (ids.length > 0) {
    const [symptomsResult, affectResult] = await Promise.all([
      supabase.from('symptom_scores').select('daily_log_id,symptom,score').in('daily_log_id', ids),
      supabase.from('affect_logs').select('daily_log_id,anxiety,tension').in('daily_log_id', ids),
    ])

    if (symptomsResult.error || affectResult.error) {
      return NextResponse.json({ error: 'daily_children' }, { status: 500 })
    }

    symptomRows = (symptomsResult.data ?? []) as SymptomRow[]
    affectRows = (affectResult.data ?? []) as AffectRow[]
  }

  const { data: sleepRows, error: sleepError } = await supabase
    .from('sleep_logs')
    .select('sleep_date,psqi_q1,psqi_q2,psqi_q3')
    .eq('user_id', user.id)
    .lte('sleep_date', basisDate)
    .order('sleep_date', { ascending: true })

  if (sleepError) return NextResponse.json({ error: 'sleep_logs' }, { status: 500 })

  const points = buildDailyMetricPoints(logs, symptomRows, affectRows, (sleepRows ?? []) as SleepRow[])
  const baselinePoints = points.filter(point => point.date >= baselineFrom && point.date < basisDate)
  const baselines = buildBaselines(baselinePoints)
  const basisPoint = points.find(point => point.date === basisDate) ?? null
  const bands = calculateIndicatorBands(basisPoint, baselines)

  const baselineRows = baselines.map(baseline => ({
    user_id: user.id,
    metric: baseline.metric,
    rolling7_mean: baseline.rolling7_mean,
    rolling7_sd: baseline.rolling7_sd,
    updated_at: new Date().toISOString(),
  }))

  const { error: baselineError } = await supabase
    .from('baselines')
    .upsert(baselineRows, { onConflict: 'user_id,metric' })

  if (baselineError) return NextResponse.json({ error: 'baselines' }, { status: 500 })

  const { error: indicatorError } = await supabase
    .from('social_return_indicators')
    .upsert({
      user_id: user.id,
      ind_date: basisDate,
      readiness: bands.readiness,
      steadiness: bands.steadiness,
      activity_range: bands.activity_range,
    }, { onConflict: 'user_id,ind_date' })

  if (indicatorError) return NextResponse.json({ error: 'indicators' }, { status: 500 })

  const trend = points.map(point => ({
    date: point.date,
    dizziness: point.dizziness ?? null,
    gait: point.gait ?? null,
    anxiety: point.anxiety ?? null,
    tension: point.tension ?? null,
    sleep: point.sleep ?? null,
  })) as TrendPoint[]

  return NextResponse.json({
    date: basisDate,
    source: '기록 기반',
    baselines,
    indicators: bands,
    trend,
    correlations: buildCorrelations(trend),
  })
}
