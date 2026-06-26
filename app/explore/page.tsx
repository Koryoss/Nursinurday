'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CARE_COLORS, CARE_FONT, CARE_GRADIENTS, CARE_RADIUS, CARE_SHADOW } from '@/lib/designTokens'
import { parseVoiceDraftText, type VoiceAffectKey, type VoiceRecordDraft } from '@/lib/voiceDraft'

type TimeBucket = 'morning' | 'afternoon' | 'evening' | 'before_sleep' | 'attack'
type SymptomKey = 'dizziness' | 'gait' | 'tinnitus' | 'headache' | 'floaters' | 'other'
type AffectKey = VoiceAffectKey
type ContextKey = 'noise' | 'weather_change' | 'crowded'

type DailyLogSummary = {
  id: string
  bucket: TimeBucket
  created_at: string
  symptoms: Partial<Record<SymptomKey, number>>
  affect?: {
    anxiety: number | null
    tension: number | null
  }
  social?: {
    understood: boolean | null
  }
  context?: Record<ContextKey, boolean>
}

type SleepLogSummary = {
  id: string
  bedtime: string | null
  waketime: string | null
  psqi_q1: number | null
  psqi_q2: number | null
  psqi_q3: number | null
}

type DailyEditForm = {
  id: string
  bucket: TimeBucket
  symptoms: Record<SymptomKey, number>
  activeSymptoms: SymptomKey[]
  anxiety: number
  tension: number
  understood: boolean
  context: Record<ContextKey, boolean>
}

type SleepEditForm = {
  id: string
  bedtime: string
  waketime: string
  psqi_q1: number
  psqi_q2: number
  psqi_q3: number
}

type DeleteTarget = {
  type: 'daily' | 'sleep'
  id: string
  label: string
}

const SAGE = CARE_COLORS.primary
const SAGE_DARK = CARE_COLORS.primaryDark
const TEXT = CARE_COLORS.text
const TEXT_MID = CARE_COLORS.mid
const TEXT_LIGHT = CARE_COLORS.light
const BORDER = CARE_COLORS.border
const CARD = CARE_COLORS.card

const GLASS: CSSProperties = {
  background: CARD,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.9)',
  borderRadius: CARE_RADIUS.lg,
  boxShadow: CARE_SHADOW.card,
}

const BUCKETS: { value: TimeBucket; label: string; sub: string }[] = [
  { value: 'morning', label: '아침', sub: '일어난 뒤' },
  { value: 'afternoon', label: '오후', sub: '낮 시간' },
  { value: 'evening', label: '저녁', sub: '하루 마무리 전' },
  { value: 'before_sleep', label: '취침 전', sub: '잠들기 전' },
  { value: 'attack', label: '응급', sub: '즉시 기록' },
]

const SYMPTOMS: { key: SymptomKey; label: string; helper: string }[] = [
  { key: 'dizziness', label: '어지럼', helper: '빙글거리거나 흔들리는 느낌' },
  { key: 'tinnitus', label: '이명', helper: '소리가 신경 쓰였던 정도' },
  { key: 'gait', label: '걷기 불안', helper: '걸을 때 조심스러웠던 정도' },
  { key: 'headache', label: '두통', helper: '머리가 아프거나 무거웠던 정도' },
  { key: 'floaters', label: '비문증', helper: '떠다니는 것이 보였던 정도' },
  { key: 'other', label: '기타 몸 신호', helper: '말로 남기기 어려운 몸의 신호' },
]

const DEFAULT_SYMPTOM_KEYS: SymptomKey[] = ['dizziness', 'tinnitus']
const OPTIONAL_SYMPTOM_KEYS: SymptomKey[] = ['gait', 'headache', 'floaters', 'other']

const AFFECT_LABELS: Record<AffectKey, string> = {
  anxiety: '불안',
  tension: '긴장',
  sadness: '가라앉음',
  irritation: '예민함',
  fear: '두려움',
  numbness: '멍함',
  other: '기타 감정 신호',
}

const PSQI_ITEMS = [
  { key: 'psqi_q1', label: '잠드는 데 어려움이 있었나요?' },
  { key: 'psqi_q2', label: '자는 중 깨는 일이 있었나요?' },
  { key: 'psqi_q3', label: '아침에 개운함이 부족했나요?' },
] as const

const BUCKET_LABELS: Record<TimeBucket, string> = {
  morning: '아침',
  afternoon: '오후',
  evening: '저녁',
  before_sleep: '취침 전',
  attack: '응급',
}

const CONTEXT_LABELS: Record<ContextKey, string> = {
  noise: '소음',
  weather_change: '기온차',
  crowded: '붐빔',
}

const todayLocal = () => {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const getInitialBucket = (): TimeBucket => {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  if (hour < 21) return 'evening'
  return 'before_sleep'
}

const emptySymptoms = () =>
  Object.fromEntries(SYMPTOMS.map(symptom => [symptom.key, 0])) as Record<SymptomKey, number>

const symptomConfig = (key: SymptomKey) => SYMPTOMS.find(symptom => symptom.key === key)!

function ScaleRow({
  label,
  helper,
  value,
  onChange,
  max = 10,
  anchors = ['없음', '중간', '가장 심함'],
}: {
  label: string
  helper?: string
  value: number
  onChange: (value: number) => void
  max?: number
  anchors?: [string, string, string]
}) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>{label}</div>
          {helper && <div style={{ fontSize: 10.5, color: TEXT_LIGHT, marginTop: 2 }}>{helper}</div>}
        </div>
        <div
          style={{
            width: 34,
            height: 28,
            borderRadius: 10,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(163,177,138,0.14)',
            color: SAGE_DARK,
            fontSize: 13,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {value}
        </div>
      </div>
      <input
        aria-label={label}
        type="range"
        min={0}
        max={max}
        step={1}
        value={value}
        onChange={event => onChange(Number(event.target.value))}
        style={{ width: '100%', accentColor: SAGE }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: TEXT_LIGHT }}>
        {anchors.map(anchor => <span key={anchor}>{anchor}</span>)}
      </div>
    </div>
  )
}

function Section({
  title,
  children,
  aside,
}: {
  title: string
  children: ReactNode
  aside?: ReactNode
}) {
  return (
    <section style={{ ...GLASS, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: TEXT }}>{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

export default function ExplorePage() {
  const router = useRouter()
  const [logDate, setLogDate] = useState(todayLocal())
  const [bucket, setBucket] = useState<TimeBucket>(getInitialBucket())
  const [symptoms, setSymptoms] = useState<Record<SymptomKey, number>>(emptySymptoms)
  const [activeSymptoms, setActiveSymptoms] = useState<SymptomKey[]>(DEFAULT_SYMPTOM_KEYS)
  const [anxiety, setAnxiety] = useState(0)
  const [tension, setTension] = useState(0)
  const [understood, setUnderstood] = useState<boolean>(true)
  const [context, setContext] = useState<Record<ContextKey, boolean>>({ noise: false, weather_change: false, crowded: false })
  const [bedtime, setBedtime] = useState('')
  const [waketime, setWaketime] = useState('')
  const [psqi, setPsqi] = useState({ psqi_q1: 0, psqi_q2: 0, psqi_q3: 0 })
  const [saving, setSaving] = useState(false)
  const [savingSleep, setSavingSleep] = useState(false)
  const [saved, setSaved] = useState(false)
  const [sleepSaved, setSleepSaved] = useState(false)
  const [error, setError] = useState('')
  const [dailyLogs, setDailyLogs] = useState<DailyLogSummary[]>([])
  const [sleepLogs, setSleepLogs] = useState<SleepLogSummary[]>([])
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [editingDaily, setEditingDaily] = useState<DailyEditForm | null>(null)
  const [editingSleep, setEditingSleep] = useState<SleepEditForm | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [draftText, setDraftText] = useState('')
  const [voiceDraft, setVoiceDraft] = useState<VoiceRecordDraft | null>(null)
  const [draftBucket, setDraftBucket] = useState<TimeBucket | null>(null)
  const [draftSymptoms, setDraftSymptoms] = useState<VoiceRecordDraft['symptoms']>([])
  const [draftAffects, setDraftAffects] = useState<VoiceRecordDraft['affects']>([])
  const [draftContext, setDraftContext] = useState<Record<ContextKey, boolean>>({ noise: false, weather_change: false, crowded: false })
  const [draftUnderstood, setDraftUnderstood] = useState(true)
  const [savingDraft, setSavingDraft] = useState(false)

  const getSignedInUser = useCallback(async () => {
    const supabase = createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user || user.is_anonymous) {
      router.replace('/login?next=/explore')
      return { supabase, user: null }
    }

    return { supabase, user }
  }, [router])

  const loadTodaySummary = useCallback(async () => {
    setLoadingSummary(true)

    try {
      const { supabase, user } = await getSignedInUser()
      if (!user) return

      const { data: logRows, error: logError } = await supabase
        .from('daily_logs')
        .select('id,bucket,created_at')
        .eq('user_id', user.id)
        .eq('log_date', logDate)
        .order('created_at', { ascending: false })

      if (logError) throw logError

      const logs = (logRows ?? []) as { id: string; bucket: TimeBucket; created_at: string }[]
      const ids = logs.map(log => log.id)

      let symptomRows: { daily_log_id: string; symptom: SymptomKey; score: number | null }[] = []
      let affectRows: { daily_log_id: string; anxiety: number | null; tension: number | null }[] = []
      let socialRows: { daily_log_id: string; understood: boolean | null }[] = []
      let contextRows: ({ daily_log_id: string } & Record<ContextKey, boolean>)[] = []

      if (ids.length > 0) {
        const [symptomsResult, affectResult, socialResult, contextResult] = await Promise.all([
          supabase.from('symptom_scores').select('daily_log_id,symptom,score').in('daily_log_id', ids),
          supabase.from('affect_logs').select('daily_log_id,anxiety,tension').in('daily_log_id', ids),
          supabase.from('social_logs').select('daily_log_id,understood').in('daily_log_id', ids),
          supabase.from('context_tags').select('daily_log_id,noise,weather_change,crowded').in('daily_log_id', ids),
        ])

        const failed = [symptomsResult, affectResult, socialResult, contextResult].find(result => result.error)
        if (failed?.error) throw failed.error

        symptomRows = (symptomsResult.data ?? []) as typeof symptomRows
        affectRows = (affectResult.data ?? []) as typeof affectRows
        socialRows = (socialResult.data ?? []) as typeof socialRows
        contextRows = (contextResult.data ?? []) as typeof contextRows
      }

      const { data: sleepRows, error: sleepError } = await supabase
        .from('sleep_logs')
        .select('id,bedtime,waketime,psqi_q1,psqi_q2,psqi_q3')
        .eq('user_id', user.id)
        .eq('sleep_date', logDate)
        .order('id', { ascending: false })

      if (sleepError) throw sleepError

      setDailyLogs(logs.map(log => {
        const symptomMap: Partial<Record<SymptomKey, number>> = {}
        symptomRows
          .filter(row => row.daily_log_id === log.id)
          .forEach(row => {
            symptomMap[row.symptom] = row.score ?? 0
          })

        const affect = affectRows.find(row => row.daily_log_id === log.id)
        const social = socialRows.find(row => row.daily_log_id === log.id)
        const logContext = contextRows.find(row => row.daily_log_id === log.id)

        return {
          id: log.id,
          bucket: log.bucket,
          created_at: log.created_at,
          symptoms: symptomMap,
          affect: affect ? { anxiety: affect.anxiety, tension: affect.tension } : undefined,
          social: social ? { understood: social.understood } : undefined,
          context: logContext
            ? {
                noise: logContext.noise,
                weather_change: logContext.weather_change,
                crowded: logContext.crowded,
              }
            : undefined,
        }
      }))
      setSleepLogs((sleepRows ?? []) as SleepLogSummary[])
    } catch (e) {
      setError('오늘 기록을 불러오지 못했어요. 로그인 상태와 Supabase 연결을 함께 볼까요?')
    } finally {
      setLoadingSummary(false)
    }
  }, [getSignedInUser, logDate])

  useEffect(() => {
    loadTodaySummary()
  }, [loadTodaySummary])

  const saveLog = async () => {
    if (saving) return
    setSaving(true)
    setSaved(false)
    setError('')

    try {
      const { supabase, user } = await getSignedInUser()
      if (!user) return

      const { data: dailyLog, error: logError } = await supabase
        .from('daily_logs')
        .insert({
          user_id: user.id,
          log_date: logDate,
          bucket,
        })
        .select('id')
        .single()

      if (logError || !dailyLog) throw logError ?? new Error('기록을 만들 수 없습니다.')

      const dailyLogId = dailyLog.id as string
      const symptomRows = activeSymptoms.map(symptom => ({
        daily_log_id: dailyLogId,
        symptom,
        score: symptoms[symptom],
      }))

      const inserts = [
        supabase.from('symptom_scores').insert(symptomRows),
        supabase.from('affect_logs').insert({ daily_log_id: dailyLogId, anxiety, tension }),
        supabase.from('social_logs').insert({ daily_log_id: dailyLogId, understood }),
        supabase.from('context_tags').insert({ daily_log_id: dailyLogId, ...context }),
      ]

      const results = await Promise.all(inserts)
      const failed = results.find(result => result.error)
      if (failed?.error) throw failed.error

      setSaved(true)
      await loadTodaySummary()
    } catch (e) {
      setError('기록을 저장하지 못했어요. 로그인 상태와 Supabase 연결을 함께 볼까요?')
    } finally {
      setSaving(false)
    }
  }

  const saveSleepLog = async () => {
    if (savingSleep) return
    setSavingSleep(true)
    setSleepSaved(false)
    setError('')

    try {
      const { supabase, user } = await getSignedInUser()
      if (!user) return

      const { error: sleepError } = await supabase
        .from('sleep_logs')
        .insert({
          user_id: user.id,
          sleep_date: logDate,
          bedtime: bedtime || null,
          waketime: waketime || null,
          ...psqi,
        })

      if (sleepError) throw sleepError

      setSleepSaved(true)
      await loadTodaySummary()
    } catch (e) {
      setError('수면 기록을 저장하지 못했어요. 로그인 상태와 Supabase 연결을 함께 볼까요?')
    } finally {
      setSavingSleep(false)
    }
  }

  const resetForm = () => {
    setSymptoms(emptySymptoms())
    setAnxiety(0)
    setTension(0)
    setUnderstood(true)
    setContext({ noise: false, weather_change: false, crowded: false })
    setActiveSymptoms(DEFAULT_SYMPTOM_KEYS)
    setSaved(false)
    setError('')
  }

  const resetSleepForm = () => {
    setBedtime('')
    setWaketime('')
    setPsqi({ psqi_q1: 0, psqi_q2: 0, psqi_q3: 0 })
    setSleepSaved(false)
    setError('')
  }

  const createTextDraft = () => {
    const parsed = parseVoiceDraftText(draftText)
    setVoiceDraft(parsed)
    setDraftBucket(parsed.bucket)
    setDraftSymptoms(parsed.symptoms)
    setDraftAffects(parsed.affects)
    setDraftContext(parsed.context)
    setDraftUnderstood(true)
    setSaved(false)
    setError('')
  }

  const setDraftSymptomScore = (symptom: SymptomKey, score: number) => {
    setDraftSymptoms(prev => prev.map(item => item.symptom === symptom ? { ...item, score } : item))
  }

  const setDraftAffectScore = (affect: AffectKey, score: number) => {
    setDraftAffects(prev => prev.map(item => item.affect === affect ? { ...item, score } : item))
  }

  const saveTextDraft = async () => {
    if (!draftBucket || savingDraft) return
    setSavingDraft(true)
    setSaved(false)
    setError('')

    try {
      const { supabase, user } = await getSignedInUser()
      if (!user) return

      const { data: dailyLog, error: logError } = await supabase
        .from('daily_logs')
        .insert({ user_id: user.id, log_date: logDate, bucket: draftBucket })
        .select('id')
        .single()

      if (logError || !dailyLog) throw logError ?? new Error('기록을 만들 수 없습니다.')

      const dailyLogId = dailyLog.id as string
      const symptomRows = draftSymptoms.map(item => ({
        daily_log_id: dailyLogId,
        symptom: item.symptom,
        score: item.score ?? 0,
      }))
      const affectMap = Object.fromEntries(draftAffects.map(item => [item.affect, item.score ?? 0])) as Partial<Record<AffectKey, number>>
      const affectScoreRows = draftAffects.map(item => ({
        daily_log_id: dailyLogId,
        affect: item.affect,
        score: item.score ?? 0,
      }))

      const inserts = [
        supabase.from('affect_logs').insert({ daily_log_id: dailyLogId, anxiety: affectMap.anxiety ?? null, tension: affectMap.tension ?? null }),
        supabase.from('social_logs').insert({ daily_log_id: dailyLogId, understood: draftUnderstood }),
        supabase.from('context_tags').insert({ daily_log_id: dailyLogId, ...draftContext }),
      ]

      if (symptomRows.length > 0) inserts.push(supabase.from('symptom_scores').insert(symptomRows))
      if (affectScoreRows.length > 0) inserts.push(supabase.from('affect_scores').insert(affectScoreRows))

      const results = await Promise.all(inserts)
      const failed = results.find(result => result.error)
      if (failed?.error) throw failed.error

      setSaved(true)
      setDraftText('')
      setVoiceDraft(null)
      await loadTodaySummary()
    } catch (e) {
      setError('문장 초안을 저장하지 못했어요. 입력 내용을 다시 함께 볼까요?')
    } finally {
      setSavingDraft(false)
    }
  }

  const startDailyEdit = (log: DailyLogSummary) => {
    setEditingSleep(null)
    const optionalInRecord = OPTIONAL_SYMPTOM_KEYS.filter(key => Object.prototype.hasOwnProperty.call(log.symptoms, key))
    setEditingDaily({
      id: log.id,
      bucket: log.bucket,
      symptoms: {
        ...emptySymptoms(),
        ...log.symptoms,
      },
      activeSymptoms: [...DEFAULT_SYMPTOM_KEYS, ...optionalInRecord],
      anxiety: log.affect?.anxiety ?? 0,
      tension: log.affect?.tension ?? 0,
      understood: log.social?.understood ?? true,
      context: {
        noise: log.context?.noise ?? false,
        weather_change: log.context?.weather_change ?? false,
        crowded: log.context?.crowded ?? false,
      },
    })
    setError('')
  }

  const startSleepEdit = (log: SleepLogSummary) => {
    setEditingDaily(null)
    setEditingSleep({
      id: log.id,
      bedtime: log.bedtime ?? '',
      waketime: log.waketime ?? '',
      psqi_q1: log.psqi_q1 ?? 0,
      psqi_q2: log.psqi_q2 ?? 0,
      psqi_q3: log.psqi_q3 ?? 0,
    })
    setError('')
  }

  const updateDailyLog = async () => {
    if (!editingDaily || saving) return
    setSaving(true)
    setSaved(false)
    setError('')

    try {
      const { supabase, user } = await getSignedInUser()
      if (!user) return

      const { error: logError } = await supabase
        .from('daily_logs')
        .update({
          log_date: logDate,
          bucket: editingDaily.bucket,
        })
        .eq('id', editingDaily.id)
        .eq('user_id', user.id)

      if (logError) throw logError

      const symptomRows = editingDaily.activeSymptoms.map(symptom => ({
        daily_log_id: editingDaily.id,
        symptom,
        score: editingDaily.symptoms[symptom],
      }))

      const deleteSymptoms = await supabase
        .from('symptom_scores')
        .delete()
        .eq('daily_log_id', editingDaily.id)

      if (deleteSymptoms.error) throw deleteSymptoms.error

      const results = await Promise.all([
        supabase.from('symptom_scores').insert(symptomRows),
        supabase
          .from('affect_logs')
          .update({ anxiety: editingDaily.anxiety, tension: editingDaily.tension })
          .eq('daily_log_id', editingDaily.id),
        supabase
          .from('social_logs')
          .update({ understood: editingDaily.understood })
          .eq('daily_log_id', editingDaily.id),
        supabase
          .from('context_tags')
          .update(editingDaily.context)
          .eq('daily_log_id', editingDaily.id),
      ])

      const failed = results.find(result => result.error)
      if (failed?.error) throw failed.error

      setEditingDaily(null)
      setSaved(true)
      await loadTodaySummary()
    } catch (e) {
      setError('기록을 수정하지 못했어요. 로그인 상태와 Supabase 연결을 함께 볼까요?')
    } finally {
      setSaving(false)
    }
  }

  const updateSleepLog = async () => {
    if (!editingSleep || savingSleep) return
    setSavingSleep(true)
    setSleepSaved(false)
    setError('')

    try {
      const { supabase, user } = await getSignedInUser()
      if (!user) return

      const { error: sleepError } = await supabase
        .from('sleep_logs')
        .update({
          sleep_date: logDate,
          bedtime: editingSleep.bedtime || null,
          waketime: editingSleep.waketime || null,
          psqi_q1: editingSleep.psqi_q1,
          psqi_q2: editingSleep.psqi_q2,
          psqi_q3: editingSleep.psqi_q3,
        })
        .eq('id', editingSleep.id)
        .eq('user_id', user.id)

      if (sleepError) throw sleepError

      setEditingSleep(null)
      setSleepSaved(true)
      await loadTodaySummary()
    } catch (e) {
      setError('수면 기록을 수정하지 못했어요. 로그인 상태와 Supabase 연결을 함께 볼까요?')
    } finally {
      setSavingSleep(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setError('')

    try {
      const { supabase, user } = await getSignedInUser()
      if (!user) return

      if (deleteTarget.type === 'daily') {
        const { error: deleteError } = await supabase
          .from('daily_logs')
          .delete()
          .eq('id', deleteTarget.id)
          .eq('user_id', user.id)

        if (deleteError) throw deleteError
        if (editingDaily?.id === deleteTarget.id) setEditingDaily(null)
      } else {
        const { error: deleteError } = await supabase
          .from('sleep_logs')
          .delete()
          .eq('id', deleteTarget.id)
          .eq('user_id', user.id)

        if (deleteError) throw deleteError
        if (editingSleep?.id === deleteTarget.id) setEditingSleep(null)
      }

      setDeleteTarget(null)
      await loadTodaySummary()
    } catch (e) {
      setError('기록을 삭제하지 못했어요. 로그인 상태와 Supabase 연결을 함께 볼까요?')
    }
  }

  const draftHasMissingScores =
    draftSymptoms.some(item => item.score === null) ||
    draftAffects.some(item => item.score === null)
  const canSaveTextDraft = Boolean(draftBucket) && !draftHasMissingScores

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: CARE_GRADIENTS.app,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
        fontFamily: CARE_FONT,
      }}
    >
      <div
        style={{
          width: 390,
          height: 844,
          borderRadius: CARE_RADIUS.shell,
          background: CARE_GRADIENTS.shell,
          border: '1.5px solid rgba(255,255,255,0.9)',
          boxShadow: CARE_SHADOW.shell,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', width: 120, height: 36, background: '#1C1C1E', borderRadius: 18, zIndex: 20 }} />

        <header style={{ padding: '58px 22px 14px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-end' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: SAGE }} />
                <span style={{ fontSize: 20, fontWeight: 900, color: TEXT }}>CareFlow</span>
              </div>
              <p style={{ margin: '4px 0 0', color: TEXT_MID, fontSize: 11 }}>
                오늘의 자기관찰 기록
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Link
                href="/notification"
                style={{
                  color: SAGE_DARK,
                  fontSize: 12,
                  fontWeight: 900,
                  textDecoration: 'none',
                  padding: '6px 10px',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 999,
                  background: '#fff',
                }}
              >
                🔔 알림
              </Link>
              <Link href="/dashboard" style={{ color: SAGE_DARK, fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                추세 보기
              </Link>
              <form action="/auth/logout" method="post" style={{ margin: 0 }}>
                <button
                  type="submit"
                  style={{
                    border: 'none',
                    padding: 0,
                    background: 'transparent',
                    color: TEXT_LIGHT,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  로그아웃
                </button>
              </form>
            </div>
          </div>
        </header>

        <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 16px 18px', display: 'grid', gap: 12, scrollbarWidth: 'none' }}>
          <Section title="기록 시점">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 10, marginBottom: 12 }}>
              <label style={{ display: 'grid', gap: 6, fontSize: 11, color: TEXT_MID, fontWeight: 700 }}>
                날짜
                <input
                  type="date"
                  value={logDate}
                  onChange={event => setLogDate(event.target.value)}
                  style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: '10px 11px', color: TEXT, background: '#fff', fontWeight: 700 }}
                />
              </label>
              <div style={{ display: 'grid', gap: 6, fontSize: 11, color: TEXT_MID, fontWeight: 700 }}>
                구간
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6 }}>
                  {BUCKETS.slice(0, 4).map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setBucket(option.value)}
                      style={{
                        border: `1px solid ${bucket === option.value ? SAGE : BORDER}`,
                        borderRadius: 12,
                        padding: '8px 6px',
                        background: bucket === option.value ? 'rgba(163,177,138,0.18)' : '#fff',
                        color: bucket === option.value ? SAGE_DARK : TEXT_MID,
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setBucket('attack')}
              style={{
                width: '100%',
                border: `1px solid ${bucket === 'attack' ? '#D49A62' : BORDER}`,
                borderRadius: 12,
                padding: '10px 12px',
                background: bucket === 'attack' ? 'rgba(212,154,98,0.15)' : 'rgba(255,255,255,0.72)',
                color: bucket === 'attack' ? '#87521F' : TEXT_MID,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              응급 시 즉시 기록
            </button>
          </Section>

          <Section title="문장으로 입력">
            <div style={{ display: 'grid', gap: 12 }}>
              <textarea
                value={draftText}
                onChange={event => setDraftText(event.target.value)}
                placeholder="예: 오늘 아침 어지럼 7, 귀 울림은 심했고 시끄러움이 있었어요."
                style={{
                  width: '100%',
                  minHeight: 92,
                  resize: 'vertical',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 14,
                  padding: '12px 13px',
                  background: '#fff',
                  color: TEXT,
                  fontSize: 13,
                  lineHeight: 1.6,
                  fontWeight: 700,
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={createTextDraft}
                disabled={!draftText.trim()}
                style={{
                  border: 'none',
                  borderRadius: 14,
                  padding: '12px 14px',
                  background: SAGE_DARK,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 900,
                  opacity: draftText.trim() ? 1 : 0.45,
                  cursor: draftText.trim() ? 'pointer' : 'default',
                }}
              >
                기록 초안 만들기
              </button>

              {voiceDraft && (
                <div style={{ display: 'grid', gap: 12, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 14, background: 'rgba(255,255,255,0.72)' }}>
                  <div>
                    <div style={{ fontSize: 13, color: TEXT, fontWeight: 900, marginBottom: 8 }}>기록 시점 확인</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6 }}>
                      {BUCKETS.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setDraftBucket(option.value)}
                          style={{
                            border: `1px solid ${draftBucket === option.value ? SAGE : BORDER}`,
                            borderRadius: 12,
                            padding: '9px 6px',
                            background: draftBucket === option.value ? 'rgba(163,177,138,0.18)' : '#fff',
                            color: draftBucket === option.value ? SAGE_DARK : TEXT_MID,
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {draftSymptoms.length > 0 && (
                    <div style={{ display: 'grid', gap: 12 }}>
                      <div style={{ fontSize: 13, color: TEXT, fontWeight: 900 }}>몸</div>
                      {draftSymptoms.map(item => {
                        const symptom = symptomConfig(item.symptom)
                        return (
                          <ScaleRow
                            key={item.symptom}
                            label={symptom.label}
                            helper={item.score === null ? '0–10 중 어디에 가까웠나요?' : symptom.helper}
                            value={item.score ?? 0}
                            onChange={value => setDraftSymptomScore(item.symptom, value)}
                          />
                        )
                      })}
                    </div>
                  )}

                  {draftAffects.length > 0 && (
                    <div style={{ display: 'grid', gap: 12 }}>
                      <div style={{ fontSize: 13, color: TEXT, fontWeight: 900 }}>감정</div>
                      {draftAffects.map(item => (
                        <ScaleRow
                          key={item.affect}
                          label={AFFECT_LABELS[item.affect]}
                          helper={item.score === null ? '0–10 중 어디에 가까웠나요?' : '강할수록 10에 가깝게'}
                          value={item.score ?? 0}
                          onChange={value => setDraftAffectScore(item.affect, value)}
                        />
                      ))}
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize: 13, color: TEXT, fontWeight: 900, marginBottom: 8 }}>관계</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                      {[
                        { value: true, label: '있었어요' },
                        { value: false, label: '그렇지 않았어요' },
                      ].map(option => (
                        <button
                          key={option.label}
                          type="button"
                          onClick={() => setDraftUnderstood(option.value)}
                          style={{
                            border: `1px solid ${draftUnderstood === option.value ? SAGE : BORDER}`,
                            borderRadius: 14,
                            padding: '11px 8px',
                            background: draftUnderstood === option.value ? 'rgba(163,177,138,0.18)' : '#fff',
                            color: draftUnderstood === option.value ? SAGE_DARK : TEXT_MID,
                            fontSize: 12,
                            fontWeight: 800,
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 13, color: TEXT, fontWeight: 900, marginBottom: 8 }}>환경</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {(Object.keys(CONTEXT_LABELS) as ContextKey[]).map(key => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setDraftContext(prev => ({ ...prev, [key]: !prev[key] }))}
                          style={{
                            border: `1px solid ${draftContext[key] ? SAGE : BORDER}`,
                            borderRadius: 14,
                            padding: '11px 8px',
                            background: draftContext[key] ? 'rgba(163,177,138,0.18)' : '#fff',
                            color: draftContext[key] ? SAGE_DARK : TEXT_MID,
                            fontSize: 12,
                            fontWeight: 800,
                          }}
                        >
                          {draftContext[key] ? '✓ ' : ''}{CONTEXT_LABELS[key]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {voiceDraft.needsConfirmation.length > 0 && (
                    <div style={{ borderRadius: 14, background: 'rgba(197,143,91,0.12)', border: '1px solid rgba(197,143,91,0.22)', padding: 12, display: 'grid', gap: 5 }}>
                      {voiceDraft.needsConfirmation.map(item => (
                        <div key={item} style={{ fontSize: 12, lineHeight: 1.6, color: '#8A5A2C', fontWeight: 800 }}>{item}</div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={saveTextDraft}
                    disabled={!canSaveTextDraft || savingDraft}
                    style={{
                      border: 'none',
                      borderRadius: 14,
                      padding: '12px 14px',
                      background: SAGE_DARK,
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 900,
                      opacity: canSaveTextDraft && !savingDraft ? 1 : 0.45,
                      cursor: canSaveTextDraft && !savingDraft ? 'pointer' : 'default',
                    }}
                  >
                    {savingDraft ? '저장 중...' : '확인하고 기록 저장'}
                  </button>
                </div>
              )}
            </div>
          </Section>

          <Section title="몸">
            <div style={{ display: 'grid', gap: 16 }}>
              {activeSymptoms.map(symptomKey => {
                const symptom = symptomConfig(symptomKey)
                return (
                <ScaleRow
                  key={symptomKey}
                  label={symptom.label}
                  helper={symptom.helper}
                  value={symptoms[symptomKey]}
                  onChange={value => setSymptoms(prev => ({ ...prev, [symptomKey]: value }))}
                />
                )
              })}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {OPTIONAL_SYMPTOM_KEYS.filter(key => !activeSymptoms.includes(key)).map(key => {
                  const symptom = symptomConfig(key)
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveSymptoms(prev => [...prev, key])}
                      style={{
                        border: `1px solid ${BORDER}`,
                        borderRadius: 999,
                        padding: '8px 11px',
                        background: '#fff',
                        color: SAGE_DARK,
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      + {symptom.label} 추가
                    </button>
                  )
                })}
                {OPTIONAL_SYMPTOM_KEYS.filter(key => activeSymptoms.includes(key)).map(key => {
                  const symptom = symptomConfig(key)
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setActiveSymptoms(prev => prev.filter(item => item !== key))
                        setSymptoms(prev => ({ ...prev, [key]: 0 }))
                      }}
                      style={{
                        border: '1px solid rgba(180,72,44,0.22)',
                        borderRadius: 999,
                        padding: '8px 11px',
                        background: 'rgba(255,244,240,0.75)',
                        color: '#A0482C',
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      {symptom.label} 빼기
                    </button>
                  )
                })}
              </div>
            </div>
          </Section>

          <Section title="감정">
            <div style={{ display: 'grid', gap: 16 }}>
              <ScaleRow label="불안" helper="마음이 조마조마했던 정도" value={anxiety} onChange={setAnxiety} />
              <ScaleRow label="긴장" helper="몸이나 마음에 힘이 들어간 정도" value={tension} onChange={setTension} />
            </div>
          </Section>

          <Section title="관계">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {[
                { value: true, label: '이해받음' },
                { value: false, label: '그렇지 않음' },
              ].map(option => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setUnderstood(option.value)}
                  style={{
                    border: `1px solid ${understood === option.value ? SAGE : BORDER}`,
                    borderRadius: 14,
                    padding: '11px 8px',
                    background: understood === option.value ? 'rgba(163,177,138,0.18)' : '#fff',
                    color: understood === option.value ? SAGE_DARK : TEXT_MID,
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </Section>

          <Section title="환경">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { key: 'noise', label: '소음' },
                { key: 'weather_change', label: '기온차' },
                { key: 'crowded', label: '붐빔' },
              ].map(option => {
                const key = option.key as keyof typeof context
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setContext(prev => ({ ...prev, [key]: !prev[key] }))}
                    style={{
                      border: `1px solid ${context[key] ? SAGE : BORDER}`,
                      borderRadius: 14,
                      padding: '11px 8px',
                      background: context[key] ? 'rgba(163,177,138,0.18)' : '#fff',
                      color: context[key] ? SAGE_DARK : TEXT_MID,
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {context[key] ? '✓ ' : ''}{option.label}
                  </button>
                )
              })}
            </div>
          </Section>

          <Section title="수면" aside={<span style={{ fontSize: 10, color: TEXT_LIGHT }}>아침 30초</span>}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <label style={{ display: 'grid', gap: 6, fontSize: 11, color: TEXT_MID, fontWeight: 700 }}>
                취침
                <input
                  type="time"
                  value={bedtime}
                  onChange={event => setBedtime(event.target.value)}
                  style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: '10px 11px', color: TEXT, background: '#fff', fontWeight: 700 }}
                />
              </label>
              <label style={{ display: 'grid', gap: 6, fontSize: 11, color: TEXT_MID, fontWeight: 700 }}>
                기상
                <input
                  type="time"
                  value={waketime}
                  onChange={event => setWaketime(event.target.value)}
                  style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: '10px 11px', color: TEXT, background: '#fff', fontWeight: 700 }}
                />
              </label>
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              {PSQI_ITEMS.map(item => (
                <ScaleRow
                  key={item.key}
                  label={item.label}
                  value={psqi[item.key]}
                  onChange={value => setPsqi(prev => ({ ...prev, [item.key]: value }))}
                  max={3}
                  anchors={['없음', '가끔', '자주']}
                />
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginTop: 14 }}>
              <button
                type="button"
                onClick={saveSleepLog}
                disabled={savingSleep}
                style={{
                  border: 'none',
                  borderRadius: 14,
                  padding: '12px 14px',
                  background: SAGE_DARK,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 900,
                  opacity: savingSleep ? 0.65 : 1,
                }}
              >
                {savingSleep ? '저장 중...' : '수면 저장'}
              </button>
              <button
                type="button"
                onClick={resetSleepForm}
                style={{
                  border: `1px solid ${BORDER}`,
                  borderRadius: 14,
                  padding: '12px 12px',
                  background: '#fff',
                  color: TEXT_MID,
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                비우기
              </button>
            </div>
          </Section>

          {editingDaily && (
            <Section title="일일 기록 수정" aside={<span style={{ fontSize: 10, color: TEXT_LIGHT }}>선택한 기록</span>}>
              <div style={{ display: 'grid', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6 }}>
                  {BUCKETS.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setEditingDaily(prev => prev ? { ...prev, bucket: option.value } : prev)}
                      style={{
                        border: `1px solid ${editingDaily.bucket === option.value ? SAGE : BORDER}`,
                        borderRadius: 12,
                        padding: '9px 6px',
                        background: editingDaily.bucket === option.value ? 'rgba(163,177,138,0.18)' : '#fff',
                        color: editingDaily.bucket === option.value ? SAGE_DARK : TEXT_MID,
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {editingDaily.activeSymptoms.map(symptomKey => {
                  const symptom = symptomConfig(symptomKey)
                  return (
                  <ScaleRow
                    key={symptomKey}
                    label={symptom.label}
                    helper={symptom.helper}
                    value={editingDaily.symptoms[symptomKey]}
                    onChange={value => setEditingDaily(prev => prev
                      ? { ...prev, symptoms: { ...prev.symptoms, [symptomKey]: value } }
                      : prev
                    )}
                  />
                  )
                })}

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {OPTIONAL_SYMPTOM_KEYS.filter(key => !editingDaily.activeSymptoms.includes(key)).map(key => {
                    const symptom = symptomConfig(key)
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setEditingDaily(prev => prev
                          ? { ...prev, activeSymptoms: [...prev.activeSymptoms, key] }
                          : prev
                        )}
                        style={{
                          border: `1px solid ${BORDER}`,
                          borderRadius: 999,
                          padding: '8px 11px',
                          background: '#fff',
                          color: SAGE_DARK,
                          fontSize: 12,
                          fontWeight: 900,
                        }}
                      >
                        + {symptom.label} 추가
                      </button>
                    )
                  })}
                  {OPTIONAL_SYMPTOM_KEYS.filter(key => editingDaily.activeSymptoms.includes(key)).map(key => {
                    const symptom = symptomConfig(key)
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setEditingDaily(prev => prev
                          ? {
                              ...prev,
                              activeSymptoms: prev.activeSymptoms.filter(item => item !== key),
                              symptoms: { ...prev.symptoms, [key]: 0 },
                            }
                          : prev
                        )}
                        style={{
                          border: '1px solid rgba(180,72,44,0.22)',
                          borderRadius: 999,
                          padding: '8px 11px',
                          background: 'rgba(255,244,240,0.75)',
                          color: '#A0482C',
                          fontSize: 12,
                          fontWeight: 900,
                        }}
                      >
                        {symptom.label} 빼기
                      </button>
                    )
                  })}
                </div>

                <ScaleRow
                  label="불안"
                  helper="마음이 조마조마했던 정도"
                  value={editingDaily.anxiety}
                  onChange={value => setEditingDaily(prev => prev ? { ...prev, anxiety: value } : prev)}
                />
                <ScaleRow
                  label="긴장"
                  helper="몸이나 마음에 힘이 들어간 정도"
                  value={editingDaily.tension}
                  onChange={value => setEditingDaily(prev => prev ? { ...prev, tension: value } : prev)}
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {[
                    { value: true, label: '이해받음' },
                    { value: false, label: '그렇지 않음' },
                  ].map(option => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => setEditingDaily(prev => prev ? { ...prev, understood: option.value } : prev)}
                      style={{
                        border: `1px solid ${editingDaily.understood === option.value ? SAGE : BORDER}`,
                        borderRadius: 14,
                        padding: '11px 8px',
                        background: editingDaily.understood === option.value ? 'rgba(163,177,138,0.18)' : '#fff',
                        color: editingDaily.understood === option.value ? SAGE_DARK : TEXT_MID,
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    { key: 'noise', label: '소음' },
                    { key: 'weather_change', label: '기온차' },
                    { key: 'crowded', label: '붐빔' },
                  ].map(option => {
                    const key = option.key as ContextKey
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setEditingDaily(prev => prev
                          ? { ...prev, context: { ...prev.context, [key]: !prev.context[key] } }
                          : prev
                        )}
                        style={{
                          border: `1px solid ${editingDaily.context[key] ? SAGE : BORDER}`,
                          borderRadius: 14,
                          padding: '11px 8px',
                          background: editingDaily.context[key] ? 'rgba(163,177,138,0.18)' : '#fff',
                          color: editingDaily.context[key] ? SAGE_DARK : TEXT_MID,
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        {editingDaily.context[key] ? '✓ ' : ''}{option.label}
                      </button>
                    )
                  })}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
                  <button
                    type="button"
                    onClick={updateDailyLog}
                    disabled={saving}
                    style={{
                      border: 'none',
                      borderRadius: 14,
                      padding: '12px 14px',
                      background: SAGE,
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 900,
                      opacity: saving ? 0.65 : 1,
                    }}
                  >
                    {saving ? '저장 중...' : '수정 저장'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingDaily(null)}
                    style={{
                      border: `1px solid ${BORDER}`,
                      borderRadius: 14,
                      padding: '12px 12px',
                      background: '#fff',
                      color: TEXT_MID,
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    취소
                  </button>
                </div>
              </div>
            </Section>
          )}

          {editingSleep && (
            <Section title="수면 기록 수정" aside={<span style={{ fontSize: 10, color: TEXT_LIGHT }}>선택한 기록</span>}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <label style={{ display: 'grid', gap: 6, fontSize: 11, color: TEXT_MID, fontWeight: 700 }}>
                  취침
                  <input
                    type="time"
                    value={editingSleep.bedtime}
                    onChange={event => setEditingSleep(prev => prev ? { ...prev, bedtime: event.target.value } : prev)}
                    style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: '10px 11px', color: TEXT, background: '#fff', fontWeight: 700 }}
                  />
                </label>
                <label style={{ display: 'grid', gap: 6, fontSize: 11, color: TEXT_MID, fontWeight: 700 }}>
                  기상
                  <input
                    type="time"
                    value={editingSleep.waketime}
                    onChange={event => setEditingSleep(prev => prev ? { ...prev, waketime: event.target.value } : prev)}
                    style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: '10px 11px', color: TEXT, background: '#fff', fontWeight: 700 }}
                  />
                </label>
              </div>
              <div style={{ display: 'grid', gap: 14 }}>
                {PSQI_ITEMS.map(item => (
                  <ScaleRow
                    key={item.key}
                    label={item.label}
                    value={editingSleep[item.key]}
                    onChange={value => setEditingSleep(prev => prev ? { ...prev, [item.key]: value } : prev)}
                    max={3}
                    anchors={['없음', '가끔', '자주']}
                  />
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginTop: 14 }}>
                <button
                  type="button"
                  onClick={updateSleepLog}
                  disabled={savingSleep}
                  style={{
                    border: 'none',
                    borderRadius: 14,
                    padding: '12px 14px',
                    background: SAGE_DARK,
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 900,
                    opacity: savingSleep ? 0.65 : 1,
                  }}
                >
                  {savingSleep ? '저장 중...' : '수면 수정 저장'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSleep(null)}
                  style={{
                    border: `1px solid ${BORDER}`,
                    borderRadius: 14,
                    padding: '12px 12px',
                    background: '#fff',
                    color: TEXT_MID,
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  취소
                </button>
              </div>
            </Section>
          )}

          {saved && (
            <div style={{ ...GLASS, padding: 14, borderColor: 'rgba(122,158,106,0.5)', background: 'rgba(240,248,235,0.9)' }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: SAGE_DARK }}>기록이 저장됐어요.</div>
              <p style={{ margin: '4px 0 0', color: TEXT_MID, fontSize: 12, lineHeight: 1.6 }}>
                오늘의 흐름을 나중에 다시 함께 볼 수 있어요.
              </p>
            </div>
          )}

          {sleepSaved && (
            <div style={{ ...GLASS, padding: 14, borderColor: 'rgba(122,158,106,0.5)', background: 'rgba(240,248,235,0.9)' }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: SAGE_DARK }}>수면 기록이 저장됐어요.</div>
              <p style={{ margin: '4px 0 0', color: TEXT_MID, fontSize: 12, lineHeight: 1.6 }}>
                오늘 기록 목록에서 다시 확인할 수 있어요.
              </p>
            </div>
          )}

          {error && (
            <div style={{ ...GLASS, padding: 14, borderColor: 'rgba(180,72,44,0.4)', background: 'rgba(255,244,240,0.9)' }}>
              <p style={{ margin: 0, color: '#A0482C', fontSize: 12, lineHeight: 1.6 }}>{error}</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, paddingBottom: 18 }}>
            <button
              type="button"
              onClick={saveLog}
              disabled={saving}
              style={{
                border: 'none',
                borderRadius: 16,
                padding: '14px 16px',
                background: SAGE,
                color: '#fff',
                fontSize: 14,
                fontWeight: 900,
                boxShadow: '0 8px 24px rgba(122,158,106,0.28)',
                opacity: saving ? 0.65 : 1,
              }}
            >
              {saving ? '저장 중...' : 'Supabase에 저장'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              style={{
                border: `1px solid ${BORDER}`,
                borderRadius: 16,
                padding: '14px 13px',
                background: '#fff',
                color: TEXT_MID,
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              비우기
            </button>
          </div>

          <Section title="오늘 기록" aside={<span style={{ fontSize: 10, color: TEXT_LIGHT }}>{loadingSummary ? '불러오는 중' : `${dailyLogs.length + sleepLogs.length}개`}</span>}>
            <div style={{ display: 'grid', gap: 10 }}>
              {dailyLogs.length === 0 && sleepLogs.length === 0 && (
                <p style={{ margin: 0, color: TEXT_LIGHT, fontSize: 12, lineHeight: 1.6 }}>
                  아직 선택한 날짜에 저장된 기록이 없어요.
                </p>
              )}

              {sleepLogs.map(log => (
                <div key={log.id} style={{ border: `1px solid ${BORDER}`, borderRadius: 14, background: '#fff', padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 7 }}>
                    <strong style={{ color: TEXT, fontSize: 13 }}>수면</strong>
                    <span style={{ color: TEXT_LIGHT, fontSize: 11 }}>
                      {log.bedtime || '--:--'} → {log.waketime || '--:--'}
                    </span>
                  </div>
                  <div style={{ color: TEXT_MID, fontSize: 11.5, lineHeight: 1.6 }}>
                    PSQI 3문항: {log.psqi_q1 ?? 0} / {log.psqi_q2 ?? 0} / {log.psqi_q3 ?? 0}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => startSleepEdit(log)}
                      style={{
                        border: `1px solid ${BORDER}`,
                        borderRadius: 10,
                        padding: '7px 10px',
                        background: 'rgba(163,177,138,0.12)',
                        color: SAGE_DARK,
                        fontSize: 11,
                        fontWeight: 900,
                      }}
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ type: 'sleep', id: log.id, label: '수면 기록' })}
                      style={{
                        border: '1px solid rgba(180,72,44,0.28)',
                        borderRadius: 10,
                        padding: '7px 10px',
                        background: 'rgba(255,244,240,0.75)',
                        color: '#A0482C',
                        fontSize: 11,
                        fontWeight: 900,
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}

              {dailyLogs.map(log => {
                const activeContexts = log.context
                  ? (Object.entries(log.context) as [ContextKey, boolean][])
                      .filter(([, active]) => active)
                      .map(([key]) => CONTEXT_LABELS[key])
                  : []
                const recordedSymptoms = SYMPTOMS
                  .filter(symptom => Object.prototype.hasOwnProperty.call(log.symptoms, symptom.key))
                  .map(symptom => `${symptom.label} ${log.symptoms[symptom.key]}`)

                return (
                  <div key={log.id} style={{ border: `1px solid ${BORDER}`, borderRadius: 14, background: '#fff', padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                      <strong style={{ color: TEXT, fontSize: 13 }}>{BUCKET_LABELS[log.bucket]}</strong>
                      <span style={{ color: TEXT_LIGHT, fontSize: 11 }}>
                        {new Date(log.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gap: 5, color: TEXT_MID, fontSize: 11.5, lineHeight: 1.5 }}>
                      <span>
                        몸: {recordedSymptoms.length > 0 ? recordedSymptoms.join(' · ') : '기록 없음'}
                      </span>
                      <span>
                        감정: 불안 {log.affect?.anxiety ?? 0} · 긴장 {log.affect?.tension ?? 0}
                      </span>
                      <span>
                        관계: {log.social?.understood ? '이해받음' : '그렇지 않음'}
                      </span>
                      <span>
                        환경: {activeContexts.length > 0 ? activeContexts.join(' · ') : '선택 없음'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button
                        type="button"
                        onClick={() => startDailyEdit(log)}
                        style={{
                          border: `1px solid ${BORDER}`,
                          borderRadius: 10,
                          padding: '7px 10px',
                          background: 'rgba(163,177,138,0.12)',
                          color: SAGE_DARK,
                          fontSize: 11,
                          fontWeight: 900,
                        }}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ type: 'daily', id: log.id, label: `${BUCKET_LABELS[log.bucket]} 기록` })}
                        style={{
                          border: '1px solid rgba(180,72,44,0.28)',
                          borderRadius: 10,
                          padding: '7px 10px',
                          background: 'rgba(255,244,240,0.75)',
                          color: '#A0482C',
                          fontSize: 11,
                          fontWeight: 900,
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </Section>
        </main>

        {deleteTarget && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="기록 삭제 확인"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 50,
              background: 'rgba(45,52,54,0.34)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            <div
              style={{
                width: '100%',
                background: '#fff',
                borderRadius: 20,
                border: `1px solid ${BORDER}`,
                boxShadow: '0 24px 70px rgba(0,0,0,0.18)',
                padding: 18,
              }}
            >
              <h2 style={{ margin: 0, color: TEXT, fontSize: 17, fontWeight: 900 }}>
                {deleteTarget.label}을 삭제할까요?
              </h2>
              <p style={{ margin: '8px 0 16px', color: TEXT_MID, fontSize: 13, lineHeight: 1.6 }}>
                이 기록은 오늘 목록에서 사라져요. 계속 진행할까요?
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  style={{
                    border: `1px solid ${BORDER}`,
                    borderRadius: 13,
                    padding: '12px 10px',
                    background: '#fff',
                    color: TEXT_MID,
                    fontSize: 13,
                    fontWeight: 900,
                  }}
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  style={{
                    border: 'none',
                    borderRadius: 13,
                    padding: '12px 10px',
                    background: '#A0482C',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 900,
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}

        <style>{`
          main::-webkit-scrollbar{display:none}
          button:disabled{cursor:not-allowed}
        `}</style>
      </div>
    </div>
  )
}
