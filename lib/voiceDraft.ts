import { voiceDraftSynonyms } from './voiceDraftSynonyms'

export type VoiceTimeBucket = 'morning' | 'afternoon' | 'evening' | 'before_sleep' | 'attack'
export type VoiceSymptomKey = 'dizziness' | 'gait' | 'tinnitus' | 'headache' | 'floaters' | 'other'
export type VoiceAffectKey = 'anxiety' | 'tension' | 'sadness' | 'irritation' | 'fear' | 'numbness' | 'other'
export type VoiceContextKey = 'noise' | 'weather_change' | 'crowded'

export type VoiceRecordDraft = {
  bucket: VoiceTimeBucket | null
  symptoms: { symptom: VoiceSymptomKey; score: number | null }[]
  affects: { affect: VoiceAffectKey; score: number | null }[]
  context: Record<VoiceContextKey, boolean>
  needsConfirmation: string[]
}

const degreeWords = ['심했', '심한', '심하게', '조금', '약간', '많이', '강했', '강하게', '불편했', '힘들었']

const labels: Record<VoiceSymptomKey | VoiceAffectKey, string> = {
  dizziness: '어지럼',
  gait: '걷기 불안',
  tinnitus: '이명',
  headache: '두통',
  floaters: '비문증',
  other: '기타 신호',
  anxiety: '불안',
  tension: '긴장',
  sadness: '가라앉음',
  irritation: '예민함',
  fear: '두려움',
  numbness: '멍함',
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[.,!?()[\]{}"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenizeKorean(text: string) {
  return normalize(text)
    .split(/[^가-힣a-z0-9:-]+/)
    .filter(Boolean)
    .map(token => token.replace(/(은|는|이|가|을|를|도|만|부터|까지|에서|으로|로|처럼|보다)$/u, ''))
}

function hasAny(text: string, words: string[]) {
  const compact = text.replace(/\s+/g, '')
  const tokens = tokenizeKorean(text)
  return words.some(word => {
    const normalizedWord = normalize(word)
    const compactWord = normalizedWord.replace(/\s+/g, '')
    return text.includes(normalizedWord) || compact.includes(compactWord) || tokens.some(token => token.includes(compactWord))
  })
}

function firstMatchedKey<T extends string>(text: string, dictionary: Record<T, string[]>): T | null {
  for (const [key, words] of Object.entries(dictionary) as [T, string[]][]) {
    if (hasAny(text, words)) return key
  }
  return null
}

function matchedKeys<T extends string>(text: string, dictionary: Record<T, string[]>): T[] {
  return (Object.entries(dictionary) as [T, string[]][])
    .filter(([, words]) => hasAny(text, words))
    .map(([key]) => key)
}

function scoreNear(text: string, words: string[]) {
  const escapedWords = words.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*'))
  const wordPattern = escapedWords.join('|')
  const match = text.match(new RegExp(`(?:${wordPattern})[^0-9]{0,12}(10|[0-9])\\s*(?:점|정도|쯤)?`, 'u'))
  if (!match) return null
  const score = Number(match[1])
  return Number.isInteger(score) && score >= 0 && score <= 10 ? score : null
}

function addConfirmation(list: string[], label: string) {
  const message = `${label}은 0-10 중 어디에 가까웠나요?`
  if (!list.includes(message)) list.push(message)
}

export function parseVoiceDraftText(input: string): VoiceRecordDraft {
  const text = normalize(input)
  const needsConfirmation: string[] = []
  const bucket = firstMatchedKey<VoiceTimeBucket>(text, voiceDraftSynonyms.bucket)
  const symptoms = matchedKeys<VoiceSymptomKey>(text, voiceDraftSynonyms.symptoms).map(symptom => {
    const score = scoreNear(text, voiceDraftSynonyms.symptoms[symptom])
    if (score === null) addConfirmation(needsConfirmation, labels[symptom])
    return { symptom, score }
  })
  const affects = matchedKeys<VoiceAffectKey>(text, voiceDraftSynonyms.affects).map(affect => {
    const score = scoreNear(text, voiceDraftSynonyms.affects[affect])
    if (score === null) addConfirmation(needsConfirmation, labels[affect])
    return { affect, score }
  })
  const context = Object.fromEntries(
    (Object.keys(voiceDraftSynonyms.context) as VoiceContextKey[]).map(key => [key, hasAny(text, voiceDraftSynonyms.context[key])]),
  ) as Record<VoiceContextKey, boolean>

  if (!bucket) needsConfirmation.push('기록 시점은 아침, 오후, 저녁, 취침 전, 응급 중 어디였나요?')
  if (hasAny(text, degreeWords) && symptoms.length === 0 && affects.length === 0) {
    needsConfirmation.push('어떤 몸 신호나 감정 신호였는지 함께 볼까요?')
  }

  return {
    bucket,
    symptoms,
    affects,
    context,
    needsConfirmation: Array.from(new Set(needsConfirmation)),
  }
}
