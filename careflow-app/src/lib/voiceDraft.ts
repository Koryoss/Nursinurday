import type { AffectKey, ContextKey, SymptomKey, TimeBucket } from '../types/careflow'

type Dictionary<T extends string> = Record<T, string[]>

export type VoiceRecordDraft = {
  bucket: TimeBucket | null
  symptoms: { symptom: SymptomKey; score: number | null }[]
  affects: { affect: AffectKey; score: number | null }[]
  context: Record<ContextKey, boolean>
  needsConfirmation: string[]
}

const synonyms = {
  bucket: {
    morning: ['아침', '오전', '일어나서', '기상 후', '기상 직후'],
    afternoon: ['오후', '점심', '낮', '한낮'],
    evening: ['저녁', '밤', '퇴근 후'],
    before_sleep: ['취침 전', '자기 전', '잠들기 전', '누워서'],
    attack: ['응급', '갑자기', '급하게', '발작', '확 올라', '심해져서'],
  } satisfies Dictionary<TimeBucket>,
  symptoms: {
    dizziness: ['어지럼', '어지러움', '어질', '빙빙', '현기증', '핑 돎', '균형', '멀미'],
    gait: ['걷기 불안', '보행', '휘청', '비틀', '걷기 무서움', '걸을 때', '균형 잡기'],
    tinnitus: ['이명', '귀 울림', '귀울림', '삐 소리', '삐-', '삐이', '윙', '웅', '귀에서 소리'],
    headache: ['두통', '머리 아픔', '머리가 아', '머리 통증', '띵', '지끈'],
    floaters: ['비문증', '날파리', '눈앞에 점', '떠다니는 점', '눈에 뭐가'],
    other: ['기타 몸', '다른 몸', '몸 신호', '몸이 이상', '불편감'],
  } satisfies Dictionary<SymptomKey>,
  affects: {
    anxiety: ['불안', '초조', '걱정', '마음이 불편', '조마조마'],
    tension: ['긴장', '굳어', '경직', '힘이 들어', '긴장감'],
    sadness: ['가라앉', '우울', '슬픔', '기운이 없', '처짐'],
    irritation: ['예민', '짜증', '날카로', '신경질'],
    fear: ['두려움', '무서움', '겁', '무섭'],
    numbness: ['멍함', '멍해', '감각이 둔', '무뎌'],
    other: ['기타 감정', '감정 신호', '말로 설명하기 어려', '모르겠'],
  } satisfies Dictionary<AffectKey>,
  context: {
    noise: ['소음', '시끄', '시끄러움', '큰 소리', '소리가 커', '공사 소리'],
    weather_change: ['기온차', '온도차', '날씨', '추워', '더워', '습도', '바람'],
    crowded: ['붐빔', '사람 많', '사람이 많', '사람 많은', '사람 많음', '많은 사람', '복잡', '혼잡', '줄이 길'],
  } satisfies Dictionary<ContextKey>,
}

const degreeWords = ['심했', '심한', '심하게', '조금', '약간', '많이', '강했', '강하게', '불편했', '힘들었']

const labels: Record<SymptomKey | AffectKey, string> = {
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

export function parseVoiceText(textInput: string): Promise<VoiceRecordDraft> {
  const text = normalize(textInput)
  const needsConfirmation: string[] = []
  const bucket = firstMatchedKey<TimeBucket>(text, synonyms.bucket)
  const symptoms = matchedKeys<SymptomKey>(text, synonyms.symptoms).map(symptom => {
    const score = scoreNear(text, synonyms.symptoms[symptom])
    if (score === null) addConfirmation(needsConfirmation, labels[symptom])
    return { symptom, score }
  })
  const affects = matchedKeys<AffectKey>(text, synonyms.affects).map(affect => {
    const score = scoreNear(text, synonyms.affects[affect])
    if (score === null) addConfirmation(needsConfirmation, labels[affect])
    return { affect, score }
  })
  const context = Object.fromEntries(
    (Object.keys(synonyms.context) as ContextKey[]).map(key => [key, hasAny(text, synonyms.context[key])]),
  ) as Record<ContextKey, boolean>

  if (!bucket) needsConfirmation.push('기록 시점은 아침, 점심, 저녁, 취침 전, 응급 중 어디였나요?')
  if (hasAny(text, degreeWords) && symptoms.length === 0 && affects.length === 0) {
    needsConfirmation.push('어떤 몸 신호나 감정 신호였는지 함께 볼까요?')
  }

  return Promise.resolve({
    bucket,
    symptoms,
    affects,
    context,
    needsConfirmation: Array.from(new Set(needsConfirmation)),
  })
}
