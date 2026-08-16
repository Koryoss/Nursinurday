/**
 * Assistant 공용 기록 조회 헬퍼 (서버 전용)
 *
 * daily_logs + symptom_scores + affect_logs + affect_scores + social_logs + context_tags를
 * 조인해 HealthRecordEntry[]로 변환한다. 4개 Assistant가 이 함수를 공유해서 쓴다.
 * RLS가 본인 행만 반환하므로 user_id는 인자로만 필터링에 사용한다.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { HealthRecordAffect, HealthRecordContextTags, HealthRecordEntry, HealthRecordSymptom, TimeBucket } from './types'

type DailyLogRow = { id: string; log_date: string; bucket: TimeBucket }
type SymptomRow = { daily_log_id: string; symptom: string; score: number | null }
type AffectLogRow = { daily_log_id: string; anxiety: number | null; tension: number | null }
type AffectScoreRow = { daily_log_id: string; affect: string; score: number }
type SocialRow = { daily_log_id: string; understood: boolean | null }
type ContextTagRow = { daily_log_id: string; noise: boolean | null; weather_change: boolean | null; crowded: boolean | null }

export async function fetchHealthRecordEntries(
  supabase: SupabaseClient,
  userId: string,
  fromDate: string,
  toDate: string
): Promise<HealthRecordEntry[]> {
  const { data: logs, error: logsError } = await supabase
    .from('daily_logs')
    .select('id,log_date,bucket')
    .eq('user_id', userId)
    .gte('log_date', fromDate)
    .lte('log_date', toDate)
    .order('log_date', { ascending: true })

  if (logsError || !logs?.length) return []

  const dailyLogs = logs as DailyLogRow[]
  const ids = dailyLogs.map(log => log.id)

  const [symptomsRes, affectLogsRes, affectScoresRes, socialRes, contextRes] = await Promise.all([
    supabase.from('symptom_scores').select('daily_log_id,symptom,score').in('daily_log_id', ids),
    supabase.from('affect_logs').select('daily_log_id,anxiety,tension').in('daily_log_id', ids),
    supabase.from('affect_scores').select('daily_log_id,affect,score').in('daily_log_id', ids),
    supabase.from('social_logs').select('daily_log_id,understood').in('daily_log_id', ids),
    supabase.from('context_tags').select('daily_log_id,noise,weather_change,crowded').in('daily_log_id', ids),
  ])

  const symptomRows = (symptomsRes.data ?? []) as SymptomRow[]
  const affectLogRows = (affectLogsRes.data ?? []) as AffectLogRow[]
  const affectScoreRows = (affectScoresRes.data ?? []) as AffectScoreRow[]
  const socialRows = (socialRes.data ?? []) as SocialRow[]
  const contextRows = (contextRes.data ?? []) as ContextTagRow[]

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

  return dailyLogs.map(log => ({
    dailyLogId: log.id,
    date: log.log_date,
    bucket: log.bucket,
    symptoms: symptomsByLog.get(log.id) ?? [],
    affects: affectsByLog.get(log.id) ?? [],
    contextTags: contextByLog.get(log.id) ?? { noise: false, weather_change: false, crowded: false },
    understood: understoodByLog.get(log.id) ?? null,
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
