import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppHeader from '../components/AppHeader'
import { Colors, Radius } from '../constants/colors'
import { supabase } from '../lib/supabase'
import { BUCKETS, type TimeBucket } from '../types/careflow'
import {
  addDays,
  buildBaselines,
  buildCorrelations,
  calculateIndicatorBands,
  formatKstDate,
  type Band,
  type CorrelationItem,
  type DailyMetricPoint,
  type MetricKey,
  type TrendPoint,
} from '../lib/socialReturnIndicators'

type DailyLogRow = { id: string; log_date: string; bucket: TimeBucket }
type SymptomRow = { daily_log_id: string; symptom: MetricKey | string; score: number | null }
type AffectRow = { daily_log_id: string; anxiety: number | null; tension: number | null }
type AffectScoreRow = { daily_log_id: string; affect: string; score: number | null }
type SocialRow = { daily_log_id: string; understood: boolean | null }
type SleepRow = {
  id?: string
  sleep_date: string
  bedtime?: string | null
  waketime?: string | null
  psqi_q1: number | null
  psqi_q2: number | null
  psqi_q3: number | null
}
type SavedDailyLog = {
  id: string
  bucket: TimeBucket
  symptomCount: number
  emotionCount: number
  relationCount: number
}
type SavedSleepLog = { id?: string; bedtime: string | null; waketime: string | null }

type DashboardData = {
  date: string
  availableDates: string[]
  indicators: { readiness: Band; steadiness: Band; activity_range: Band }
  trend: TrendPoint[]
  correlations: CorrelationItem[]
  savedDailyLogs: SavedDailyLog[]
  savedSleepLogs: SavedSleepLog[]
}

type WeeklyTrendPoint = TrendPoint & { range: string }

type DashboardScreenProps = {
  onOpenRecord?: () => void
  onOpenNotification?: () => void
}

const BAND_LABELS: Record<Band, string> = {
  low: '낮음',
  normal: '보통',
  high: '높음',
}

const BAND_COLORS: Record<Band, string> = {
  low: Colors.accent,
  normal: Colors.brand,
  high: Colors.brandDark,
}

const METRIC_LABELS: { key: MetricKey; label: string; max: number; color: string }[] = [
  { key: 'dizziness', label: '어지럼', max: 10, color: Colors.body },
  { key: 'gait', label: '걷기불안', max: 10, color: Colors.relation },
  { key: 'anxiety', label: '불안', max: 10, color: Colors.emotion },
  { key: 'tension', label: '긴장', max: 10, color: Colors.accent },
  { key: 'sleep', label: '수면', max: 30, color: Colors.brandDark },
]

const BUCKET_ICONS: Record<TimeBucket, string> = {
  morning: '🌅',
  afternoon: '☀️',
  evening: '🌙',
  before_sleep: '🛏️',
  attack: '🚨',
}

function averageByDate(rows: { date: string; value: number }[]) {
  const grouped = new Map<string, number[]>()
  rows.forEach(row => grouped.set(row.date, [...(grouped.get(row.date) ?? []), row.value]))
  return grouped
}

function avg(values: number[]) {
  if (values.length === 0) return undefined
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function avgNullable(values: (number | null)[]) {
  const numeric = values.filter((value): value is number => typeof value === 'number')
  if (numeric.length === 0) return null
  return avg(numeric) ?? null
}

function formatShortDate(date: string) {
  return date.slice(5).replace('-', '/')
}

function hasMetricValue(point: TrendPoint | WeeklyTrendPoint) {
  return ['dizziness', 'gait', 'anxiety', 'tension', 'sleep'].some(key => typeof point[key as MetricKey] === 'number')
}

function buildWeeklyTrend(points: TrendPoint[]): WeeklyTrendPoint[] {
  const sorted = [...points].filter(hasMetricValue).sort((left, right) => left.date.localeCompare(right.date))
  if (sorted.length === 0) return []
  const firstDate = sorted[0].date
  const lastDate = sorted[sorted.length - 1].date
  const weeks: WeeklyTrendPoint[] = []

  for (let weekStart = firstDate, index = 0; weekStart <= lastDate; weekStart = addDays(weekStart, 7), index += 1) {
    const weekEnd = addDays(weekStart, 6)
    const rows = sorted.filter(point => point.date >= weekStart && point.date <= weekEnd)
    const week = {
      date: `${weeks.length + 1}주`,
      range: `${formatShortDate(weekStart)}-${formatShortDate(weekEnd)}`,
      dizziness: avgNullable(rows.map(point => point.dizziness)),
      gait: avgNullable(rows.map(point => point.gait)),
      anxiety: avgNullable(rows.map(point => point.anxiety)),
      tension: avgNullable(rows.map(point => point.tension)),
      sleep: avgNullable(rows.map(point => point.sleep)),
    }
    if (hasMetricValue(week)) weeks.push(week)
  }

  return weeks
}

function buildDailyMetricPoints(logs: DailyLogRow[], symptoms: SymptomRow[], affects: AffectRow[], sleeps: SleepRow[]) {
  const logDateById = new Map(logs.map(log => [log.id, log.log_date]))
  const dates = Array.from(new Set([...logs.map(log => log.log_date), ...sleeps.map(sleep => sleep.sleep_date)])).sort()
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
    sleeps
      .filter(row => [row.psqi_q1, row.psqi_q2, row.psqi_q3].some(value => typeof value === 'number'))
      .map(row => ({ date: row.sleep_date, value: (row.psqi_q1 ?? 0) + (row.psqi_q2 ?? 0) + (row.psqi_q3 ?? 0) }))
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

function indicatorCopy(name: string, band: Band) {
  if (band === 'high') return `${name}이 평소보다 높게 관찰돼요. 오늘 기록과 함께 볼까요?`
  if (band === 'low') return `${name}이 평소보다 낮게 관찰돼요. 부담을 줄일 방법을 고려해볼까요?`
  return `${name}이 평소와 비슷하게 관찰돼요. 기록을 이어가며 함께 볼까요?`
}

function correlationCopy(item: CorrelationItem) {
  if (item.direction === 'together') {
    return `${item.pair}은 같은 방향으로 움직이는 흐름이 관찰돼요. 같은 날의 기록을 함께 볼까요?`
  }
  if (item.direction === 'opposite') {
    return `${item.pair}은 서로 다른 방향으로 움직이는 흐름이 관찰돼요. 어떤 날에 달라졌는지 함께 볼까요?`
  }
  return `${item.pair}은 아직 흐름이 뚜렷하지 않아요. 기록이 더 쌓이면 함께 볼까요?`
}

function BandCard({ title, band }: { title: string; band: Band }) {
  return (
    <View style={styles.bandCard}>
      <View style={styles.bandTop}>
        <Text style={styles.bandTitle}>{title}</Text>
        <View style={[styles.bandPill, { backgroundColor: BAND_COLORS[band] }]}>
          <Text style={styles.bandPillText}>{BAND_LABELS[band]}</Text>
        </View>
      </View>
      <Text style={styles.bandCopy}>{indicatorCopy(title, band)}</Text>
    </View>
  )
}

function formatSleepTime(value: string | null) {
  if (!value) return '-'
  return value.slice(0, 5)
}

function dateParts(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return { year, month, day }
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function weekdayLabel(year: number, month: number, day: number) {
  return ['일', '월', '화', '수', '목', '금', '토'][new Date(year, month - 1, day).getDay()]
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function DateDropdown({ date, onSelect }: { date: string; onSelect: (date: string) => void }) {
  const [picker, setPicker] = useState<'year' | 'month' | 'day' | null>(null)
  const { year, month, day } = dateParts(date)
  const currentYear = dateParts(formatKstDate()).year
  const yearOptions = Array.from({ length: 11 }, (_, index) => currentYear - 5 + index)
  const monthOptions = Array.from({ length: 12 }, (_, index) => index + 1)
  const dayOptions = Array.from({ length: daysInMonth(year, month) }, (_, index) => index + 1)

  const applyPart = (part: 'year' | 'month' | 'day', value: number) => {
    const nextYear = part === 'year' ? value : year
    const nextMonth = part === 'month' ? value : month
    const maxDay = daysInMonth(nextYear, nextMonth)
    const nextDay = part === 'day' ? value : Math.min(day, maxDay)
    onSelect(formatDate(nextYear, nextMonth, nextDay))
    setPicker(null)
  }

  const pickerOptions = picker === 'year'
    ? yearOptions
    : picker === 'month'
      ? monthOptions
      : dayOptions

  return (
    <View style={styles.dateDropdownCard}>
      <Text style={styles.dateDropdownTitle}>기준일</Text>
      <View style={styles.dateMoveRow}>
        <TouchableOpacity onPress={() => onSelect(addDays(date, -1))} accessibilityLabel="이전 날짜" style={styles.dateMoveButton}>
          <Text style={styles.dateMoveText}>◀</Text>
        </TouchableOpacity>
        <View style={styles.datePartRow}>
        <TouchableOpacity style={styles.datePartButton} onPress={() => setPicker('year')} accessibilityLabel="연도 선택">
          <Text style={styles.datePartText}>{year}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.datePartButton} onPress={() => setPicker('month')} accessibilityLabel="월 선택">
          <Text style={styles.datePartText}>{month}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.datePartButton} onPress={() => setPicker('day')} accessibilityLabel="일 선택">
          <Text style={styles.datePartText}>{day}</Text>
        </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => onSelect(addDays(date, 1))} accessibilityLabel="다음 날짜" style={styles.dateMoveButton}>
          <Text style={styles.dateMoveText}>▶</Text>
        </TouchableOpacity>
      </View>
      <Modal visible={picker !== null} transparent animationType="fade" onRequestClose={() => setPicker(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.dateModalCard}>
            <Text style={styles.dateModalTitle}>{picker === 'year' ? '연도 선택' : picker === 'month' ? '월 선택' : '일 선택'}</Text>
            <ScrollView style={styles.dateModalList} contentContainerStyle={styles.dateModalContent}>
              {pickerOptions.map(option => {
                const selected = picker === 'year' ? option === year : picker === 'month' ? option === month : option === day
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.dateOption, selected && styles.dateOptionActive]}
                    onPress={() => {
                      if (picker) applyPart(picker, option)
                    }}
                  >
                    <Text style={[styles.dateOptionText, selected && styles.dateOptionTextActive]}>
                      {picker === 'year' ? `${option}년` : picker === 'month' ? `${option}월` : `${option}일 · ${weekdayLabel(year, month, option)}`}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
            <TouchableOpacity style={styles.dateModalClose} onPress={() => setPicker(null)}>
              <Text style={styles.dateModalCloseText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

function SavedRecordsGraphic({ dailyLogs, sleepLogs }: { dailyLogs: SavedDailyLog[]; sleepLogs: SavedSleepLog[] }) {
  const [selectedAxis, setSelectedAxis] = useState<'몸' | '감정' | '관계' | '의미'>('몸')
  const hasRecords = dailyLogs.length > 0 || sleepLogs.length > 0
  const grouped = Array.from(
    dailyLogs.reduce((map, log) => {
      const prev = map.get(log.bucket) ?? { bucket: log.bucket, symptomCount: 0, emotionCount: 0, relationCount: 0 }
      map.set(log.bucket, {
        bucket: log.bucket,
        symptomCount: prev.symptomCount + log.symptomCount,
        emotionCount: prev.emotionCount + log.emotionCount,
        relationCount: prev.relationCount + log.relationCount,
      })
      return map
    }, new Map<TimeBucket, { bucket: TimeBucket; symptomCount: number; emotionCount: number; relationCount: number }>())
  ).map(([, value]) => value)

  const totals = grouped.reduce(
    (sum, item) => ({
      body: sum.body + item.symptomCount,
      emotion: sum.emotion + item.emotionCount,
      relation: sum.relation + item.relationCount,
    }),
    { body: sleepLogs.length > 0 ? 1 : 0, emotion: 0, relation: 0 }
  )

  const axisCards = [
    { label: '몸', active: totals.body > 0, color: Colors.body, soft: Colors.bodySoft },
    { label: '감정', active: totals.emotion > 0, color: Colors.emotion, soft: Colors.emotionSoft },
    { label: '관계', active: totals.relation > 0, color: Colors.relation, soft: Colors.relationSoft },
    { label: '의미', active: false, color: Colors.meaning, soft: Colors.meaningSoft },
  ] as const
  const axisDetails: Record<'몸' | '감정' | '관계' | '의미', string> = {
    몸: totals.body > 0 ? `몸 신호와 수면 기록이 ${totals.body}개 관찰돼요.` : '몸 기록은 아직 없어요.',
    감정: totals.emotion > 0 ? `감정 신호가 ${totals.emotion}개 기록돼 있어요.` : '감정 기록은 아직 없어요.',
    관계: totals.relation > 0 ? '관계 기록이 함께 저장돼 있어요.' : '관계 기록은 아직 없어요.',
    의미: '의미 기록은 아직 별도 저장 항목으로 연결되지 않았어요.',
  }

  return (
    <View style={styles.savedGraphic}>
      <Text style={styles.savedGraphicTitle}>오늘 저장된 기록</Text>
      {!hasRecords ? <Text style={styles.empty}>아직 저장된 기록이 없어요.</Text> : null}
      {hasRecords ? (
        <View style={styles.axisSummaryRow}>
          {axisCards.map(axis => (
            <TouchableOpacity
              key={axis.label}
              onPress={() => setSelectedAxis(axis.label)}
              style={[
                styles.axisSummaryCard,
                { backgroundColor: axis.active ? axis.soft : Colors.bg, borderColor: selectedAxis === axis.label ? axis.color : Colors.border },
              ]}
            >
              <Text style={[styles.axisSummaryText, { color: axis.active ? axis.color : Colors.textLight }]}>{axis.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
      {hasRecords ? (
        <View style={styles.axisDetailBox}>
          <Text style={styles.axisDetailText}>{axisDetails[selectedAxis]}</Text>
        </View>
      ) : null}
      {grouped.map(log => {
        const label = BUCKETS.find(item => item.value === log.bucket)?.label ?? log.bucket
        const parts = [
          log.symptomCount > 0 ? `몸 신호 ${log.symptomCount}개` : null,
          log.emotionCount > 0 ? `감정 ${log.emotionCount}개` : null,
          log.relationCount > 0 ? '관계 기록' : null,
        ].filter(Boolean)

        return (
          <View key={log.bucket} style={styles.recordSummaryRow}>
            <Text style={styles.recordSummaryIcon}>{BUCKET_ICONS[log.bucket]}</Text>
            <Text style={styles.recordSummaryText}>
              {label}{parts.length > 0 ? ` · ${parts.join(' · ')}` : ''}
            </Text>
          </View>
        )
      })}
      {sleepLogs.map((log, index) => (
        <View key={log.id ?? `sleep-${index}`} style={styles.sleepGraphicRow}>
          <Text style={styles.sleepIcon}>🛏️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.sleepGraphicTitle}>수면</Text>
            <Text style={styles.sleepGraphicText}>{formatSleepTime(log.bedtime)}부터 {formatSleepTime(log.waketime)}까지</Text>
          </View>
        </View>
      ))}
    </View>
  )
}

function WaveSegment({ x1, y1, x2, y2, color }: { x1: number; y1: number; x2: number; y2: number; color: string }) {
  const length = Math.hypot(x2 - x1, y2 - y1)
  const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI)
  return (
    <View
      style={[
        styles.waveSegment,
        {
          width: length,
          left: (x1 + x2) / 2 - length / 2,
          top: (y1 + y2) / 2 - 2,
          backgroundColor: color,
          transform: [{ rotate: `${angle}deg` }],
        },
      ]}
    />
  )
}

function TrendGraph({ trend }: { trend: TrendPoint[] }) {
  const rows = buildWeeklyTrend(trend)
  if (rows.length === 0) return <Text style={styles.empty}>아직 추세로 볼 기록이 없어요.</Text>
  const graphWidth = Math.max(rows.length * 58, 320)
  const graphHeight = 156
  const xStep = rows.length > 1 ? (graphWidth - 44) / (rows.length - 1) : 0
  const metrics = METRIC_LABELS.filter(metric => ['dizziness', 'gait', 'anxiety', 'sleep'].includes(metric.key))
  const waveGroups = metrics.map(metric => {
    const points = rows.map((row, index) => {
      const raw = row[metric.key]
      if (typeof raw !== 'number') return null
      const value = Math.max(0, Math.min(metric.max, raw))
      return {
        x: 22 + index * xStep,
        y: 124 - (value / metric.max) * 86,
      }
    }).filter((point): point is { x: number; y: number } => point !== null)
    return { metric, points }
  }).filter(group => group.points.length > 0)

  return (
    <View style={styles.graphWrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.waveCanvas, { width: graphWidth, height: graphHeight }]}>
          <View style={[styles.waveGuideLine, { top: 38 }]} />
          <View style={[styles.waveGuideLine, { top: 78 }]} />
          <View style={[styles.waveGuideLine, { top: 118 }]} />
          {waveGroups.map(group => (
            <View key={group.metric.key} style={StyleSheet.absoluteFill}>
              {group.points.slice(0, -1).map((point, index) => {
                const next = group.points[index + 1]
                return <WaveSegment key={`${group.metric.key}-${index}`} x1={point.x} y1={point.y} x2={next.x} y2={next.y} color={group.metric.color} />
              })}
              {group.points.map((point, index) => (
                <View
                  key={`${group.metric.key}-dot-${index}`}
                  style={[
                    styles.waveDot,
                    {
                      left: point.x - 4,
                      top: point.y - 4,
                      backgroundColor: group.metric.color,
                      opacity: 0.95,
                    },
                  ]}
                />
              ))}
            </View>
          ))}
          <View style={styles.dateRow}>
            {rows.map(point => (
              <Text key={point.date} style={styles.dateTick}>{point.date}</Text>
            ))}
          </View>
        </View>
      </ScrollView>
      <View style={styles.waveLegendRow}>
        {metrics.map(metric => (
          <View key={metric.key} style={styles.waveLegendItem}>
            <View style={[styles.waveLegendDot, { backgroundColor: metric.color }]} />
            <Text style={styles.waveLegendText}>{metric.label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.rangeRow}>
        {rows.slice(0, 1).map(point => (
          <Text key={point.range} style={styles.graphRangeText}>시작 {point.range}</Text>
        ))}
        <Text style={styles.graphRangeText}>최근 {rows[rows.length - 1].range}</Text>
      </View>
    </View>
  )
}

export default function DashboardScreen({ onOpenRecord, onOpenNotification }: DashboardScreenProps) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedDate, setSelectedDate] = useState(formatKstDate())

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setMessage('')
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) {
      setLoading(false)
      return
    }

    const [logsResult, sleepsResult] = await Promise.all([
      supabase
        .from('daily_logs')
        .select('id,log_date,bucket')
        .eq('user_id', user.id)
        .order('log_date', { ascending: true }),
      supabase
        .from('sleep_logs')
        .select('id,sleep_date,bedtime,waketime,psqi_q1,psqi_q2,psqi_q3')
        .eq('user_id', user.id)
        .order('sleep_date', { ascending: true }),
    ])

    if (logsResult.error || sleepsResult.error) {
      setMessage('기록을 불러오지 못했어요. 연결을 함께 볼까요?')
      setLoading(false)
      return
    }

    const allLogs = (logsResult.data ?? []) as DailyLogRow[]
    const allSleeps = (sleepsResult.data ?? []) as SleepRow[]
    const availableDatesAsc = Array.from(new Set([...allLogs.map(log => log.log_date), ...allSleeps.map(sleep => sleep.sleep_date)])).sort()
    const basisDate = selectedDate
    const availableDates = [...availableDatesAsc].reverse()
    const baselineFrom = addDays(basisDate, -7)
    const logs = allLogs.filter(log => log.log_date <= basisDate)
    const sleeps = allSleeps.filter(sleep => sleep.sleep_date <= basisDate)
    const ids = logs.map(log => log.id)
    let symptomRows: SymptomRow[] = []
    let affectRows: AffectRow[] = []
    let affectScoreRows: AffectScoreRow[] = []
    let socialRows: SocialRow[] = []

    if (ids.length > 0) {
      const [symptomsResult, affectResult, affectScoresResult, socialResult] = await Promise.all([
        supabase.from('symptom_scores').select('daily_log_id,symptom,score').in('daily_log_id', ids),
        supabase.from('affect_logs').select('daily_log_id,anxiety,tension').in('daily_log_id', ids),
        supabase.from('affect_scores').select('daily_log_id,affect,score').in('daily_log_id', ids),
        supabase.from('social_logs').select('daily_log_id,understood').in('daily_log_id', ids),
      ])
      symptomRows = (symptomsResult.data ?? []) as SymptomRow[]
      affectRows = (affectResult.data ?? []) as AffectRow[]
      affectScoreRows = (affectScoresResult.data ?? []) as AffectScoreRow[]
      socialRows = (socialResult.data ?? []) as SocialRow[]
    }

    const points = buildDailyMetricPoints(logs, symptomRows, affectRows, sleeps)
    const baselinePoints = points.filter(point => point.date >= baselineFrom && point.date < basisDate)
    const baselines = buildBaselines(baselinePoints)
    const basisPoint = points.find(point => point.date === basisDate) ?? null
    const indicators = calculateIndicatorBands(basisPoint, baselines)

    if (baselines.length > 0) {
      await supabase.from('baselines').upsert(
        baselines.map(baseline => ({
          user_id: user.id,
          metric: baseline.metric,
          rolling7_mean: baseline.rolling7_mean,
          rolling7_sd: baseline.rolling7_sd,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: 'user_id,metric' }
      )
    }

    await supabase.from('social_return_indicators').upsert({
      user_id: user.id,
      ind_date: basisDate,
      readiness: indicators.readiness,
      steadiness: indicators.steadiness,
      activity_range: indicators.activity_range,
    }, { onConflict: 'user_id,ind_date' })

    const trend = points.map(point => ({
      date: point.date,
      dizziness: point.dizziness ?? null,
      gait: point.gait ?? null,
      anxiety: point.anxiety ?? null,
      tension: point.tension ?? null,
      sleep: point.sleep ?? null,
    })) as TrendPoint[]

    const weeklyTrend = buildWeeklyTrend(trend)
    const savedDailyLogs = logs
      .filter(log => log.log_date === basisDate)
      .map(log => {
        const affectLog = affectRows.find(row => row.daily_log_id === log.id)
        const emotionKeys = new Set<string>()
        if (typeof affectLog?.anxiety === 'number') emotionKeys.add('anxiety')
        if (typeof affectLog?.tension === 'number') emotionKeys.add('tension')
        affectScoreRows
          .filter(row => row.daily_log_id === log.id && typeof row.score === 'number')
          .forEach(row => emotionKeys.add(row.affect))

        return {
          id: log.id,
          bucket: log.bucket,
          symptomCount: symptomRows.filter(row => row.daily_log_id === log.id).length,
          emotionCount: emotionKeys.size,
          relationCount: socialRows.some(row => row.daily_log_id === log.id && typeof row.understood === 'boolean') ? 1 : 0,
        }
      })
    const savedSleepLogs = sleeps
      .filter(row => row.sleep_date === basisDate)
      .map(row => ({ id: row.id, bedtime: row.bedtime ?? null, waketime: row.waketime ?? null }))

    setData({
      date: basisDate,
      availableDates,
      indicators,
      trend,
      correlations: buildCorrelations(weeklyTrend),
      savedDailyLogs,
      savedSleepLogs,
    })
    setLoading(false)
  }, [selectedDate])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const displayDate = data?.date ?? selectedDate

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader
        bottom={(
          <View style={styles.quickActions}>
            <TouchableOpacity style={[styles.quickActionButton, styles.quickActionPrimary]} onPress={onOpenRecord} accessibilityLabel="기록하기">
              <Text style={styles.quickActionText}>✍️ 기록하기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickActionButton, styles.quickActionSecondary]} onPress={onOpenNotification} accessibilityLabel="알림설정">
              <Text style={styles.quickActionText}>🔔 알림설정</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadDashboard} tintColor={Colors.brand} />}
      >
        <DateDropdown date={displayDate} onSelect={setSelectedDate} />

        {data ? <SavedRecordsGraphic dailyLogs={data.savedDailyLogs} sleepLogs={data.savedSleepLogs} /> : null}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>지표 요약</Text>
          {!data && <Text style={styles.empty}>{loading ? '기록을 바탕으로 지표를 불러오고 있어요.' : '기록을 저장하면 지표를 함께 볼 수 있어요.'}</Text>}
          {data && (
            <View style={{ gap: 10 }}>
              <BandCard title="걸음 안정도" band={data.indicators.steadiness} />
              <BandCard title="활동 범위" band={data.indicators.activity_range} />
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>누적 기록 그래프</Text>
          <TrendGraph trend={data?.trend ?? []} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>관찰된 연관</Text>
          <Text style={styles.note}>누적 기록에서 함께 움직인 항목을 조심스럽게 묶어 보여줘요.</Text>
          {(data?.correlations ?? []).map(item => (
            <View key={item.pair} style={styles.correlationRow}>
              <Text style={styles.correlationTitle}>{item.pair}</Text>
              <Text style={styles.correlationText}>{correlationCopy(item)}</Text>
            </View>
          ))}
          {data && data.correlations.length === 0 ? <Text style={styles.empty}>연관을 살펴볼 기록이 더 필요해요.</Text> : null}
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}
        {loading ? <ActivityIndicator color={Colors.brand} /> : null}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  body: { flex: 1 },
  bodyContent: { padding: 18, paddingBottom: 36, gap: 14 },
  quickActions: { flexDirection: 'row', gap: 18 },
  quickActionButton: {
    flex: 1,
    minHeight: 94,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionPrimary: { backgroundColor: 'rgba(92,122,94,0.08)', borderColor: 'rgba(92,122,94,0.08)' },
  quickActionSecondary: { backgroundColor: Colors.white, borderColor: Colors.border },
  quickActionText: { color: Colors.text, fontSize: 22, fontWeight: '900' },
  card: { backgroundColor: Colors.card, borderRadius: Radius.card, padding: 16, borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: Colors.text, marginBottom: 12 },
  dateDropdownCard: { backgroundColor: Colors.card, borderRadius: Radius.card, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  dateDropdownTitle: { color: Colors.textMuted, fontSize: 18, fontWeight: '900' },
  dateMoveRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateMoveButton: { width: 38, minHeight: 58, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  dateMoveText: { color: Colors.brandDark, fontSize: 22, fontWeight: '900' },
  datePartRow: { flex: 1, flexDirection: 'row', gap: 8 },
  datePartButton: { flex: 1.08, minHeight: 58, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  datePartText: { color: Colors.text, fontSize: 20, fontWeight: '900' },
  datePartUnit: { color: Colors.textMuted, fontSize: 13, fontWeight: '900', marginTop: 2 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(38,49,42,0.24)', justifyContent: 'center', padding: 18 },
  dateModalCard: { backgroundColor: Colors.card, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.border, padding: 16, alignSelf: 'center', width: '100%', maxWidth: 360 },
  dateModalTitle: { color: Colors.text, fontSize: 21, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  dateModalList: { maxHeight: 360 },
  dateModalContent: { gap: 8 },
  dateOption: { minHeight: 50, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  dateOptionActive: { backgroundColor: Colors.brand, borderColor: Colors.brand },
  dateOptionText: { color: Colors.text, fontSize: 18, fontWeight: '900' },
  dateOptionTextActive: { color: Colors.white },
  dateModalClose: { minHeight: 52, marginTop: 14, borderRadius: Radius.md, backgroundColor: Colors.bg, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  dateModalCloseText: { color: Colors.brandDark, fontSize: 16, fontWeight: '900' },
  bandCard: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: 14, backgroundColor: Colors.white },
  bandTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  bandTitle: { color: Colors.text, fontSize: 19, fontWeight: '900' },
  bandPill: { borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 7 },
  bandPillText: { color: Colors.white, fontSize: 15, fontWeight: '900' },
  bandCopy: { color: Colors.textMuted, fontSize: 16, lineHeight: 24, marginTop: 10 },
  note: { color: Colors.textLight, fontSize: 15, lineHeight: 23 },
  savedGraphic: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.card, padding: 16, backgroundColor: Colors.white, gap: 13 },
  savedGraphicTitle: { color: Colors.text, fontSize: 19, fontWeight: '900' },
  axisSummaryRow: { flexDirection: 'row', gap: 8 },
  axisSummaryCard: { flex: 1, minHeight: 56, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  axisSummaryText: { fontSize: 18, fontWeight: '900' },
  axisDetailBox: { borderRadius: Radius.md, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 10 },
  axisDetailText: { color: Colors.textMuted, fontSize: 16, lineHeight: 23, fontWeight: '800' },
  recordSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: Radius.md, backgroundColor: Colors.bg, paddingHorizontal: 12, paddingVertical: 11 },
  recordSummaryIcon: { fontSize: 22 },
  recordSummaryText: { flex: 1, color: Colors.textMuted, fontSize: 17, lineHeight: 24, fontWeight: '800' },
  sleepGraphicRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: Radius.md, backgroundColor: Colors.bodySoft, borderWidth: 1, borderColor: 'rgba(197,143,91,0.22)', padding: 12 },
  sleepIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.white, textAlign: 'center', lineHeight: 36, fontSize: 22, overflow: 'hidden' },
  sleepGraphicTitle: { color: Colors.text, fontSize: 17, fontWeight: '900' },
  sleepGraphicText: { color: Colors.textMuted, fontSize: 15, lineHeight: 21, fontWeight: '800' },
  graphWrap: { gap: 12, marginTop: 12 },
  graphGuide: { color: Colors.brandDark, fontSize: 16, lineHeight: 23, fontWeight: '900', textAlign: 'center' },
  waveCanvas: { position: 'relative', borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.border, backgroundColor: '#F8FAF6', overflow: 'hidden', paddingBottom: 28 },
  waveGuideLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(92,122,94,0.12)' },
  waveSegment: { position: 'absolute', height: 4, borderRadius: 99, opacity: 0.78 },
  waveDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },
  dateRow: { position: 'absolute', left: 10, right: 10, bottom: 8, flexDirection: 'row', gap: 5 },
  dateTick: { flex: 1, color: Colors.textMuted, fontSize: 13, fontWeight: '900', textAlign: 'center' },
  waveLegendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  waveLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: Radius.pill, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 10, paddingVertical: 6 },
  waveLegendDot: { width: 9, height: 9, borderRadius: 5 },
  waveLegendText: { color: Colors.textMuted, fontSize: 13, fontWeight: '900' },
  rangeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  graphRangeText: { color: Colors.textLight, fontSize: 13, lineHeight: 19 },
  correlationRow: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: 13, marginBottom: 8, backgroundColor: Colors.white },
  correlationTitle: { color: Colors.text, fontSize: 16, fontWeight: '900' },
  correlationText: { color: Colors.textMuted, fontSize: 16, lineHeight: 24, marginTop: 5 },
  empty: { color: Colors.textLight, fontSize: 16, lineHeight: 24 },
  message: { color: Colors.danger, fontSize: 16, lineHeight: 24, paddingHorizontal: 4 },
})
