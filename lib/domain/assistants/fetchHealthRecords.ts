/**
 * Assistant 공용 기록 조회 헬퍼 (서버 전용)
 *
 * daily_logs + symptom_scores + affect_logs + affect_scores + social_logs + context_tags를
 * 조인해 HealthRecordEntry[]로 변환한다. 4개 Assistant가 이 함수를 공유해서 쓴다.
 * RLS가 본인 행만 반환하므로 user_id는 인자로만 필터링에 사용한다.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { HealthRecordAffect, HealthRecordContextTags, HealthRecordEntry, HealthRecordSleep, HealthRecordSymptom, TimeBucket } from './types'

type DailyLogRow = {
  id: string
  log_date: string
  bucket: TimeBucket
  record_source: 'direct' | 'historical_weekly_recall'
  source_period_start: string | null
  source_period_end: string | null
  is_demo: boolean
}
type SymptomRow = { daily_log_id: string; symptom: string; score: number | null }
type AffectLogRow = { daily_log_id: string; anxiety: number | null; tension: number | null }
type AffectScoreRow = { daily_log_id: string; affect: string; score: number }
type SocialRow = { daily_log_id: string; understood: boolean | null }
type ContextTagRow = { daily_log_id: string; noise: boolean | null; weather_change: boolean | null; crowded: boolean | null }
type SleepRow = {
  sleep_date: string
  bedtime: string | null
  waketime: string | null
  psqi_q1: number | null
  psqi_q2: number | null
  psqi_q3: number | null
}

export async function fetchHealthRecordEntries(
  supabase: SupabaseClient,
  userId: string,
  fromDate: string,
  toDate: string
): Promise<HealthRecordEntry[]> {
  const { data: logs, error: logsError } = await supabase
    .from('daily_logs')
    .select('id,log_date,bucket,record_source,source_period_start,source_period_end,is_demo')
    .eq('user_id', userId)
    .gte('log_date', fromDate)
    .lte('log_date', toDate)
    .order('log_date', { ascending: true })

  if (logsError || !logs?.length) return []

  const dailyLogs = logs as DailyLogRow[]
  const ids = dailyLogs.map(log => log.id)

  const [symptomsRes, affectLogsRes, affectScoresRes, socialRes, contextRes, sleepRes] = await Promise.all([
    supabase.from('symptom_scores').select('daily_log_id,symptom,score').in('daily_log_id', ids),
    supabase.from('affect_logs').select('daily_log_id,anxiety,tension').in('daily_log_id', ids),
    supabase.from('affect_scores').select('daily_log_id,affect,score').in('daily_log_id', ids),
    supabase.from('social_logs').select('daily_log_id,understood').in('daily_log_id', ids),
    supabase.from('context_tags').select('daily_log_id,noise,weather_change,crowded').in('daily_log_id', ids),
    // sleep_logs는 daily_log_id가 아닌 날짜(sleep_date) 단위 레코드라 user_id + 기간으로 별도 조회한다.
    supabase
      .from('sleep_logs')
      .select('sleep_date,bedtime,waketime,psqi_q1,psqi_q2,psqi_q3')
      .eq('user_id', userId)
      .gte('sleep_date', fromDate)
      .lte('sleep_date', toDate),
  ])

  const symptomRows = (symptomsRes.data ?? []) as SymptomRow[]
  const affectLogRows = (affectLogsRes.data ?? []) as AffectLogRow[]
  const affectScoreRows = (affectScoresRes.data ?? []) as AffectScoreRow[]
  const socialRows = (socialRes.data ?? []) as SocialRow[]
  const contextRows = (contextRes.data ?? []) as ContextTagRow[]
  const sleepRows = (sleepRes.data ?? []) as SleepRow[]

  const symptomsByLog = new Map<string, HealthRecordSymptom[]>()
  symptomRows.forEach(row => {
    const list = symptomsByLog.get(row.daily_log_id) ?? []
    list.push({ symptom: row.symptom, score: row.score })
    symptomsByLog.set(row.daily_log_id, list)
  })

  const affectsByLog = new Map<string, HealthRecordAffect[]>()
  affectLogRows.forEach(row => {
    const list = affectsByLog.get(row.daily_log_id) ?? []
    if (typeof row.anxiety === 'number') list.push({ affect: 'anxiety', score: row.anxiety })
    if (typeof row.tension === 'number') list.push({ affect: 'tension', score: row.tension })
    affectsByLog.set(row.daily_log_id, list)
  })
  affectScoreRows.forEach(row => {
    const list = affectsByLog.get(row.daily_log_id) ?? []
    list.push({ affect: row.affect, score: row.score })
    affectsByLog.set(row.daily_log_id, list)
  })

  const understoodByLog = new Map<string, boolean | null>()
  socialRows.forEach(row => understoodByLog.set(row.daily_log_id, row.understood))

  const contextByLog = new Map<string, HealthRecordContextTags>()
  contextRows.forEach(row => {
    contextByLog.set(row.daily_log_id, {
      noise: Boolean(row.noise),
      weather_change: Boolean(row.weather_change),
      crowded: Boolean(row.crowded),
    })
  })

  const sleepByDate = new Map<string, HealthRecordSleep>()
  sleepRows.forEach(row => {
    sleepByDate.set(row.sleep_date, {
      bedtime: row.bedtime,
      waketime: row.waketime,
      psqi_q1: row.psqi_q1,
      psqi_q2: row.psqi_q2,
      psqi_q3: row.psqi_q3,
    })
  })

  return dailyLogs.map(log => ({
    dailyLogId: log.id,
    date: log.log_date,
    bucket: log.bucket,
    recordSource: log.record_source,
    sourcePeriodStart: log.source_period_start,
    sourcePeriodEnd: log.source_period_end,
    isDemo: log.is_demo,
    symptoms: symptomsByLog.get(log.id) ?? [],
    affects: affectsByLog.get(log.id) ?? [],
    contextTags: contextByLog.get(log.id) ?? { noise: false, weather_change: false, crowded: false },
    understood: understoodByLog.get(log.id) ?? null,
    sleep: sleepByDate.get(log.log_date) ?? null,
  }))
}

/** meaning_notes(주간 자유 메모)를 기간 내에서 조회 — Summary Assistant의 '자유 메모' 입력으로 사용 */
export async function fetchWeeklyNotes(
  supabase: SupabaseClient,
  userId: string,
  fromWeekStart: string,
  toWeekStart: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('meaning_notes')
    .select('note,week_start')
    .eq('user_id', userId)
    .gte('week_start', fromWeekStart)
    .lte('week_start', toWeekStart)
    .not('note', 'is', null)

  if (error || !data) return []
  return (data as { note: string | null }[])
    .map(row => row.note?.trim())
    .filter((note): note is string => Boolean(note))
}

// ─────────────────────────────────────────────────────
// 날짜 파라미터 검증 (app/api/assistants/summary/route.ts에서 사용)
// ─────────────────────────────────────────────────────
const DATE_FORMAT_RE = /^\d{4}-\d{2}-\d{2}$/

function isValidCalendarDate(value: string): boolean {
  if (!DATE_FORMAT_RE.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}

/** from/to 날짜 파라미터를 검증한다. 문제가 있으면 사용자에게 보여줄 에러 메시지를, 문제 없으면 null을 반환한다. */
export function isValidDateRange(from: string, to: string): string | null {
  if (!isValidCalendarDate(from) || !isValidCalendarDate(to)) {
    return 'from/to는 YYYY-MM-DD 형식의 날짜여야 해요.'
  }
  if (from > to) {
    return 'from은 to보다 이후일 수 없어요.'
  }
  return null
}
