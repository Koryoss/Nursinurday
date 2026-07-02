import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppHeader from '../components/AppHeader'
import { Colors, Radius } from '../constants/colors'
import { supabase } from '../lib/supabase'
import { logUsage } from '../lib/usageLog'
import { formatKstDate } from '../lib/socialReturnIndicators'
import {
  AFFECTS,
  BUCKETS,
  DEFAULT_AFFECTS,
  DEFAULT_SYMPTOMS,
  OPTIONAL_AFFECTS,
  OPTIONAL_SYMPTOMS,
  SYMPTOMS,
  type AffectKey,
  type ContextKey,
  type SymptomKey,
  type TimeBucket,
} from '../types/careflow'

type AxisKey = 'body' | 'emotion' | 'relation' | 'meaning'
type RelationKey = 'together' | 'isolated' | 'communicationHard'

const AXIS_META: { key: AxisKey; label: string; color: string; soft: string; helper: string }[] = [
  { key: 'body', label: '몸', color: Colors.body, soft: Colors.bodySoft, helper: '심할수록 10에 가깝게' },
  { key: 'emotion', label: '감정', color: Colors.emotion, soft: Colors.emotionSoft, helper: '강할수록 10에 가깝게' },
  { key: 'relation', label: '관계', color: Colors.relation, soft: Colors.relationSoft, helper: '오늘 느낀 연결감을 골라주세요' },
  { key: 'meaning', label: '의미', color: Colors.meaning, soft: Colors.meaningSoft, helper: '오늘의 방향과 성취를 골라주세요' },
]

const MEANING_LABELS: Record<ContextKey, string> = {
  noise: '성취감을 느꼈나요?',
  weather_change: '하루가 의미 있었나요?',
  crowded: '계획한 일을 했나요?',
}

const RELATION_LABELS: { key: RelationKey; label: string }[] = [
  { key: 'together', label: '사람들과 함께했나요?' },
  { key: 'isolated', label: '고립감을 느꼈나요?' },
  { key: 'communicationHard', label: '소통이 힘들었나요?' },
]

const emptyRelation = () => ({ together: false, isolated: false, communicationHard: false })
type SleepTimeTarget = 'bedtime' | 'waketime'

const TIME_OPTIONS = Array.from({ length: 96 }, (_, index) => {
  const hour = Math.floor(index / 4)
  const minute = (index % 4) * 15
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
})

const emptySymptoms = () => Object.fromEntries(SYMPTOMS.map(symptom => [symptom.key, 0])) as Record<SymptomKey, number>
const emptyAffects = () => Object.fromEntries(AFFECTS.map(affect => [affect.key, 0])) as Record<AffectKey, number>

function dateFromString(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year || new Date().getFullYear(), (month || 1) - 1, day || 1)
}

function formatLocalDate(date: Date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function monthDays(monthDate: Date) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const first = new Date(year, month, 1)
  const startOffset = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = Array.from({ length: startOffset }, () => null)
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(year, month, day))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function Stepper({
  label,
  value,
  onChange,
  onRemove,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  onRemove?: () => void
}) {
  return (
    <View style={styles.stepperRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.stepperLabel}>{label}</Text>
      </View>
      <View style={styles.stepperControl}>
        {onRemove ? (
          <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
            <Text style={styles.removeBtnText}>삭제</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.stepBtn} onPress={() => onChange(Math.max(0, value - 1))}>
          <Text style={styles.stepBtnText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.stepValue}>{value}</Text>
        <TouchableOpacity style={styles.stepBtn} onPress={() => onChange(Math.min(10, value + 1))}>
          <Text style={styles.stepBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default function RecordScreen({
  onBack,
  onOpenChat,
  onOpenNotification,
}: {
  onBack?: () => void
  onOpenChat?: () => void
  onOpenNotification?: () => void
}) {
  const { width: screenWidth } = useWindowDimensions()
  const calendarCellSize = Math.floor(Math.min(screenWidth - 72, 350) / 7)
  const calendarGridWidth = calendarCellSize * 7
  const [logDate, setLogDate] = useState(formatKstDate())
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(dateFromString(formatKstDate()))
  const [bucket, setBucket] = useState<TimeBucket>('morning')
  const [activeAxis, setActiveAxis] = useState<AxisKey>('body')
  const [symptoms, setSymptoms] = useState<Record<SymptomKey, number>>(emptySymptoms)
  const [activeSymptoms, setActiveSymptoms] = useState<SymptomKey[]>(DEFAULT_SYMPTOMS)
  const [affects, setAffects] = useState<Record<AffectKey, number>>(emptyAffects)
  const [activeAffects, setActiveAffects] = useState<AffectKey[]>(DEFAULT_AFFECTS)
  const [relation, setRelation] = useState<Record<RelationKey, boolean>>(emptyRelation)
  const [context, setContext] = useState<Record<ContextKey, boolean>>({ noise: false, weather_change: false, crowded: false })
  const [bedtime, setBedtime] = useState('')
  const [waketime, setWaketime] = useState('')
  const [sleepTimeTarget, setSleepTimeTarget] = useState<SleepTimeTarget | null>(null)
  const [psqi, setPsqi] = useState({ psqi_q1: 0, psqi_q2: 0, psqi_q3: 0 })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // 베타 사용성 로깅: 화면 진입 시각 + 저장 여부 (H1 검증)
  const enteredAtRef = useRef(Date.now())
  const savedRef = useRef(false)

  useEffect(() => {
    enteredAtRef.current = Date.now()
    savedRef.current = false
    logUsage('record_start', 'record')
    return () => {
      if (!savedRef.current) {
        logUsage('record_abandon', 'record', {
          duration_sec: Math.round((Date.now() - enteredAtRef.current) / 1000),
        })
      }
    }
  }, [])

  const saveDaily = async () => {
    if (saving) return
    setSaving(true)
    setMessage('')
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) {
      setSaving(false)
      return
    }

    const { data: dailyLog, error: logError } = await supabase
      .from('daily_logs')
      .insert({ user_id: user.id, log_date: logDate, bucket })
      .select('id')
      .single()

    if (logError || !dailyLog) {
      setMessage('기록을 저장하지 못했어요. 연결을 함께 볼까요?')
      setSaving(false)
      return
    }

    const dailyLogId = dailyLog.id as string
    const understood = relation.together && !relation.isolated && !relation.communicationHard
    const results = await Promise.all([
      supabase.from('symptom_scores').insert(activeSymptoms.map(symptom => ({ daily_log_id: dailyLogId, symptom, score: symptoms[symptom] }))),
      supabase.from('affect_logs').insert({ daily_log_id: dailyLogId, anxiety: affects.anxiety, tension: affects.tension }),
      supabase.from('social_logs').insert({ daily_log_id: dailyLogId, understood }),
      supabase.from('context_tags').insert({ daily_log_id: dailyLogId, ...context }),
    ])

    const failed = results.find(result => result.error)
    if (failed?.error) {
      setMessage('세부 기록을 저장하지 못했어요. 연결을 함께 볼까요?')
    } else {
      const { error: affectScoresError } = await supabase
        .from('affect_scores')
        .insert(activeAffects.map(affect => ({ daily_log_id: dailyLogId, affect, score: affects[affect] })))

      setMessage(affectScoresError ? '기본 기록이 저장됐어요. 추가 감정 저장은 설정을 함께 볼까요?' : '오늘 기록이 저장됐어요.')
      savedRef.current = true
      logUsage('record_save', 'record', {
        kind: 'daily',
        duration_sec: Math.round((Date.now() - enteredAtRef.current) / 1000),
        symptom_count: activeSymptoms.length,
        affect_count: activeAffects.length,
      })
      setSymptoms(emptySymptoms())
      setActiveSymptoms(DEFAULT_SYMPTOMS)
      setAffects(emptyAffects())
      setActiveAffects(DEFAULT_AFFECTS)
      setRelation(emptyRelation())
      setContext({ noise: false, weather_change: false, crowded: false })
    }
    setSaving(false)
  }

  const saveSleep = async () => {
    if (saving) return
    setSaving(true)
    setMessage('')
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) {
      setSaving(false)
      return
    }

    const { error } = await supabase.from('sleep_logs').insert({
      user_id: user.id,
      sleep_date: logDate,
      bedtime: bedtime || null,
      waketime: waketime || null,
      ...psqi,
    })

    if (error) {
      setMessage('수면을 저장하지 못했어요. 연결을 함께 볼까요?')
    } else {
      setMessage('수면이 저장됐어요.')
      savedRef.current = true
      logUsage('record_save', 'record', {
        kind: 'sleep',
        duration_sec: Math.round((Date.now() - enteredAtRef.current) / 1000),
      })
      setBedtime('')
      setWaketime('')
      setPsqi({ psqi_q1: 0, psqi_q2: 0, psqi_q3: 0 })
    }
    setSaving(false)
  }

  const chooseDate = (date: Date) => {
    setLogDate(formatLocalDate(date))
    setCalendarMonth(date)
    setCalendarOpen(false)
  }

  const shiftMonth = (months: number) => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + months, 1))
  }

  const chooseSleepTime = (time: string) => {
    if (sleepTimeTarget === 'bedtime') setBedtime(time)
    if (sleepTimeTarget === 'waketime') setWaketime(time)
    setSleepTimeTarget(null)
  }

  const activeAxisMeta = AXIS_META.find(axis => axis.key === activeAxis) ?? AXIS_META[0]

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader
        onBack={onBack}
        right={onOpenNotification ? (
          <TouchableOpacity onPress={onOpenNotification} accessibilityLabel="알림으로 이동" style={styles.headerActionButton}>
            <Text style={styles.headerActionText}>알림</Text>
          </TouchableOpacity>
        ) : undefined}
      />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        scrollIndicatorInsets={{ bottom: 120 }}
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>기록 날짜</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setCalendarOpen(true)}>
            <Text style={styles.dateButtonText}>{logDate}</Text>
            <Text style={styles.dateButtonHint}>날짜 선택</Text>
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>기록 시점</Text>
          <View style={styles.bucketRow}>
            {BUCKETS.map(item => (
              <TouchableOpacity key={item.value} style={[styles.bucketSegment, bucket === item.value && styles.segmentActive]} onPress={() => setBucket(item.value)}>
                <Text style={[styles.bucketText, bucket === item.value && styles.segmentTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {onOpenChat ? (
          <TouchableOpacity style={styles.voicePrompt} onPress={onOpenChat}>
            <View style={{ flex: 1 }}>
              <Text style={styles.voicePromptTitle}>음성으로 기록해 보세요</Text>
            </View>
            <Text style={styles.voicePromptAction}>시작</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.axisBarCard}>
          <Text style={styles.sectionTitle}>일일기록</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.axisBar}>
            {AXIS_META.map(axis => {
              const selected = activeAxis === axis.key
              return (
                <TouchableOpacity
                  key={axis.key}
                  style={[styles.axisItem, selected && { borderColor: axis.color, backgroundColor: axis.soft }]}
                  onPress={() => setActiveAxis(axis.key)}
                >
                  <View style={[styles.axisDot, { backgroundColor: axis.color }]} />
                  <Text style={[styles.axisLabel, selected && { color: axis.color }]}>{axis.label}</Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
          <View style={[styles.axisHintBox, { borderColor: activeAxisMeta.color, backgroundColor: activeAxisMeta.soft }]}>
            <Text style={[styles.axisScaleHint, { color: activeAxisMeta.color }]}>
              {activeAxisMeta.helper}
            </Text>
          </View>
          {activeAxis === 'body' && (
            <>
              {activeSymptoms.map(key => {
                const symptom = SYMPTOMS.find(item => item.key === key)!
                const removable = OPTIONAL_SYMPTOMS.includes(key)
                return (
                  <Stepper
                    key={key}
                    label={symptom.label}
                    value={symptoms[key]}
                    onChange={value => setSymptoms(prev => ({ ...prev, [key]: value }))}
                    onRemove={removable ? () => setActiveSymptoms(prev => prev.filter(item => item !== key)) : undefined}
                  />
                )
              })}
              <View style={styles.optionalRow}>
                {OPTIONAL_SYMPTOMS.filter(key => !activeSymptoms.includes(key)).map(key => {
                  const symptom = SYMPTOMS.find(item => item.key === key)!
                  return (
                    <TouchableOpacity key={key} style={styles.smallBtn} onPress={() => setActiveSymptoms(prev => [...prev, key])}>
                      <Text style={styles.smallBtnText}>+ {symptom.label}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </>
          )}
          {activeAxis === 'emotion' && (
            <>
              {activeAffects.map(key => {
                const affect = AFFECTS.find(item => item.key === key)!
                const removable = OPTIONAL_AFFECTS.includes(key)
                return (
                  <Stepper
                    key={key}
                    label={affect.label}
                    value={affects[key]}
                    onChange={value => setAffects(prev => ({ ...prev, [key]: value }))}
                    onRemove={removable ? () => setActiveAffects(prev => prev.filter(item => item !== key)) : undefined}
                  />
                )
              })}
              <View style={styles.optionalRow}>
                {OPTIONAL_AFFECTS.filter(key => !activeAffects.includes(key)).map(key => {
                  const affect = AFFECTS.find(item => item.key === key)!
                  return (
                    <TouchableOpacity key={key} style={styles.smallBtn} onPress={() => setActiveAffects(prev => [...prev, key])}>
                      <Text style={styles.smallBtnText}>+ {affect.label}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </>
          )}
          {activeAxis === 'relation' && (
            <View style={styles.segmentWrap}>
              {RELATION_LABELS.map(item => (
                <TouchableOpacity key={item.key} style={[styles.segment, relation[item.key] && styles.segmentActive]} onPress={() => setRelation(prev => ({ ...prev, [item.key]: !prev[item.key] }))}>
                  <Text style={[styles.segmentText, relation[item.key] && styles.segmentTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {activeAxis === 'meaning' && (
            <View style={styles.segmentWrap}>
              {(Object.keys(MEANING_LABELS) as ContextKey[]).map(key => (
                <TouchableOpacity key={key} style={[styles.segment, context[key] && styles.segmentActive]} onPress={() => setContext(prev => ({ ...prev, [key]: !prev[key] }))}>
                  <Text style={[styles.segmentText, context[key] && styles.segmentTextActive]}>{MEANING_LABELS[key]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={saveDaily} disabled={saving}>
          {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.primaryText}>기록 저장</Text>}
        </TouchableOpacity>

        <View style={styles.card}>
          <View style={styles.sleepHeaderRow}>
            <Text style={[styles.axisTitle, { marginBottom: 0 }]}>수면</Text>
          </View>
          <View style={styles.sleepHintBox}>
            <Text style={styles.sleepHintText}>어려울수록 10에 가깝게</Text>
          </View>
          <View style={styles.timeRow}>
            <TouchableOpacity style={styles.timeSelect} onPress={() => setSleepTimeTarget('bedtime')}>
              <Text style={styles.timeSelectLabel}>취침</Text>
              <Text style={styles.timeSelectValue}>{bedtime || '시간 선택'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.timeSelect} onPress={() => setSleepTimeTarget('waketime')}>
              <Text style={styles.timeSelectLabel}>기상</Text>
              <Text style={styles.timeSelectValue}>{waketime || '시간 선택'}</Text>
            </TouchableOpacity>
          </View>
          <Stepper label="잠드는 데 어려움" value={psqi.psqi_q1} onChange={value => setPsqi(prev => ({ ...prev, psqi_q1: value }))} />
          <Stepper label="자는 중 깸" value={psqi.psqi_q2} onChange={value => setPsqi(prev => ({ ...prev, psqi_q2: value }))} />
          <Stepper label="아침 개운함 부족" value={psqi.psqi_q3} onChange={value => setPsqi(prev => ({ ...prev, psqi_q3: value }))} />
          <TouchableOpacity style={styles.secondaryBtn} onPress={saveSleep} disabled={saving}>
            <Text style={styles.secondaryText}>수면 저장</Text>
          </TouchableOpacity>
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}
      </ScrollView>

      <Modal visible={calendarOpen} transparent animationType="fade" onRequestClose={() => setCalendarOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => shiftMonth(-1)} style={styles.monthBtn}><Text style={styles.monthBtnText}>이전</Text></TouchableOpacity>
              <Text style={styles.calendarTitle}>{calendarMonth.getFullYear()}년 {calendarMonth.getMonth() + 1}월</Text>
              <TouchableOpacity onPress={() => shiftMonth(1)} style={styles.monthBtn}><Text style={styles.monthBtnText}>다음</Text></TouchableOpacity>
            </View>
            <View style={[styles.weekHeader, { width: calendarGridWidth }]}>
              {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                <Text key={day} style={[styles.weekLabel, { width: calendarCellSize }, index === 0 && styles.weekendText, index === 6 && styles.weekendText]}>{day}</Text>
              ))}
            </View>
            <View style={[styles.calendarGrid, { width: calendarGridWidth }]}>
              {monthDays(calendarMonth).map((date, index) => {
                const selected = date ? formatLocalDate(date) === logDate : false
                const weekend = date ? date.getDay() === 0 || date.getDay() === 6 : false
                return (
                  <TouchableOpacity
                    key={`${index}-${date?.toISOString() ?? 'blank'}`}
                    disabled={!date}
                    style={[styles.dayCell, { width: calendarCellSize, height: calendarCellSize }, selected && styles.daySelected]}
                    onPress={() => date && chooseDate(date)}
                  >
                    <Text style={[styles.dayText, weekend && styles.weekendText, selected && styles.dayTextSelected]}>{date ? date.getDate() : ''}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
            <TouchableOpacity style={styles.calendarClose} onPress={() => setCalendarOpen(false)}>
              <Text style={styles.calendarCloseText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={sleepTimeTarget !== null} transparent animationType="fade" onRequestClose={() => setSleepTimeTarget(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.timePickerCard}>
            <Text style={styles.timePickerTitle}>{sleepTimeTarget === 'bedtime' ? '취침 시간' : '기상 시간'}</Text>
            <ScrollView style={styles.timePickerList} contentContainerStyle={styles.timePickerContent}>
              {TIME_OPTIONS.map(time => {
                const selected = (sleepTimeTarget === 'bedtime' ? bedtime : waketime) === time
                return (
                  <TouchableOpacity key={time} style={[styles.timeOption, selected && styles.timeOptionActive]} onPress={() => chooseSleepTime(time)}>
                    <Text style={[styles.timeOptionText, selected && styles.timeOptionTextActive]}>{time}</Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
            <TouchableOpacity style={styles.calendarClose} onPress={() => setSleepTimeTarget(null)}>
              <Text style={styles.calendarCloseText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  headerActionButton: { minWidth: 58, height: 44, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  headerActionText: { color: Colors.brandDark, fontSize: 16, fontWeight: '900' },
  header: { padding: 16, paddingTop: 8, borderBottomWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  brandName: { fontSize: 20, fontWeight: '900', color: Colors.brandDark },
  headerSub: { fontSize: 12, color: Colors.textMuted, fontWeight: '700', marginTop: 3 },
  body: { flex: 1 },
  bodyContent: { padding: 18, paddingBottom: 150, gap: 14 },
  card: { backgroundColor: Colors.card, borderRadius: Radius.card, padding: 16, borderWidth: 1, borderColor: Colors.border },
  voicePrompt: { backgroundColor: Colors.card, borderRadius: Radius.card, padding: 16, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  voicePromptTitle: { color: Colors.text, fontSize: 20, fontWeight: '900' },
  voicePromptAction: { overflow: 'hidden', color: Colors.white, backgroundColor: Colors.brand, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, fontWeight: '900' },
  axisBarCard: { backgroundColor: Colors.card, borderRadius: Radius.card, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 14 },
  axisBar: { flexDirection: 'row', gap: 10, paddingRight: 2 },
  axisItem: { width: 104, minHeight: 86, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', gap: 8 },
  axisDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.brand },
  axisLabel: { color: Colors.text, fontSize: 22, fontWeight: '900' },
  axisHintBox: { borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 14, marginTop: 2, marginBottom: 8 },
  axisTitle: { color: Colors.text, fontSize: 21, fontWeight: '900' },
  axisScaleHint: { fontSize: 18, lineHeight: 25, fontWeight: '900', textAlign: 'center' },
  axisSub: { color: Colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: 3 },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: Colors.textMuted, marginBottom: 10 },
  sleepHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  dateButton: { minHeight: 56, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: Colors.white, marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateButtonText: { color: Colors.text, fontSize: 18, fontWeight: '900' },
  dateButtonHint: { color: Colors.brandDark, fontSize: 15, fontWeight: '900' },
  bucketRow: { flexDirection: 'row', gap: 6 },
  bucketSegment: { flex: 1, minHeight: 46, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 4, paddingVertical: 11, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center' },
  bucketText: { color: Colors.textMuted, fontSize: 14, fontWeight: '900', textAlign: 'center' },
  segmentWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  segment: { minHeight: 46, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 15, paddingVertical: 11, backgroundColor: Colors.white, justifyContent: 'center' },
  segmentActive: { backgroundColor: 'rgba(92,122,94,0.12)', borderColor: Colors.brand },
  segmentText: { color: Colors.textMuted, fontSize: 15, fontWeight: '800' },
  segmentTextActive: { color: Colors.brandDark },
  stepperRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 16 },
  stepperLabel: { color: Colors.text, fontSize: 22, fontWeight: '900' },
  stepperControl: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  removeBtn: { height: 44, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  removeBtnText: { color: Colors.textMuted, fontSize: 14, fontWeight: '900' },
  stepBtn: { width: 50, height: 50, borderRadius: Radius.md, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  stepBtnText: { color: Colors.brandDark, fontSize: 28, fontWeight: '900' },
  stepValue: { width: 36, textAlign: 'center', color: Colors.brandDark, fontSize: 24, fontWeight: '900' },
  optionalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  smallBtn: { minHeight: 44, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 10, justifyContent: 'center' },
  smallBtnText: { color: Colors.brandDark, fontWeight: '800', fontSize: 15 },
  primaryBtn: { minHeight: 56, backgroundColor: Colors.brand, borderRadius: Radius.md, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  primaryText: { color: Colors.white, fontSize: 21, fontWeight: '900' },
  secondaryBtn: { minHeight: 54, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  secondaryText: { color: Colors.brandDark, fontSize: 16, fontWeight: '900' },
  sleepHintBox: { borderRadius: Radius.md, backgroundColor: Colors.brandLight, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 14 },
  sleepHintText: { color: Colors.brandDark, fontSize: 18, lineHeight: 25, fontWeight: '900', textAlign: 'center' },
  timeRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  timeSelect: { flex: 1, minHeight: 68, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: Colors.white, justifyContent: 'center' },
  timeSelectLabel: { color: Colors.textMuted, fontSize: 14, fontWeight: '900', marginBottom: 4 },
  timeSelectValue: { color: Colors.text, fontSize: 20, fontWeight: '900' },
  message: { color: Colors.textMuted, fontSize: 15, lineHeight: 22, paddingHorizontal: 4 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(38,49,42,0.24)', justifyContent: 'center', padding: 18 },
  calendarCard: { backgroundColor: Colors.card, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.border, padding: 16, alignSelf: 'center', width: '100%', maxWidth: 390 },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10 },
  monthBtn: { minWidth: 58, height: 46, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white },
  monthBtnText: { color: Colors.brandDark, fontSize: 15, fontWeight: '900' },
  calendarTitle: { flex: 1, textAlign: 'center', color: Colors.text, fontSize: 20, fontWeight: '900' },
  weekHeader: { flexDirection: 'row', alignSelf: 'center', marginBottom: 8 },
  weekLabel: { textAlign: 'center', color: Colors.textLight, fontSize: 14, fontWeight: '900' },
  weekendText: { color: Colors.accent },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', alignSelf: 'center' },
  dayCell: { alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md },
  daySelected: { backgroundColor: Colors.brand },
  dayText: { color: Colors.textMuted, fontSize: 17, fontWeight: '900' },
  dayTextSelected: { color: Colors.white },
  calendarClose: { minHeight: 52, marginTop: 14, borderRadius: Radius.md, backgroundColor: Colors.bg, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  calendarCloseText: { color: Colors.brandDark, fontSize: 16, fontWeight: '900' },
  timePickerCard: { backgroundColor: Colors.card, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.border, padding: 16, alignSelf: 'center', width: '100%', maxWidth: 360 },
  timePickerTitle: { color: Colors.text, fontSize: 21, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  timePickerList: { maxHeight: 360 },
  timePickerContent: { gap: 8 },
  timeOption: { minHeight: 48, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  timeOptionActive: { backgroundColor: Colors.brand, borderColor: Colors.brand },
  timeOptionText: { color: Colors.text, fontSize: 18, fontWeight: '900' },
  timeOptionTextActive: { color: Colors.white },
})
