import { supabase } from './supabase'
import type { AffectKey, ContextKey, SymptomKey, TimeBucket } from '../types/careflow'

export type DailyRecordInput = {
  logDate: string
  bucket: TimeBucket
  symptoms: Partial<Record<SymptomKey, number>>
  activeSymptoms: SymptomKey[]
  affects: Partial<Record<AffectKey, number>>
  activeAffects: AffectKey[]
  understood: boolean
  context: Record<ContextKey, boolean>
  meaningNotes?: string[]
}

export type SleepRecordInput = {
  sleepDate: string
  bedtime?: string | null
  waketime?: string | null
  psqi: {
    psqi_q1: number
    psqi_q2: number
    psqi_q3: number
  }
}

export async function saveDailyRecord(input: DailyRecordInput) {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user
  if (!user) return { ok: false, message: '로그인이 필요해요.' }

  const { data: dailyLog, error: logError } = await supabase
    .from('daily_logs')
    .insert({ user_id: user.id, log_date: input.logDate, bucket: input.bucket })
    .select('id')
    .single()

  if (logError || !dailyLog) {
    return { ok: false, message: '기록을 저장하지 못했어요. 연결을 함께 볼까요?' }
  }

  const dailyLogId = dailyLog.id as string
  const results = await Promise.all([
    supabase.from('symptom_scores').insert(input.activeSymptoms.map(symptom => ({ daily_log_id: dailyLogId, symptom, score: input.symptoms[symptom] ?? 0 }))),
    supabase.from('affect_logs').insert({ daily_log_id: dailyLogId, anxiety: input.affects.anxiety ?? null, tension: input.affects.tension ?? null }),
    supabase.from('social_logs').insert({ daily_log_id: dailyLogId, understood: input.understood }),
    supabase.from('context_tags').insert({ daily_log_id: dailyLogId, ...input.context }),
  ])

  const failed = results.find(result => result.error)
  if (failed?.error) {
    return { ok: false, message: '세부 기록을 저장하지 못했어요. 연결을 함께 볼까요?' }
  }

  const { error: affectScoresError } = await supabase
    .from('affect_scores')
    .insert(input.activeAffects.map(affect => ({ daily_log_id: dailyLogId, affect, score: input.affects[affect] ?? 0 })))

  const selectedMeaningNotes = input.meaningNotes?.filter(Boolean) ?? []
  const { error: meaningError } = selectedMeaningNotes.length > 0
    ? await supabase.from('meaning_notes').insert({
        user_id: user.id,
        week_start: input.logDate,
        note: selectedMeaningNotes.join(' · '),
      })
    : { error: null }

  return {
    ok: !affectScoresError && !meaningError,
    message: affectScoresError || meaningError
      ? '기본 기록이 저장됐어요. 추가 항목 저장은 설정을 함께 볼까요?'
      : '오늘 기록이 저장됐어요.',
  }
}

export async function saveSleepRecord(input: SleepRecordInput) {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user
  if (!user) return { ok: false, message: '로그인이 필요해요.' }

  const { error } = await supabase.from('sleep_logs').insert({
    user_id: user.id,
    sleep_date: input.sleepDate,
    bedtime: input.bedtime || null,
    waketime: input.waketime || null,
    ...input.psqi,
  })

  return {
    ok: !error,
    message: error ? '수면을 저장하지 못했어요. 연결을 함께 볼까요?' : '수면이 저장됐어요.',
  }
}
