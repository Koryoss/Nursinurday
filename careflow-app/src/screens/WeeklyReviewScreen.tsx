import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import AppHeader from '../components/AppHeader'
import { Colors, Radius } from '../constants/colors'
import { fetchTimelinePatterns, fetchWeeklySummary } from '../lib/assistants'
import { supabase } from '../lib/supabase'
import { AFFECTS, BUCKETS, CONTEXT_LABELS, SYMPTOMS } from '../types/careflow'
import type { HealthRecordEntry, HealthRecordSleep, RecurringPattern } from '../../../lib/domain/assistants/types'
import { addDays, type MetricKey } from '../../../lib/domain/socialReturnIndicators'
import { buildReferralInfo, detectCrisisLevel } from '../../../lib/domain/nursingLogic'

type DailyLogRow = {
  id: string
  log_date: string
  bucket: HealthRecordEntry['bucket']
  record_source: 'direct' | 'historical_weekly_recall'
  source_period_start: string | null
  source_period_end: string | null
  is_demo: boolean
}
type SymptomRow = { daily_log_id: string; symptom: string; score: number | null }
type AffectRow = { daily_log_id: string; anxiety: number | null; tension: number | null }
type AffectScoreRow = { daily_log_id: string; affect: string; score: number | null }
type SocialRow = { daily_log_id: string; understood: boolean | null }
type ContextRow = { daily_log_id: string; noise: boolean | null; weather_change: boolean | null; crowded: boolean | null }
type SleepRow = HealthRecordSleep & { sleep_date: string; is_demo: boolean }

type SavedQuestion = {
  id: string
  text: string
  from: string
  to: string
  createdAt: string
}

const symptomLabels = new Map<string, string>(SYMPTOMS.map(item => [item.key, item.label]))
const affectLabels = new Map<string, string>(AFFECTS.map(item => [item.key, item.label]))
const bucketLabels = new Map<string, string>(BUCKETS.map(item => [item.value, item.label]))
// DashboardScreen의 METRIC_LABELS와 동일한 한글 표기를 재사용해 지표 이름 표기를 통일한다.
const metricLabels: Record<MetricKey, string> = {
  dizziness: '어지럼',
  gait: '걷기불안',
  anxiety: '불안',
  tension: '긴장',
  sleep: '수면',
}
// 반복 패턴은 여러 구간(최근 4개)에 걸친 관찰이라 7일보다 넉넉한 기간이 필요하다 (주 단위 8구간 확보).
const PATTERNS_LOOKBACK_DAYS = 55

function formatPeriodDate(date: string) {
  const [, month, day] = date.split('-')
  return `${Number(month)}월 ${Number(day)}일`
}

function scoreText(label: string, score: number | null) {
  return typeof score === 'number' ? `${label} ${score}` : label
}

function fallbackSummary(entries: HealthRecordEntry[], from: string, to: string) {
  const dates = new Set(entries.map(entry => entry.date))
  const historicalEntries = entries.filter(entry => entry.recordSource === 'historical_weekly_recall')
  if (entries.length === 0) {
    return `${formatPeriodDate(from)}부터 ${formatPeriodDate(to)}까지 남긴 기록이 아직 없어요. 먼저 하루 기록을 남겨볼까요?`
  }

  const symptomDates = new Map<string, Set<string>>()
  entries.forEach(entry => entry.symptoms.forEach(item => {
    const datesForSymptom = symptomDates.get(item.symptom) ?? new Set<string>()
    datesForSymptom.add(entry.date)
    symptomDates.set(item.symptom, datesForSymptom)
  }))
  const frequent = [...symptomDates.entries()].sort((left, right) => right[1].size - left[1].size)[0]
  const frequentText = frequent
    ? `가장 여러 날 적은 몸 신호는 ${symptomLabels.get(frequent[0]) ?? frequent[0]}이며 ${frequent[1].size}일 기록됐어요. `
    : ''

  if (entries.every(entry => entry.isDemo)) {
    return `시연용으로 만든 7일 가상자료예요. ${dates.size}일에 ${entries.length}개의 기록이 있어요. ${frequentText}날짜별 기록을 열어 화면 흐름을 확인해볼까요?`
  }

  if (historicalEntries.length === entries.length) {
    return `과거 한 주를 돌아보며 작성한 자료에서 시간대별 대표 기록 ${entries.length}개를 옮겼어요. ${frequentText}원표의 시간대별 값을 묶은 자료이므로 앱에서 그날 바로 입력한 기록과는 구분해서 함께 볼까요?`
  }

  return `지난 7일 중 ${dates.size}일에 ${entries.length}개의 기록을 남겼어요. ${frequentText}날짜별 기록을 열어 함께 확인해볼까요?`
}

function buildSuggestedQuestions(entries: HealthRecordEntry[]) {
  const suggestions: string[] = []
  const symptomDates = new Map<string, Set<string>>()
  entries.forEach(entry => entry.symptoms.forEach(item => {
    const dates = symptomDates.get(item.symptom) ?? new Set<string>()
    dates.add(entry.date)
    symptomDates.set(item.symptom, dates)
  }))
  const frequent = [...symptomDates.entries()].sort((left, right) => right[1].size - left[1].size)[0]
  if (frequent) {
    const label = symptomLabels.get(frequent[0]) ?? frequent[0]
    const historical = entries.some(entry => entry.recordSource === 'historical_weekly_recall')
    suggestions.push(historical
      ? `과거 주간 회고에서 ${label}이 여러 시간대에 기록되었습니다. 함께 살펴볼 점이 있을까요?`
      : `지난 일주일 동안 ${label}을 ${frequent[1].size}일 기록했습니다. 함께 살펴볼 점이 있을까요?`)
  }
  if (entries.some(entry => entry.sleep)) {
    suggestions.push('수면 시간과 몸 상태 기록을 함께 보여드려도 될까요?')
  }
  suggestions.push('다음 진료 전까지 어떤 내용을 더 기록하면 좋을까요?')
  return suggestions
}

async function loadEntries(from: string, to: string): Promise<HealthRecordEntry[]> {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user
  if (!user) return []

  const [logsResult, sleepsResult] = await Promise.all([
    supabase
      .from('daily_logs')
      .select('id,log_date,bucket,record_source,source_period_start,source_period_end,is_demo')
      .eq('user_id', user.id)
      .gte('log_date', from)
      .lte('log_date', to)
      .order('log_date', { ascending: false }),
    supabase
      .from('sleep_logs')
      .select('sleep_date,bedtime,waketime,psqi_q1,psqi_q2,psqi_q3,is_demo')
      .eq('user_id', user.id)
      .gte('sleep_date', from)
      .lte('sleep_date', to),
  ])
  if (logsResult.error || sleepsResult.error) throw logsResult.error ?? sleepsResult.error

  const logs = (logsResult.data ?? []) as DailyLogRow[]
  const ids = logs.map(log => log.id)
  const sleepByDate = new Map(((sleepsResult.data ?? []) as SleepRow[]).map(row => [row.sleep_date, row]))
  if (ids.length === 0) {
    return [...sleepByDate.entries()].map(([date, sleep]) => ({
      dailyLogId: `sleep-${date}`,
      date,
      bucket: 'before_sleep',
      recordSource: 'direct',
      sourcePeriodStart: null,
      sourcePeriodEnd: null,
      isDemo: sleep.is_demo,
      symptoms: [],
      affects: [],
      understood: null,
      contextTags: { noise: false, weather_change: false, crowded: false },
      sleep,
    }))
  }

  const [symptomsResult, affectsResult, affectScoresResult, socialResult, contextResult] = await Promise.all([
    supabase.from('symptom_scores').select('daily_log_id,symptom,score').in('daily_log_id', ids),
    supabase.from('affect_logs').select('daily_log_id,anxiety,tension').in('daily_log_id', ids),
    supabase.from('affect_scores').select('daily_log_id,affect,score').in('daily_log_id', ids),
    supabase.from('social_logs').select('daily_log_id,understood').in('daily_log_id', ids),
    supabase.from('context_tags').select('daily_log_id,noise,weather_change,crowded').in('daily_log_id', ids),
  ])

  const symptoms = (symptomsResult.data ?? []) as SymptomRow[]
  const affects = (affectsResult.data ?? []) as AffectRow[]
  const affectScores = (affectScoresResult.data ?? []) as AffectScoreRow[]
  const social = (socialResult.data ?? []) as SocialRow[]
  const contexts = (contextResult.data ?? []) as ContextRow[]

  const dailyEntries = logs.map(log => {
    const affectMap = new Map<string, number | null>()
    const basicAffect = affects.find(row => row.daily_log_id === log.id)
    if (typeof basicAffect?.anxiety === 'number') affectMap.set('anxiety', basicAffect.anxiety)
    if (typeof basicAffect?.tension === 'number') affectMap.set('tension', basicAffect.tension)
    affectScores.filter(row => row.daily_log_id === log.id).forEach(row => affectMap.set(row.affect, row.score))
    const context = contexts.find(row => row.daily_log_id === log.id)

    return {
      dailyLogId: log.id,
      date: log.log_date,
      bucket: log.bucket,
      recordSource: log.record_source,
      sourcePeriodStart: log.source_period_start,
      sourcePeriodEnd: log.source_period_end,
      isDemo: log.is_demo,
      symptoms: symptoms
        .filter(row => row.daily_log_id === log.id)
        .map(row => ({ symptom: row.symptom, score: row.score })),
      affects: [...affectMap.entries()].map(([affect, score]) => ({ affect, score })),
      understood: social.find(row => row.daily_log_id === log.id)?.understood ?? null,
      contextTags: {
        noise: Boolean(context?.noise),
        weather_change: Boolean(context?.weather_change),
        crowded: Boolean(context?.crowded),
      },
      sleep: sleepByDate.get(log.log_date) ?? null,
    }
  })

  const dailyDates = new Set(logs.map(log => log.log_date))
  const sleepOnlyEntries: HealthRecordEntry[] = [...sleepByDate.entries()]
    .filter(([date]) => !dailyDates.has(date))
    .map(([date, sleep]) => ({
      dailyLogId: `sleep-${date}`,
      date,
      bucket: 'before_sleep',
      recordSource: 'direct',
      sourcePeriodStart: null,
      sourcePeriodEnd: null,
      isDemo: sleep.is_demo,
      symptoms: [],
      affects: [],
      understood: null,
      contextTags: { noise: false, weather_change: false, crowded: false },
      sleep,
    }))

  return [...dailyEntries, ...sleepOnlyEntries].sort((left, right) => right.date.localeCompare(left.date))
}

function SourceRecord({ entry, showSleep }: { entry: HealthRecordEntry; showSleep: boolean }) {
  const contextLabels = Object.entries(entry.contextTags)
    .filter(([, selected]) => selected)
    .map(([key]) => CONTEXT_LABELS[key as keyof typeof CONTEXT_LABELS])
  const sleep = entry.sleep

  return (
    <View style={styles.sourceRecord}>
      <Text style={styles.sourceTime}>{bucketLabels.get(entry.bucket) ?? entry.bucket}</Text>
      {entry.isDemo ? (
        <View style={styles.demoBadge}>
          <Text style={styles.demoBadgeText}>시연용 가상 기록</Text>
        </View>
      ) : null}
      {entry.recordSource === 'historical_weekly_recall' ? (
        <View style={styles.importedBadge}>
          <Text style={styles.importedBadgeText}>과거 주간 회고에서 옮긴 대표값</Text>
          {entry.sourcePeriodStart && entry.sourcePeriodEnd ? (
            <Text style={styles.importedPeriod}>{formatPeriodDate(entry.sourcePeriodStart)}부터 {formatPeriodDate(entry.sourcePeriodEnd)}까지</Text>
          ) : null}
        </View>
      ) : null}
      {entry.symptoms.length > 0 ? (
        <Text style={styles.sourceLine}>몸: {entry.symptoms.map(item => scoreText(symptomLabels.get(item.symptom) ?? item.symptom, item.score)).join(', ')}</Text>
      ) : null}
      {entry.affects.length > 0 ? (
        <Text style={styles.sourceLine}>감정: {entry.affects.map(item => scoreText(affectLabels.get(item.affect) ?? item.affect, item.score)).join(', ')}</Text>
      ) : null}
      {entry.understood !== null ? <Text style={styles.sourceLine}>관계: {entry.understood ? '이해받았다고 기록함' : '이해받지 못했다고 기록함'}</Text> : null}
      {contextLabels.length > 0 ? <Text style={styles.sourceLine}>당시 환경: {contextLabels.join(', ')}</Text> : null}
      {sleep && showSleep ? (
        <>
          <Text style={styles.sourceLine}>수면 시간: {sleep.bedtime?.slice(0, 5) || '미기록'}부터 {sleep.waketime?.slice(0, 5) || '미기록'}까지</Text>
          <Text style={styles.sourceLine}>수면 기록: 잠드는 데 어려움 {sleep.psqi_q1 ?? '미기록'}, 자는 중 깸 {sleep.psqi_q2 ?? '미기록'}, 아침 개운함 부족 {sleep.psqi_q3 ?? '미기록'}</Text>
        </>
      ) : null}
    </View>
  )
}

export default function WeeklyReviewScreen({ endDate, onBack, onOpenRecord }: { endDate: string; onBack?: () => void; onOpenRecord?: () => void }) {
  const from = addDays(endDate, -6)
  const [entries, setEntries] = useState<HealthRecordEntry[]>([])
  const [summary, setSummary] = useState('')
  const [summarySource, setSummarySource] = useState<'local' | 'ai'>('local')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [safetyMessage, setSafetyMessage] = useState('')
  const [openDates, setOpenDates] = useState<string[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [savedQuestions, setSavedQuestions] = useState<SavedQuestion[]>([])
  const [customQuestion, setCustomQuestion] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [patterns, setPatterns] = useState<RecurringPattern[] | null>(null)
  const [patternsLoading, setPatternsLoading] = useState(false)

  const storageKey = useMemo(
    () => userId ? `careflow:visit-questions:${userId}:${from}:${endDate}` : null,
    [endDate, from, userId]
  )
  const suggestions = useMemo(() => buildSuggestedQuestions(entries), [entries])
  const groupedEntries = useMemo(() => {
    const grouped = new Map<string, HealthRecordEntry[]>()
    entries.forEach(entry => grouped.set(entry.date, [...(grouped.get(entry.date) ?? []), entry]))
    return [...grouped.entries()].sort((left, right) => right[0].localeCompare(left[0]))
  }, [entries])

  const loadReview = useCallback(async () => {
    setLoading(true)
    setMessage('')
    try {
      const localEntries = await loadEntries(from, endDate)
      setEntries(localEntries)
      setSummary(fallbackSummary(localEntries, from, endDate))
      setSummarySource('local')
      const hasHistoricalRecall = localEntries.some(entry => entry.recordSource === 'historical_weekly_recall')
      if (!hasHistoricalRecall) {
        const remoteSummary = await fetchWeeklySummary(from, endDate)
        if (remoteSummary?.summary) {
          setSummary(remoteSummary.summary)
          setSummarySource('ai')
        }
      }
    } catch {
      setMessage('기록을 불러오지 못했어요. 연결 상태를 확인한 뒤 다시 시도해볼까요?')
    } finally {
      setLoading(false)
    }
  }, [endDate, from])

  useEffect(() => {
    loadReview()
  }, [loadReview])

  useEffect(() => {
    let cancelled = false
    setPatternsLoading(true)
    setPatterns(null)
    fetchTimelinePatterns(addDays(endDate, -PATTERNS_LOOKBACK_DAYS), endDate, 'week').then(result => {
      if (cancelled) return
      setPatterns(result?.patterns ?? null)
      setPatternsLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [endDate])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  useEffect(() => {
    if (!storageKey) return
    AsyncStorage.getItem(storageKey).then(value => {
      if (!value) return
      try {
        setSavedQuestions(JSON.parse(value) as SavedQuestion[])
      } catch {
        setSavedQuestions([])
      }
    })
  }, [storageKey])

  const toggleDate = (date: string) => {
    setOpenDates(current => current.includes(date) ? current.filter(item => item !== date) : [...current, date])
  }

  const toggleQuestion = (question: string) => {
    setSelectedQuestions(current => current.includes(question) ? current.filter(item => item !== question) : [...current, question])
  }

  const saveQuestions = async () => {
    const custom = customQuestion.trim()
    setSafetyMessage('')
    if (custom) {
      const crisisLevel = detectCrisisLevel(custom)
      const referral = buildReferralInfo(crisisLevel)
      if (referral) setSafetyMessage(referral.message)
      if (crisisLevel === 'critical' || crisisLevel === 'urgent') return
    }
    const texts = [...selectedQuestions, ...(custom ? [custom] : [])]
    if (texts.length === 0) {
      setMessage('준비할 질문을 하나 이상 골라주세요.')
      return
    }
    if (!storageKey) {
      setMessage('로그인 정보를 확인한 뒤 다시 저장해 주세요.')
      return
    }
    const next = texts
      .filter(text => !savedQuestions.some(item => item.text === text))
      .map((text, index) => ({ id: `${Date.now()}-${index}`, text, from, to: endDate, createdAt: new Date().toISOString() }))
    const merged = [...savedQuestions, ...next]
    await AsyncStorage.setItem(storageKey, JSON.stringify(merged))
    setSavedQuestions(merged)
    setSelectedQuestions([])
    setCustomQuestion('')
    setMessage('진료 질문을 이 기기에 저장했어요.')
  }

  const removeQuestion = async (id: string) => {
    if (!storageKey) return
    const next = savedQuestions.filter(item => item.id !== id)
    await AsyncStorage.setItem(storageKey, JSON.stringify(next))
    setSavedQuestions(next)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader onBack={onBack} backLabel="홈" />
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadReview} tintColor={Colors.brand} />}
      >
        <View>
          <Text style={styles.pageTitle}>지난 7일 돌아보기</Text>
          <Text style={styles.period}>{formatPeriodDate(from)}부터 {formatPeriodDate(endDate)}까지</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.stepLabel}>1. 주간 회고</Text>
          {loading && !summary ? <ActivityIndicator color={Colors.brand} /> : <Text style={styles.summary}>{summary}</Text>}
          <Text style={styles.helper}>{summarySource === 'ai' ? 'AI가 원기록을 읽기 쉽게 정리했어요.' : 'AI 연결 없이 앱이 원기록을 간단히 정리했어요.'} 진단이나 원인 판단은 하지 않아요.</Text>
        </View>

        {patternsLoading || patterns !== null ? (
          <View style={styles.card}>
            <Text style={styles.stepLabel}>2. 반복 패턴 관찰</Text>
            <Text style={styles.sectionIntro}>
              최근 몇 주간 지표 흐름에서 반복해서 관찰된 변화예요. 원인이나 진단이 아니라, 개인 기준선 대비
              함께 살펴볼 만한 신호만 보여드려요.
            </Text>
            {patternsLoading ? (
              <ActivityIndicator color={Colors.brand} />
            ) : patterns && patterns.length > 0 ? (
              <View style={styles.patternList}>
                {patterns.map(pattern => (
                  <View key={pattern.metric} style={styles.patternRow}>
                    <Text style={styles.patternMetric}>{metricLabels[pattern.metric] ?? pattern.metric}</Text>
                    <Text style={styles.patternText}>{pattern.description}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.helper}>최근 몇 주간 기준선보다 반복해서 높게 관찰된 신호는 없었어요.</Text>
            )}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.stepLabel}>3. 원기록 확인</Text>
          <Text style={styles.sectionIntro}>날짜를 누르면 그날 직접 남긴 기록을 볼 수 있어요.</Text>
          {groupedEntries.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>이 기간에 확인할 기록이 없어요.</Text>
              <TouchableOpacity style={styles.secondaryButton} onPress={onOpenRecord}>
                <Text style={styles.secondaryButtonText}>오늘 기록하기</Text>
              </TouchableOpacity>
            </View>
          ) : groupedEntries.map(([date, dayEntries]) => {
            const opened = openDates.includes(date)
            return (
              <View key={date} style={styles.dayCard}>
                <TouchableOpacity style={styles.dayHeader} onPress={() => toggleDate(date)} accessibilityRole="button" accessibilityState={{ expanded: opened }}>
                  <View>
                    <Text style={styles.dayTitle}>{formatPeriodDate(date)}</Text>
                    <Text style={styles.dayCount}>{dayEntries.length}개 기록</Text>
                  </View>
                  <Text style={styles.openLabel}>{opened ? '접기' : '원기록 보기'}</Text>
                </TouchableOpacity>
                {opened ? <View style={styles.sourceList}>{dayEntries.map((entry, index) => <SourceRecord key={entry.dailyLogId} entry={entry} showSleep={index === 0} />)}</View> : null}
              </View>
            )
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.stepLabel}>4. 진료 질문 준비</Text>
          <Text style={styles.sectionIntro}>묻고 싶은 문장을 고르거나 직접 적어주세요. 선택한 내용만 저장돼요.</Text>
          <View style={styles.questionList}>
            {suggestions.map(question => {
              const selected = selectedQuestions.includes(question)
              return (
                <TouchableOpacity key={question} style={[styles.questionOption, selected && styles.questionOptionSelected]} onPress={() => toggleQuestion(question)}>
                  <View style={[styles.check, selected && styles.checkSelected]}><Text style={styles.checkText}>{selected ? '✓' : ''}</Text></View>
                  <Text style={styles.questionText}>{question}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
          <TextInput
            style={styles.input}
            value={customQuestion}
            onChangeText={setCustomQuestion}
            placeholder="직접 물어볼 내용을 적어주세요"
            placeholderTextColor={Colors.textLight}
            multiline
          />
          <TouchableOpacity style={styles.primaryButton} onPress={saveQuestions}>
            <Text style={styles.primaryButtonText}>질문 저장</Text>
          </TouchableOpacity>

          {safetyMessage ? (
            <View style={styles.safetyBox}>
              <Text style={styles.safetyText}>{safetyMessage}</Text>
            </View>
          ) : null}

          {savedQuestions.length > 0 ? (
            <View style={styles.savedSection}>
              <Text style={styles.savedTitle}>준비한 질문</Text>
              {savedQuestions.map((item, index) => (
                <View key={item.id} style={styles.savedQuestion}>
                  <Text style={styles.savedNumber}>{index + 1}</Text>
                  <Text style={styles.savedQuestionText}>{item.text}</Text>
                  <TouchableOpacity style={styles.removeButton} onPress={() => removeQuestion(item.id)} accessibilityLabel="질문 삭제">
                    <Text style={styles.removeText}>삭제</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  body: { flex: 1 },
  content: { padding: 18, paddingBottom: 40, gap: 14 },
  pageTitle: { color: Colors.text, fontSize: 26, lineHeight: 34, fontWeight: '900' },
  period: { color: Colors.textMuted, fontSize: 16, lineHeight: 24, marginTop: 3 },
  card: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.card, padding: 16, gap: 12 },
  stepLabel: { color: Colors.text, fontSize: 20, lineHeight: 28, fontWeight: '900' },
  summary: { color: Colors.text, fontSize: 17, lineHeight: 27, fontWeight: '700' },
  helper: { color: Colors.textMuted, fontSize: 14, lineHeight: 21 },
  sectionIntro: { color: Colors.textMuted, fontSize: 16, lineHeight: 24 },
  patternList: { gap: 10 },
  patternRow: { borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, padding: 12, gap: 4 },
  patternMetric: { color: Colors.brandDark, fontSize: 15, fontWeight: '900' },
  patternText: { color: Colors.text, fontSize: 15, lineHeight: 22 },
  dayCard: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, overflow: 'hidden', backgroundColor: Colors.white },
  dayHeader: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 13 },
  dayTitle: { color: Colors.text, fontSize: 17, fontWeight: '900' },
  dayCount: { color: Colors.textMuted, fontSize: 14, marginTop: 3 },
  openLabel: { color: Colors.brandDark, fontSize: 15, fontWeight: '900' },
  sourceList: { borderTopWidth: 1, borderColor: Colors.border, padding: 10, gap: 9, backgroundColor: Colors.bg },
  sourceRecord: { borderRadius: Radius.md, backgroundColor: Colors.white, padding: 12, gap: 6 },
  sourceTime: { color: Colors.brandDark, fontSize: 16, fontWeight: '900' },
  importedBadge: { alignSelf: 'flex-start', borderRadius: Radius.md, backgroundColor: Colors.environmentSoft, paddingHorizontal: 10, paddingVertical: 7 },
  importedBadgeText: { color: Colors.environment, fontSize: 14, lineHeight: 20, fontWeight: '900' },
  importedPeriod: { color: Colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 2 },
  demoBadge: { alignSelf: 'flex-start', borderRadius: Radius.md, backgroundColor: Colors.brandLight, paddingHorizontal: 10, paddingVertical: 7 },
  demoBadgeText: { color: Colors.brandDark, fontSize: 14, lineHeight: 20, fontWeight: '900' },
  sourceLine: { color: Colors.textMuted, fontSize: 15, lineHeight: 23 },
  emptyBox: { gap: 10 },
  emptyText: { color: Colors.textLight, fontSize: 16, lineHeight: 24 },
  secondaryButton: { minHeight: 50, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: Colors.brandDark, fontSize: 16, fontWeight: '900' },
  questionList: { gap: 9 },
  questionOption: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: 12, backgroundColor: Colors.white },
  questionOptionSelected: { borderColor: Colors.brand, backgroundColor: Colors.brandLight },
  check: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white },
  checkSelected: { backgroundColor: Colors.brand, borderColor: Colors.brand },
  checkText: { color: Colors.white, fontSize: 18, fontWeight: '900' },
  questionText: { flex: 1, color: Colors.text, fontSize: 16, lineHeight: 24, fontWeight: '700' },
  input: { minHeight: 92, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, padding: 13, color: Colors.text, fontSize: 16, lineHeight: 24, textAlignVertical: 'top' },
  primaryButton: { minHeight: 54, borderRadius: Radius.md, backgroundColor: Colors.brand, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: Colors.white, fontSize: 18, fontWeight: '900' },
  savedSection: { borderTopWidth: 1, borderColor: Colors.border, paddingTop: 14, gap: 9 },
  savedTitle: { color: Colors.text, fontSize: 18, fontWeight: '900' },
  savedQuestion: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: Radius.md, backgroundColor: Colors.bg, padding: 10 },
  savedNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.brand, color: Colors.white, textAlign: 'center', lineHeight: 28, fontSize: 14, fontWeight: '900', overflow: 'hidden' },
  savedQuestionText: { flex: 1, color: Colors.text, fontSize: 15, lineHeight: 22, fontWeight: '700' },
  removeButton: { minHeight: 44, minWidth: 48, alignItems: 'center', justifyContent: 'center' },
  removeText: { color: Colors.danger, fontSize: 14, fontWeight: '900' },
  message: { color: Colors.textMuted, fontSize: 15, lineHeight: 22, paddingHorizontal: 4 },
  safetyBox: { borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.danger, backgroundColor: Colors.accentSoft, padding: 12 },
  safetyText: { color: Colors.danger, fontSize: 15, lineHeight: 23, fontWeight: '800' },
})
