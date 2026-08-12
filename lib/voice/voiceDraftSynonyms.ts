import type { VoiceAffectKey, VoiceContextKey, VoiceSymptomKey, VoiceTimeBucket } from './voiceDraft'

type Dictionary<T extends string> = Record<T, string[]>

export const voiceDraftSynonyms = {
  bucket: {
    morning: ['아침', '오전', '일어나서', '기상 후', '기상 직후'],
    afternoon: ['오후', '점심', '낮', '한낮'],
    evening: ['저녁', '밤', '퇴근 후'],
    before_sleep: ['취침 전', '자기 전', '잠들기 전', '누워서'],
    attack: ['응급', '갑자기', '급하게', '발작', '확 올라', '심해져서'],
  } satisfies Dictionary<VoiceTimeBucket>,
  symptoms: {
    dizziness: ['어지럼', '어지러움', '어질', '빙빙', '현기증', '핑 돎', '균형', '멀미'],
    gait: ['걷기 불안', '보행', '휘청', '비틀', '걷기 무서움', '걸을 때', '균형 잡기'],
    tinnitus: ['이명', '귀 울림', '귀울림', '삐 소리', '삐-', '삐이', '윙', '웅', '귀에서 소리'],
    headache: ['두통', '머리 아픔', '머리가 아', '머리 통증', '띵', '지끈'],
    floaters: ['비문증', '날파리', '눈앞에 점', '떠다니는 점', '눈에 뭐가'],
    other: ['기타 몸', '다른 몸', '몸 신호', '몸이 이상', '불편감'],
  } satisfies Dictionary<VoiceSymptomKey>,
  affects: {
    anxiety: ['불안', '초조', '걱정', '마음이 불편', '조마조마'],
    tension: ['긴장', '굳어', '경직', '힘이 들어', '긴장감'],
    sadness: ['가라앉', '우울', '슬픔', '기운이 없', '처짐'],
    irritation: ['예민', '짜증', '날카로', '신경질'],
    fear: ['두려움', '무서움', '겁', '무섭'],
    numbness: ['멍함', '멍해', '감각이 둔', '무뎌'],
    other: ['기타 감정', '감정 신호', '말로 설명하기 어려', '모르겠'],
  } satisfies Dictionary<VoiceAffectKey>,
  context: {
    noise: ['소음', '시끄', '시끄러움', '큰 소리', '소리가 커', '공사 소리'],
    weather_change: ['기온차', '온도차', '날씨', '추워', '더워', '습도', '바람'],
    crowded: ['붐빔', '사람 많', '사람이 많', '사람 많은', '사람 많음', '많은 사람', '복잡', '혼잡', '줄이 길'],
  } satisfies Dictionary<VoiceContextKey>,
}
