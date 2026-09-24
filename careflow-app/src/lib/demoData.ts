import { addDays, formatKstDate } from '../../../lib/domain/socialReturnIndicators'
import { supabase } from './supabase'

type DemoDailyLog = {
  id: string
  log_date: string
}

export type DemoWeekVerification = {
  from: string
  to: string
  dayCount: number
  logCount: number
  symptomCount: number
  affectCount: number
  socialCount: number
  contextCount: number
  sleepCount: number
  complete: boolean
}

const dizziness = [3, 4, 5, 4, 6, 3, 2]
const tinnitus = [4, 4, 5, 3, 5, 4, 3]
const gait = [2, 3, 4, 3, 4, 2, 2]
const anxiety = [3, 4, 5, 4, 5, 3, 2]
const tension = [2, 3, 4, 3, 4, 2, 2]
const understood = [true, true, false, true, false, true, true]
const buckets = ['morning', 'afternoon', 'evening', 'before_sleep', 'afternoon', 'evening', 'morning'] as const
const bedtimes = ['23:20', '23:40', '00:10', '23:30', '00:20', '23:10', '22:50']
const waketimes = ['07:00', '07:10', '07:30', '06:50', '07:40', '07:00', '06:40']

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('로그인 정보를 확인하지 못했어요.')
  return data.user.id
}

async function removeDemoRows(userId: string) {
  const sleepResult = await supabase.from('sleep_logs').delete().eq('user_id', userId).eq('is_demo', true)
  if (sleepResult.error) throw sleepResult.error

  const dailyResult = await supabase.from('daily_logs').delete().eq('user_id', userId).eq('is_demo', true)
  if (dailyResult.error) throw dailyResult.error
}

export async function deleteDemoWeek() {
  const userId = await currentUserId()
  await removeDemoRows(userId)
}

export async function verifyDemoWeek(from: string, to: string): Promise<DemoWeekVerification> {
  const userId = await currentUserId()
  const [dailyResult, sleepResult] = await Promise.all([
    supabase
      .from('daily_logs')
      .select('id,log_date')
      .eq('user_id', userId)
      .eq('is_demo', true)
      .gte('log_date', from)
      .lte('log_date', to),
    supabase
      .from('sleep_logs')
      .select('sleep_date')
      .eq('user_id', userId)
      .eq('is_demo', true)
      .gte('sleep_date', from)
      .lte('sleep_date', to),
  ])
  if (dailyResult.error || sleepResult.error) throw dailyResult.error ?? sleepResult.error

  const dailyRows = (dailyResult.data ?? []) as DemoDailyLog[]
  const ids = dailyRows.map(row => row.id)
  const empty = { data: [] as unknown[] }
  const [symptomResult, affectResult, socialResult, contextResult] = ids.length > 0
    ? await Promise.all([
        supabase.from('symptom_scores').select('daily_log_id').in('daily_log_id', ids),
        supabase.from('affect_logs').select('daily_log_id').in('daily_log_id', ids),
        supabase.from('social_logs').select('daily_log_id').in('daily_log_id', ids),
        supabase.from('context_tags').select('daily_log_id').in('daily_log_id', ids),
      ])
    : [empty, empty, empty, empty]

  const dayCount = new Set(dailyRows.map(row => row.log_date)).size
  const logCount = dailyRows.length
  const symptomCount = symptomResult.data?.length ?? 0
  const affectCount = affectResult.data?.length ?? 0
  const socialCount = socialResult.data?.length ?? 0
  const contextCount = contextResult.data?.length ?? 0
  const sleepCount = sleepResult.data?.length ?? 0

  return {
    from,
    to,
    dayCount,
    logCount,
    symptomCount,
    affectCount,
    socialCount,
    contextCount,
    sleepCount,
    complete: dayCount === 7 && logCount === 7 && symptomCount === 21 && affectCount === 7
      && socialCount === 7 && contextCount === 7 && sleepCount === 7,
  }
}

export async function prepareDemoWeek(endDate = formatKstDate()): Promise<DemoWeekVerification> {
  const userId = await currentUserId()
  const from = addDays(endDate, -6)
  const dates = Array.from({ length: 7 }, (_, index) => addDays(from, index))

  await removeDemoRows(userId)

  try {
    const dailyResult = await supabase
      .from('daily_logs')
      .insert(dates.map((date, index) => ({
        user_id: userId,
        log_date: date,
        bucket: buckets[index],
        record_source: 'direct',
        is_demo: true,
      })))
      .select('id,log_date')
    if (dailyResult.error) throw dailyResult.error

    const dailyRows = (dailyResult.data ?? []) as DemoDailyLog[]
    const indexByDate = new Map(dates.map((date, index) => [date, index]))

    const symptomResult = await supabase.from('symptom_scores').insert(dailyRows.flatMap(row => {
      const index = indexByDate.get(row.log_date) ?? 0
      return [
        { daily_log_id: row.id, symptom: 'dizziness', score: dizziness[index] },
        { daily_log_id: row.id, symptom: 'tinnitus', score: tinnitus[index] },
        { daily_log_id: row.id, symptom: 'gait', score: gait[index] },
      ]
    }))
    if (symptomResult.error) throw symptomResult.error

    const affectResult = await supabase.from('affect_logs').insert(dailyRows.map(row => {
      const index = indexByDate.get(row.log_date) ?? 0
      return { daily_log_id: row.id, anxiety: anxiety[index], tension: tension[index] }
    }))
    if (affectResult.error) throw affectResult.error

    const socialResult = await supabase.from('social_logs').insert(dailyRows.map(row => {
      const index = indexByDate.get(row.log_date) ?? 0
      return { daily_log_id: row.id, understood: understood[index] }
    }))
    if (socialResult.error) throw socialResult.error

    const contextResult = await supabase.from('context_tags').insert(dailyRows.map(row => {
      const index = indexByDate.get(row.log_date) ?? 0
      return {
        daily_log_id: row.id,
        noise: index === 1 || index === 4,
        weather_change: index === 2 || index === 4,
        crowded: index === 3,
      }
    }))
    if (contextResult.error) throw contextResult.error

    const sleepResult = await supabase.from('sleep_logs').insert(dates.map((date, index) => ({
      user_id: userId,
      sleep_date: date,
      bedtime: bedtimes[index],
      waketime: waketimes[index],
      psqi_q1: index === 2 || index === 4 ? 2 : 1,
      psqi_q2: index === 4 ? 2 : 1,
      psqi_q3: index === 2 || index === 4 ? 2 : index === 6 ? 0 : 1,
      is_demo: true,
    })))
    if (sleepResult.error) throw sleepResult.error

    const verification = await verifyDemoWeek(from, endDate)
    if (!verification.complete) throw new Error('가상자료 생성 결과가 예상한 수와 다릅니다.')
    return verification
  } catch (error) {
    await removeDemoRows(userId).catch(() => undefined)
    throw error
  }
}
