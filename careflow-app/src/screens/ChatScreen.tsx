import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRef, useState } from 'react'
import AppHeader from '../components/AppHeader'
import { Colors, Radius } from '../constants/colors'
import { formatKstDate } from '../../../lib/domain/socialReturnIndicators'
import { detectCrisisLevel, buildReferralInfo } from '../../../lib/domain/nursingLogic'
import { saveDailyRecord } from '../lib/recordStorage'
import { parseVoiceDraftText, type VoiceRecordDraft } from '../../../lib/voice/voiceDraft'
import {
  AFFECTS,
  BUCKETS,
  CONTEXT_LABELS,
  SYMPTOMS,
  type AffectKey,
  type ContextKey,
  type SymptomKey,
  type TimeBucket,
} from '../types/careflow'

type Message = { role: 'user' | 'ai'; text: string }
type RelationKey = 'together' | 'isolated' | 'communicationHard'

const AXIS_TAGS: Record<string, { color: string; bg: string }> = {
  몸:  { color: Colors.body, bg: Colors.bodySoft },
  감정: { color: Colors.emotion, bg: Colors.emotionSoft },
  관계: { color: Colors.relation, bg: Colors.relationSoft },
  의미: { color: Colors.meaning, bg: Colors.meaningSoft },
}

const RECOMMENDED_QUESTIONS = [
  { axis: '몸', text: '어지럼과 이명은 어느 정도였나요?' },
  { axis: '몸', text: '걷기 불안, 두통, 비문증, 기타 몸 신호가 있었나요?' },
  { axis: '감정', text: '불안과 긴장은 어느 정도였나요?' },
  { axis: '감정', text: '추가로 가라앉음, 예민함, 두려움, 멍함, 기타 감정 신호가 있었나요?' },
  { axis: '관계', text: '사람들과 함께했나요?' },
  { axis: '관계', text: '고립감을 느꼈나요?' },
  { axis: '관계', text: '소통이 힘들었나요?' },
  { axis: '의미', text: '성취감, 하루의 의미, 계획한 일 중 남기고 싶은 내용이 있었나요?' },
  { axis: '몸', text: '수면은 몸 기록 안에서 이어서 적어볼까요?' },
]

const RELATION_LABELS: { key: RelationKey; label: string }[] = [
  { key: 'together', label: '사람들과 함께했나요?' },
  { key: 'isolated', label: '고립감을 느꼈나요?' },
  { key: 'communicationHard', label: '소통이 힘들었나요?' },
]

const symptomLabel = Object.fromEntries(SYMPTOMS.map(item => [item.key, item.label])) as Record<SymptomKey, string>
const affectLabel = Object.fromEntries(AFFECTS.map(item => [item.key, item.label])) as Record<AffectKey, string>

function relationToUnderstood(relation: Record<RelationKey, boolean>) {
  return relation.together && !relation.isolated && !relation.communicationHard
}

function DraftStepper({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | null
  onChange: (value: number) => void
}) {
  const current = value ?? 0
  return (
    <View style={styles.draftRow}>
      <Text style={styles.draftLabel}>{label}</Text>
      <View style={styles.stepperControl}>
        <TouchableOpacity style={styles.stepBtn} onPress={() => onChange(Math.max(0, current - 1))}>
          <Text style={styles.stepBtnText}>-</Text>
        </TouchableOpacity>
        <Text style={[styles.stepValue, value === null && styles.stepValueEmpty]}>{value === null ? '선택' : value}</Text>
        <TouchableOpacity style={styles.stepBtn} onPress={() => onChange(Math.min(10, current + 1))}>
          <Text style={styles.stepBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default function ChatScreen({ onBack }: { onBack?: () => void }) {
  const inputRef = useRef<TextInput>(null)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: '오늘 하루를 편하게 말하면 기록 초안을 함께 만들어볼게요.' },
  ])
  const [input, setInput] = useState('')
  const [voiceHint, setVoiceHint] = useState('')
  const [promptOpen, setPromptOpen] = useState(false)
  const [draftOpen, setDraftOpen] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [draft, setDraft] = useState<VoiceRecordDraft | null>(null)
  const [draftBucket, setDraftBucket] = useState<TimeBucket | null>(null)
  const [draftSymptoms, setDraftSymptoms] = useState<VoiceRecordDraft['symptoms']>([])
  const [draftAffects, setDraftAffects] = useState<VoiceRecordDraft['affects']>([])
  const [draftContext, setDraftContext] = useState<Record<ContextKey, boolean>>({ noise: false, weather_change: false, crowded: false })
  const [draftRelation, setDraftRelation] = useState<Record<RelationKey, boolean>>({ together: false, isolated: false, communicationHard: false })

  const startVoiceInput = () => {
    setVoiceHint('휴대폰 키보드의 마이크로 받아쓴 뒤, 초안 만들기를 눌러주세요.')
    inputRef.current?.focus()
  }

  const chooseQuestion = (text: string) => {
    setInput(text)
    setPromptOpen(false)
    inputRef.current?.focus()
  }

  const openDraft = (parsed: VoiceRecordDraft) => {
    setDraft(parsed)
    setDraftBucket(parsed.bucket)
    setDraftSymptoms(parsed.symptoms)
    setDraftAffects(parsed.affects)
    setDraftContext(parsed.context)
    setDraftRelation({ together: false, isolated: false, communicationHard: false })
    setDraftOpen(true)
  }

  const analyzeText = async () => {
    const text = input.trim()
    if (!text || analyzing) return

    // 안전망 확인 — 위기 신호는 기록보다 외부 도움 연결을 우선한다 (SPEC §0, nursingLogic.ts).
    const crisisLevel = detectCrisisLevel(text)
    const referral = buildReferralInfo(crisisLevel)

    if (referral && (crisisLevel === 'critical' || crisisLevel === 'urgent')) {
      // critical/urgent: 기록 초안 생성을 건너뛰고 외부 자원 연계를 바로 안내한다.
      setMessages(prev => [
        ...prev,
        { role: 'user', text },
        { role: 'ai', text: referral.message },
      ])
      setInput('')
      setVoiceHint('')
      return
    }

    setAnalyzing(true)
    setMessage('')
    try {
      const parsed = parseVoiceDraftText(text)
      const aiMessages: Message[] = [
        { role: 'user', text },
        { role: 'ai', text: '기록 초안을 만들었어요. 저장하기 전에 함께 확인해 볼까요?' },
      ]
      if (referral) {
        // monitor 수준: 기록은 계속 진행하되 외부 자원 안내를 함께 보여준다.
        aiMessages.push({ role: 'ai', text: referral.message })
      }
      setMessages(prev => [...prev, ...aiMessages])
      setInput('')
      setVoiceHint('')
      openDraft(parsed)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '문장을 분석하지 못했어요. 다시 함께 볼까요?')
    } finally {
      setAnalyzing(false)
    }
  }

  const setSymptomScore = (symptom: SymptomKey, score: number) => {
    setDraftSymptoms(prev => prev.map(item => item.symptom === symptom ? { ...item, score } : item))
  }

  const setAffectScore = (affect: AffectKey, score: number) => {
    setDraftAffects(prev => prev.map(item => item.affect === affect ? { ...item, score } : item))
  }

  const toggleContext = (key: ContextKey) => {
    setDraftContext(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const missingScores = draftSymptoms.some(item => item.score === null) || draftAffects.some(item => item.score === null)
  const canSaveDraft = Boolean(draftBucket) && !missingScores

  const saveDraft = async () => {
    if (!draftBucket || !canSaveDraft || saving) return
    setSaving(true)
    setMessage('')
    const symptoms = Object.fromEntries(draftSymptoms.map(item => [item.symptom, item.score ?? 0])) as Partial<Record<SymptomKey, number>>
    const affects = Object.fromEntries(draftAffects.map(item => [item.affect, item.score ?? 0])) as Partial<Record<AffectKey, number>>
    const dailyResult = await saveDailyRecord({
      logDate: formatKstDate(),
      bucket: draftBucket,
      symptoms,
      activeSymptoms: draftSymptoms.map(item => item.symptom),
      affects,
      activeAffects: draftAffects.map(item => item.affect),
      understood: relationToUnderstood(draftRelation),
      context: draftContext,
    })

    setSaving(false)
    setMessage(dailyResult.message)
    if (dailyResult.ok) {
      setDraftOpen(false)
      setDraft(null)
      onBack?.()
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader onBack={onBack} backLabel="닫기" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {messages.map((m, i) => (
            <View key={i} style={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.aiBubble]}>
              <Text style={[styles.bubbleText, m.role === 'user' ? styles.userText : styles.aiText]}>{m.text}</Text>
            </View>
          ))}

          <View style={styles.tagsRow}>
            {Object.entries(AXIS_TAGS).map(([label, style]) => (
              <View key={label} style={[styles.tag, { backgroundColor: style.bg }]}>
                <Text style={[styles.tagText, { color: style.color }]}>{label}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.axisHelper}>4개의 축으로 음성을 자동 분석해요.</Text>
          <TouchableOpacity style={styles.promptButton} onPress={() => setPromptOpen(true)}>
            <Text style={styles.promptButtonText}>무엇을 말해야 할까요?</Text>
          </TouchableOpacity>
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="오늘 하루를 이야기해 주세요..."
            placeholderTextColor={Colors.textMuted}
            multiline
          />
          <TouchableOpacity style={styles.voiceBtn} onPress={startVoiceInput}>
            <Text style={styles.voiceText}>음성</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sendBtn} onPress={analyzeText} disabled={analyzing}>
            {analyzing ? <ActivityIndicator color={Colors.surface} /> : <Text style={styles.sendText}>초안</Text>}
          </TouchableOpacity>
        </View>
        {voiceHint ? <Text style={styles.voiceHint}>{voiceHint}</Text> : null}
      </KeyboardAvoidingView>

      <Modal visible={promptOpen} transparent animationType="fade" onRequestClose={() => setPromptOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.promptCard}>
            <Text style={styles.promptTitle}>추천 질문</Text>
            <Text style={styles.promptSub}>기록 창에 적는 항목과 같은 순서로 말해볼까요?</Text>
            <ScrollView style={styles.promptList} contentContainerStyle={styles.promptListContent}>
              {RECOMMENDED_QUESTIONS.map(item => {
                const axisStyle = AXIS_TAGS[item.axis] ?? { color: Colors.brandDark, bg: Colors.brandLight }
                return (
                  <TouchableOpacity key={`${item.axis}-${item.text}`} style={styles.questionRow} onPress={() => chooseQuestion(item.text)}>
                    <Text style={[styles.questionAxis, { color: axisStyle.color, backgroundColor: axisStyle.bg }]}>{item.axis}</Text>
                    <Text style={styles.questionText}>{item.text}</Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setPromptOpen(false)}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={draftOpen} transparent animationType="slide" onRequestClose={() => setDraftOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.draftCard}>
            <Text style={styles.promptTitle}>기록 초안 확인</Text>
            <Text style={styles.promptSub}>자동 저장하지 않아요. 확인한 뒤에만 저장돼요.</Text>
            <ScrollView style={styles.draftList} contentContainerStyle={styles.draftListContent}>
              <Text style={styles.draftSection}>기록 시점</Text>
              <View style={styles.segmentWrap}>
                {BUCKETS.map(item => (
                  <TouchableOpacity key={item.value} style={[styles.segment, draftBucket === item.value && styles.segmentActive]} onPress={() => setDraftBucket(item.value)}>
                    <Text style={[styles.segmentText, draftBucket === item.value && styles.segmentTextActive]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {draftSymptoms.length > 0 ? <Text style={styles.draftSection}>몸</Text> : null}
              {draftSymptoms.map(item => (
                <DraftStepper key={item.symptom} label={symptomLabel[item.symptom]} value={item.score} onChange={score => setSymptomScore(item.symptom, score)} />
              ))}

              {draftAffects.length > 0 ? <Text style={styles.draftSection}>감정</Text> : null}
              {draftAffects.map(item => (
                <DraftStepper key={item.affect} label={affectLabel[item.affect]} value={item.score} onChange={score => setAffectScore(item.affect, score)} />
              ))}

              <Text style={styles.draftSection}>관계</Text>
              <View style={styles.segmentWrap}>
                {RELATION_LABELS.map(item => (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.segment, draftRelation[item.key] && styles.segmentActive]}
                    onPress={() => setDraftRelation(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                  >
                    <Text style={[styles.segmentText, draftRelation[item.key] && styles.segmentTextActive]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.draftSection}>기록 맥락</Text>
              <View style={styles.segmentWrap}>
                {(Object.keys(CONTEXT_LABELS) as ContextKey[]).map(key => (
                  <TouchableOpacity key={key} style={[styles.segment, draftContext[key] && styles.segmentActive]} onPress={() => toggleContext(key)}>
                    <Text style={[styles.segmentText, draftContext[key] && styles.segmentTextActive]}>{CONTEXT_LABELS[key]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {draft?.needsConfirmation.length ? (
                <View style={styles.confirmBox}>
                  {draft.needsConfirmation.map(item => <Text key={item} style={styles.confirmText}>{item}</Text>)}
                </View>
              ) : null}
            </ScrollView>
            <TouchableOpacity style={[styles.saveDraftBtn, !canSaveDraft && styles.disabledBtn]} onPress={saveDraft} disabled={!canSaveDraft || saving}>
              {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveDraftText}>확인하고 저장</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => setDraftOpen(false)}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  body: { flex: 1 },
  bodyContent: { padding: 18, paddingBottom: 18 },
  bubble: { maxWidth: '86%', borderRadius: 16, padding: 14, marginBottom: 10 },
  userBubble: { backgroundColor: Colors.brandDark, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: Colors.card, alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
  bubbleText: { fontSize: 16, lineHeight: 24 },
  userText: { color: Colors.surface },
  aiText: { color: Colors.brandDark },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  tag: { minHeight: 38, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 12 },
  tagText: { fontSize: 15, fontWeight: '800' },
  axisHelper: { color: Colors.textMuted, fontSize: 15, lineHeight: 22, fontWeight: '800', marginTop: 10 },
  promptButton: { minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  promptButtonText: { color: Colors.brandDark, fontSize: 17, fontWeight: '900' },
  message: { color: Colors.textMuted, fontSize: 15, lineHeight: 22, marginTop: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: 14, borderTopWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, gap: 8 },
  input: { flex: 1, minHeight: 50, backgroundColor: Colors.bg, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, lineHeight: 22, color: Colors.brandDark, maxHeight: 120 },
  voiceBtn: { minHeight: 50, backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 13, justifyContent: 'center' },
  voiceText: { color: Colors.brandDark, fontSize: 15, fontWeight: '900' },
  sendBtn: { minHeight: 50, minWidth: 60, backgroundColor: Colors.brandDark, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, justifyContent: 'center', alignItems: 'center' },
  sendText: { color: Colors.surface, fontSize: 16, fontWeight: '900' },
  voiceHint: { backgroundColor: Colors.surface, color: Colors.textMuted, fontSize: 13, lineHeight: 19, paddingHorizontal: 16, paddingBottom: 12 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(38,49,42,0.24)', justifyContent: 'center', padding: 18 },
  promptCard: { backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, width: '100%', maxWidth: 390, alignSelf: 'center' },
  promptTitle: { color: Colors.text, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  promptSub: { color: Colors.textMuted, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 6, marginBottom: 12 },
  promptList: { maxHeight: 380 },
  promptListContent: { gap: 9 },
  questionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, backgroundColor: Colors.white, padding: 12 },
  questionAxis: { minWidth: 44, overflow: 'hidden', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 7, textAlign: 'center', fontSize: 14, fontWeight: '900' },
  questionText: { flex: 1, color: Colors.text, fontSize: 16, lineHeight: 23, fontWeight: '800' },
  closeButton: { minHeight: 52, marginTop: 12, borderRadius: 12, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  closeButtonText: { color: Colors.brandDark, fontSize: 16, fontWeight: '900' },
  draftCard: { backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, width: '100%', maxWidth: 430, maxHeight: '92%', alignSelf: 'center' },
  draftList: { maxHeight: 560 },
  draftListContent: { gap: 10, paddingBottom: 6 },
  draftSection: { color: Colors.text, fontSize: 18, fontWeight: '900', marginTop: 6 },
  draftRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, borderRadius: Radius.md, padding: 12 },
  draftLabel: { flex: 1, color: Colors.text, fontSize: 17, fontWeight: '900' },
  stepperControl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: { width: 42, height: 42, borderRadius: Radius.md, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  stepBtnText: { color: Colors.brandDark, fontSize: 24, fontWeight: '900' },
  stepValue: { width: 46, textAlign: 'center', color: Colors.brandDark, fontSize: 20, fontWeight: '900' },
  stepValueEmpty: { width: 52, color: Colors.textMuted, fontSize: 14 },
  segmentWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  segment: { minHeight: 44, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 13, paddingVertical: 10, backgroundColor: Colors.white, justifyContent: 'center' },
  segmentActive: { backgroundColor: 'rgba(92,122,94,0.12)', borderColor: Colors.brand },
  segmentText: { color: Colors.textMuted, fontSize: 15, fontWeight: '800' },
  segmentTextActive: { color: Colors.brandDark },
  confirmBox: { backgroundColor: Colors.brandLight, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: 12, gap: 5 },
  confirmText: { color: Colors.brandDark, fontSize: 15, lineHeight: 22, fontWeight: '800' },
  saveDraftBtn: { minHeight: 54, borderRadius: Radius.md, backgroundColor: Colors.brand, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  saveDraftText: { color: Colors.white, fontSize: 18, fontWeight: '900' },
  disabledBtn: { opacity: 0.45 },
})
