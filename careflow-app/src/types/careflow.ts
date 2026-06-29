export type TimeBucket = 'morning' | 'afternoon' | 'evening' | 'before_sleep' | 'attack'
export type SymptomKey = 'dizziness' | 'gait' | 'tinnitus' | 'headache' | 'floaters' | 'other'
export type AffectKey = 'anxiety' | 'tension' | 'sadness' | 'irritation' | 'fear' | 'numbness' | 'other'
export type ContextKey = 'noise' | 'weather_change' | 'crowded'

export const BUCKETS: { value: TimeBucket; label: string }[] = [
  { value: 'morning', label: '아침' },
  { value: 'afternoon', label: '점심' },
  { value: 'evening', label: '저녁' },
  { value: 'before_sleep', label: '취침 전' },
  { value: 'attack', label: '응급' },
]

export const SYMPTOMS: { key: SymptomKey; label: string }[] = [
  { key: 'dizziness', label: '어지럼' },
  { key: 'tinnitus', label: '이명' },
  { key: 'gait', label: '걷기 불안' },
  { key: 'headache', label: '두통' },
  { key: 'floaters', label: '비문증' },
  { key: 'other', label: '기타 몸 신호' },
]

export const DEFAULT_SYMPTOMS: SymptomKey[] = ['dizziness', 'tinnitus']
export const OPTIONAL_SYMPTOMS: SymptomKey[] = ['gait', 'headache', 'floaters', 'other']

export const AFFECTS: { key: AffectKey; label: string }[] = [
  { key: 'anxiety', label: '불안' },
  { key: 'tension', label: '긴장' },
  { key: 'sadness', label: '가라앉음' },
  { key: 'irritation', label: '예민함' },
  { key: 'fear', label: '두려움' },
  { key: 'numbness', label: '멍함' },
  { key: 'other', label: '기타 감정 신호' },
]

export const DEFAULT_AFFECTS: AffectKey[] = ['anxiety', 'tension']
export const OPTIONAL_AFFECTS: AffectKey[] = ['sadness', 'irritation', 'fear', 'numbness', 'other']

export const CONTEXT_LABELS: Record<ContextKey, string> = {
  noise: '소음',
  weather_change: '기온차',
  crowded: '붐빔',
}

export const AXIS_LABELS = ['몸', '감정', '관계', '의미'] as const
