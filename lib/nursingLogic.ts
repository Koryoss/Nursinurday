/**
 * ⚠️ CareFlow 핵심 경계 (반드시 준수) - v4.1 "Related To" 프레임워크
 *
 * CareFlow는 의학적 진단을 하지 않습니다.
 * 주관적(S) + 객관적(O) 자료를 통합하여 질병과 관련된 심리적/신체적 현상을 파악합니다.
 *
 * 🎯 CareFlow의 4단계 프로세스:
 *   1️⃣ 자료 수집: S(사용자 진술) + O(Apple Watch 센서 + 행동 관찰)
 *   2️⃣ 현상 파악: "~과 관련된" 표현으로 심리적/신체적 반응 이해
 *   3️⃣ 의학적 협력: 협력문제(Potential Complication) 감지 → 의료 연결
 *   4️⃣ 데이터 기반 지원: 파악된 현상을 바탕으로 자기돌봄 제안
 *
 * NANDA 간호 진단은 "내부 임상 근거"일 뿐, 사용자에게 절대 노출되지 않습니다.
 * 사용자에게는 "진단받았다"는 느낌이 아니라 "나를 더 잘 알게 됐다"는 느낌을 줍니다.
 *
 * v4.0 표현 (❌ 진단처럼 들림):
 *   ❌ "우울증입니다", "불안장애입니다", "이명입니다"
 *
 * v4.1 표현 (✅ 현상 파악):
 *   ✅ "스트레스와 수면 부족과 관련된 기분 저하를 경험하고 계신 거군요"
 *   ✅ "귀에서 울리는 소리와 관련된 불안 및 수면 방해"
 *   ✅ "밤에 자주 깨는 현상과 관련된 피로감"
 *
 * 모든 신체/정신 증상에 대해:
 *   1. 먼저 의료 전문가 상담 권유 (협력문제 감지)
 *   2. 그 증상과 관련된 심리적/신체적 영향을 함께 관찰 (현상 파악)
 *   3. 일상 속 자기돌봄 방법 제시 (데이터 기반 지원)
 */

// =====================================================
// CareFlow 자기관찰 프레임워크 v6
// NANDA 간호 진단 기반 (관찰→자극→경로→반응→정서→함께 관리하기)
// 4축 + 위기 감지 레이어 (CareFlow 독자 설계, 내부 참고용)
//
// 간호 이론적 근거:
//   - Orem Self-Care Deficit Theory (자기돌봄 이론)
//   - Gordon Functional Health Patterns (기능적 건강 패턴)
//   - NANDA-I Nursing Diagnoses (간호 진단) — 내부 임상 근거용
//
// 📌 의료 분류 기준 (ICD-10 | KCD 병행):
//   - ICD-10 (국제기준): WHO 국제질병분류
//   - KCD (한국기준): 한국표준질병사인분류
//   - 공식 참조: https://www.koicd.kr/ (질병분류정보센터)
//   - 공식 참조: https://kcdcode.kr/ (KCD 코드 검색)
//   - 모든 코드는 "ICD-10 | KCD" 형식으로 표기
//   - ⚠️ 주의: 이 분류는 개발팀 참고용이며, 사용자에게는 노출되지 않습니다
//
// 본 분류 체계는 CareFlow 독자 설계이며 NANDA 간호 진단을
// 최대한 반영하되, 특정 기관의 분류를 복제하지 않습니다.
//
// NANDA 간호 진단 구조 적용 (내부 논리용):
//   1. 관찰 영역(Observation): 간호 진단 영역
//   2. 자극(Stimulus): 원인/유발요인
//   3. 경로(Pathophysiology): 생리적/심리적 기전
//   4. 반응(Response): 주요 증상/행동
//   5. 정서(Emotion): 감정적 경험
//   6. 함께 관리하기(Therapeutic): 자기돌봄 중재
// =====================================================

// ─────────────────────────────────────────────────────
// 🚦 신호등 색 × NANDA 4가지 유형 (v4.1 "Related To" 프레임워크)
// ─────────────────────────────────────────────────────
// CareFlow는 이 4가지 유형을 명확히 구분하여 대응합니다.
// 모든 응답은 "~과 관련된 현상" 표현으로 진단이 아닌 관찰 기반 접근을 유지합니다.
//
// 🟢 1️⃣ 안녕 간호진단 — Readiness for enhanced ~~
//    - 사용자가 현재 건강 상태에 만족
//    - 더 향상시키고자 하는 의지를 보임
//    - 자료: S (주관적 자료만 가능)
//    - CareFlow 응답: 자기돌봄 강화 제안
//    - 예: "Readiness for enhanced stress management"
//         → "스트레스 관리 능력 강화에 관심 보임"
//
// 🟡 2️⃣ 위험 간호진단 — Risk for ~~
//    - 문제가 아직 발생하지 않았으나 위험 신호 있음
//    - O + S 자료 수집 필수
//    - CareFlow 응답: 패턴 인식 + 예방적 모니터링
//    - 예: "Risk for anxiety related to sleep deprivation"
//         → "수면 부족과 관련된 불안 위험"
//
// 🟠 3️⃣ 실제 간호진단 — Actual ~~
//    - 이미 발생한 심리적 반응 (실제 진단)
//    - O + S 자료로 확인된 현상
//    - CareFlow 응답: 현상 기반 심리적 지원 + 자기돌봄
//    - 예: "Disturbed sleep pattern related to anxiety"
//         → "불안과 관련된 수면 방해 및 활동 제약"
//
// 🔴 4️⃣ 협력문제 — Potential Complication of ~~
//    - 의료 전문가의 개입이 필수인 문제 (신체/정신질환)
//    - O + S 자료로 의료적 신호 감지
//    - CareFlow 응답: 즉시 의료 연결 + 심리적 지원
//    - 예: "PC: Hearing loss related to chronic tinnitus"
//         → "이명 증상과 관련된 청력 손상 위험 → 이비인후과 상담 권유"
//    - ⚠️ 의료 영역: 진단, 치료, 약물 (의료 전문가만 가능)
//    - ✅ CareFlow 영역: 현상 파악, 의료 연결, 심리 지원
//
export type NANDADiagnosisType =
  | 'wellness'      // 🟢 안녕 간호진단 — Readiness for enhanced ~~
  | 'risk'          // 🟡 위험 간호진단 — Risk for ~~
  | 'actual'        // 🟠 실제 간호진단 — Actual ~~
  | 'collaborative' // 🔴 협력문제 — Potential Complication of ~~

// ─────────────────────────────────────────────────────
// 위기 감지 레이어 타입 (Safety Layer)
// ─────────────────────────────────────────────────────
// NANDA 진단 유형과 함께 사용되는 "긴급성" 레벨
// 🔴 critical : 즉각 응급 개입 필요 (자해/자살 관련) → 의료 전문가/응급실
// 🟠 urgent   : 조기 전문가 연결 필요 (심각한 기능 저하) → 의료 전문가 우선
// 🟡 monitor  : 지속 모니터링 권고 (만성 패턴) → CareFlow + 정기 의료 상담
// 🟢 none     : 자기돌봄 범위 (일상적 어려움) → CareFlow 자기돌봄 중심
export type CrisisLevel = 'critical' | 'urgent' | 'monitor' | 'none'

// ─────────────────────────────────────────────────────
// 대화 모드 (ConversationMode)
// ─────────────────────────────────────────────────────
// '친근' : 반말/편한 말투. 친구처럼 편하게 이야기하는 느낌.
// '엄격' : 격식체 존댓말. 정중하고 명확한 표현.
// (온보딩에서 사용자가 직접 선택)
export type ConversationMode = '친근' | '엄격'

// ─────────────────────────────────────────────────────
// 4축 (CareFlow 관찰 체계)
// ─────────────────────────────────────────────────────
export type CareAxis = 'Body' | 'Emotion' | 'Connection' | 'Meaning'

// ─────────────────────────────────────────────────────
// 관찰 도메인 (각 축의 하위 영역) × NANDA 간호 진단
// ─────────────────────────────────────────────────────
// 각 도메인은 NANDA 간호 진단으로 매핑되어, 유형→자극→경로→반응→정서→치료 순서로 응답됨

export type ObservationDomain =
  // [Body Axis] 신체적 자기돌봄
  | 'Sleep'         // 수면 패턴 장애, 야간각성, 회복 부족
  | 'Energy'        // 활동 불내증, 진행성 피로, 거대 피로 증후군
  | 'BodySignals'   // 신체신호 인식 부족, 감각 과민, 신체 박리

  // [Emotion Axis] 정서적 자기돌봄
  | 'EmotionFlow'   // 감정 불안정, 감수성 증가, 표현 곤란
  | 'Tension'       // 일반화 불안, 반복 걱정, 신체화 불안
  | 'SelfView'      // 자존감 저하, 내적 비판, 부정적 스키마

  // [Connection Axis] 관계적 자기돌봄
  | 'Relationship'  // 사회적 고립, 관계 회피, 친밀감 장애

  // [Meaning Axis] 의미 관련 자기돌봄
  | 'Direction'     // 절망감, 무의미감, 영적 고통
  | 'Growth'        // 변화 저항, 성장 두려움, 자기실현 추구

  // [Fallback] 통합적 자기돌봄
  | 'General'       // 정서적 소진, 자기 인식 부족, 현존 능력

export const domainAxisMap: Record<ObservationDomain, CareAxis> = {
  Sleep: 'Body',
  Energy: 'Body',
  BodySignals: 'Body',
  EmotionFlow: 'Emotion',
  Tension: 'Emotion',
  SelfView: 'Emotion',
  Relationship: 'Connection',
  Direction: 'Meaning',
  Growth: 'Meaning',
  General: 'Meaning',
}

// ─────────────────────────────────────────────────────
// 인터페이스
// ─────────────────────────────────────────────────────
export interface DomainSignal {
  domain: ObservationDomain
  score: number
  axis: CareAxis
}

export interface CareflowAssessment {
  primaryDomain: ObservationDomain
  activeDomains: DomainSignal[]        // score > 0, 높은 순 정렬
  axisScores: Record<CareAxis, number>
  crisisLevel: CrisisLevel
  detectedKeywords: string[]
  referralInfo?: ReferralInfo
}

export interface ReferralInfo {
  level: CrisisLevel
  hotline?: string
  message: string
}

// =====================================================
// 위기 감지 레이어 — 최우선 실행
// =====================================================

// 🔴 즉각 개입 (자해·자살 의도)
const CRITICAL_KEYWORDS = [
  '죽고 싶', '자살', '자해하고 싶', '살기 싫다', '살기 싫어', '사라지고 싶',
  '극단적 선택', '다 끝내고 싶', '없어지고 싶', '죽어버리고', '죽어버릴',
  '자해했', '자해를 했', '스스로 다쳤', '목숨을 끊',
]

// 🟠 긴급 (심각한 현실 기능 저하)
const URGENT_KEYWORDS = [
  '환청', '환각', '목소리가 들려', '누가 나를 감시', '피해망상',
  '2주 넘게 못 잤', '한 달 넘게 아무것도', '밥을 안 먹은 지',
  '움직일 수가 없어', '완전히 무너', '현실이 아닌 것 같',
]

// 🟡 모니터링 (만성 패턴)
const MONITOR_KEYWORDS = [
  '몇 주째', '몇 달째', '계속 이러고', '나아질 기미가', '항상 이래',
  '만성', '오래됐어', '이미 포기', '반복되는', '그냥 살기가 싫어',
]

export function detectCrisisLevel(message: string): CrisisLevel {
  const msg = message.toLowerCase()
  if (CRITICAL_KEYWORDS.some(kw => msg.includes(kw))) return 'critical'
  if (URGENT_KEYWORDS.some(kw => msg.includes(kw))) return 'urgent'
  if (MONITOR_KEYWORDS.some(kw => msg.includes(kw))) return 'monitor'
  return 'none'
}

export function buildReferralInfo(level: CrisisLevel): ReferralInfo | undefined {
  switch (level) {
    case 'critical':
      return {
        level,
        hotline: '1393',
        message:
          '지금 많이 힘드시죠. 혼자 감당하기 너무 힘든 순간이에요.\n' +
          '지금 바로 자살예방상담전화 **1393**에 전화해주세요. 24시간 무료로 연결돼요.\n' +
          '당신 곁에 함께 있어 드릴게요.',
      }
    case 'urgent':
      return {
        level,
        hotline: '1577-0199',
        message:
          '지금 경험하고 있는 것들이 굉장히 힘들게 느껴지겠어요.\n' +
          '정신건강위기상담전화 **1577-0199**에 연락하시면 가까운 정신건강복지센터를 안내받을 수 있어요.\n' +
          '전문가의 도움이 지금 가장 필요한 일이에요.',
      }
    case 'monitor':
      return {
        level,
        message:
          '오랫동안 많이 무거우셨겠어요. 그 무게가 느껴져요.\n' +
          '가까운 정신건강복지센터(무료)에서 전문가와 이야기해보시는 건 어떨까요?',
      }
    default:
      return undefined
  }
}

// =====================================================
// 관찰 신호 매핑 — 키워드 → 복수 도메인 동시 감지
// 한 키워드가 여러 축에 걸칠 수 있음
// =====================================================

const DOMAIN_SIGNALS: Record<string, { domain: ObservationDomain; weight: number }[]> = {

  // ── Body: Sleep ──────────────────────────────────
  '잠을 못':        [{ domain: 'Sleep', weight: 3 }, { domain: 'Energy', weight: 1 }],
  '잠이 안':        [{ domain: 'Sleep', weight: 3 }],
  '새벽에 깨':      [{ domain: 'Sleep', weight: 2 }],
  '너무 많이 자':   [{ domain: 'Sleep', weight: 2 }, { domain: 'Energy', weight: 1 }],
  '수면':           [{ domain: 'Sleep', weight: 2 }],
  '피곤한데 못 자': [{ domain: 'Sleep', weight: 3 }],
  '잠이 오질 않':   [{ domain: 'Sleep', weight: 3 }],

  // ── Body: Energy ─────────────────────────────────
  '지쳤어':       [{ domain: 'Energy', weight: 2 }, { domain: 'EmotionFlow', weight: 1 }],
  '너무 지쳤':    [{ domain: 'Energy', weight: 2 }, { domain: 'EmotionFlow', weight: 1 }],
  '무기력':       [{ domain: 'Energy', weight: 2 }, { domain: 'Direction', weight: 1 }],
  '의욕 없':      [{ domain: 'Energy', weight: 2 }, { domain: 'Direction', weight: 1 }],
  '번아웃':       [{ domain: 'Energy', weight: 2 }, { domain: 'EmotionFlow', weight: 1 }],
  '아무것도':     [{ domain: 'Energy', weight: 2 }, { domain: 'EmotionFlow', weight: 1 }],
  '못했어':       [{ domain: 'Energy', weight: 1 }, { domain: 'SelfView', weight: 1 }],
  '미루고':       [{ domain: 'Energy', weight: 2 }],
  '피하고':       [{ domain: 'Energy', weight: 1 }, { domain: 'Tension', weight: 1 }],
  '포기':         [{ domain: 'Energy', weight: 1 }, { domain: 'Direction', weight: 1 }],
  '할 수가 없':   [{ domain: 'Energy', weight: 2 }],
  '너무 힘들':    [{ domain: 'Energy', weight: 1 }, { domain: 'EmotionFlow', weight: 1 }],

  // ── Body: BodySignals ────────────────────────────
  '심장':          [{ domain: 'BodySignals', weight: 2 }, { domain: 'Tension', weight: 1 }],
  '떨려':          [{ domain: 'BodySignals', weight: 2 }, { domain: 'Tension', weight: 1 }],
  '가슴이 답답':   [{ domain: 'BodySignals', weight: 2 }, { domain: 'Tension', weight: 1 }],
  '숨이':          [{ domain: 'BodySignals', weight: 2 }, { domain: 'Tension', weight: 1 }],
  '목이 조':       [{ domain: 'BodySignals', weight: 2 }],
  '밥맛':          [{ domain: 'BodySignals', weight: 2 }, { domain: 'Energy', weight: 1 }],
  '식욕':          [{ domain: 'BodySignals', weight: 2 }],
  '두통':          [{ domain: 'BodySignals', weight: 2 }, { domain: 'Energy', weight: 1 }],
  '몸이 무거':     [{ domain: 'BodySignals', weight: 2 }, { domain: 'Energy', weight: 1 }],
  '메스꺼':        [{ domain: 'BodySignals', weight: 2 }],

  // ── Body: BodySignals — 만성 감각 증상 (ICD-10 | KCD 기준) ──────────
  // 이명·비문증·어지럼증은 다른 멘탈헬스 앱이 커버하지 않는 CareFlow 차별화 영역.
  // 의학 분류: 이명(ICD-10: H93.1 | KCD: H93.1), 비문증(ICD-10: H43.39 | KCD: H43.39)
  //           어지럼증(ICD-10: R42 | KCD: R42), 메니에르병(ICD-10: H81.0 | KCD: H81.0)
  // 만성적 감각 증상 → 직접 신호(3) + 삶의 방향감/불안 이차 영향(1-2)
  // 참조: https://www.koicd.kr/ (한국표준질병사인분류 검색)

  // ─ 이명(Tinnitus) [ICD-10: H93.1 | KCD: H93.1] ─
  '이명':           [{ domain: 'BodySignals', weight: 3 }, { domain: 'Direction', weight: 1 }, { domain: 'Tension', weight: 1 }],
  '귀에서 소리':    [{ domain: 'BodySignals', weight: 3 }, { domain: 'Direction', weight: 1 }],
  '귀울림':         [{ domain: 'BodySignals', weight: 3 }, { domain: 'Direction', weight: 1 }],
  '윙윙대는':       [{ domain: 'BodySignals', weight: 2 }, { domain: 'Tension', weight: 1 }],
  '삐익거리는':     [{ domain: 'BodySignals', weight: 2 }, { domain: 'Tension', weight: 1 }],
  '울림이 심해':    [{ domain: 'BodySignals', weight: 3 }, { domain: 'Tension', weight: 2 }],

  // ─ 비문증(Floaters) [ICD-10: H43.39 | KCD: H43.39] ─
  '비문증':         [{ domain: 'BodySignals', weight: 3 }, { domain: 'Tension', weight: 1 }],
  '눈앞에 뭔가':    [{ domain: 'BodySignals', weight: 2 }, { domain: 'Tension', weight: 1 }],
  '눈에 뭔가 떠':   [{ domain: 'BodySignals', weight: 2 }, { domain: 'Tension', weight: 1 }],
  '눈에 검은 점':   [{ domain: 'BodySignals', weight: 2 }, { domain: 'Tension', weight: 1 }],
  '띠':             [{ domain: 'BodySignals', weight: 2 }],

  // ─ 신체증상 복합 ─
  '소리가 계속':    [{ domain: 'BodySignals', weight: 2 }, { domain: 'Tension', weight: 1 }],
  '만성':           [{ domain: 'BodySignals', weight: 1 }, { domain: 'Direction', weight: 1 }],

  // ── Body: BodySignals — 어지럼증·전정 증상 (ICD-10 | KCD 기준) ──────
  // 어지럼증은 성인 20%가 연 1회 이상 경험. 메니에르병 등 만성 전정질환 포함.
  // ICD-10: R42 (어지러움) | H81 (전정기능 장애)
  // KCD: R42 (어지러움) | H81 (전정기능 장애)
  // 의료가 "함께 살아가야 한다"고 할 때, CareFlow는 오늘 그 상태를 함께 관찰.
  '어지럼':         [{ domain: 'BodySignals', weight: 3 }, { domain: 'Tension', weight: 1 }],
  '어지러':         [{ domain: 'BodySignals', weight: 3 }, { domain: 'Tension', weight: 1 }],
  '어지럼증':       [{ domain: 'BodySignals', weight: 3 }, { domain: 'Direction', weight: 1 }],
  '현기증':         [{ domain: 'BodySignals', weight: 3 }, { domain: 'Tension', weight: 1 }],
  '현훈':           [{ domain: 'BodySignals', weight: 3 }, { domain: 'Direction', weight: 1 }],
  '빙빙':           [{ domain: 'BodySignals', weight: 2 }, { domain: 'Tension', weight: 1 }],
  '세상이 돌':      [{ domain: 'BodySignals', weight: 3 }, { domain: 'Tension', weight: 1 }],
  '메니에르':       [{ domain: 'BodySignals', weight: 3 }, { domain: 'Direction', weight: 1 }],
  '균형을 잃':      [{ domain: 'BodySignals', weight: 2 }, { domain: 'Energy', weight: 1 }],
  '이충만감':       [{ domain: 'BodySignals', weight: 2 }],
  '귀가 먹먹':      [{ domain: 'BodySignals', weight: 2 }],
  '발작':           [{ domain: 'BodySignals', weight: 2 }, { domain: 'Tension', weight: 2 }],

  // ── Emotion: Tension ─────────────────────────────
  '불안':          [{ domain: 'Tension', weight: 2 }, { domain: 'BodySignals', weight: 1 }],
  '걱정':          [{ domain: 'Tension', weight: 2 }],
  '두려워':        [{ domain: 'Tension', weight: 2 }],
  '무서워':        [{ domain: 'Tension', weight: 2 }, { domain: 'BodySignals', weight: 1 }],
  '긴장':          [{ domain: 'Tension', weight: 2 }, { domain: 'BodySignals', weight: 1 }],
  '조마조마':      [{ domain: 'Tension', weight: 2 }],
  '스트레스':      [{ domain: 'Tension', weight: 1 }, { domain: 'Energy', weight: 1 }],
  '압박':          [{ domain: 'Tension', weight: 2 }],
  '어떡하':        [{ domain: 'Tension', weight: 1 }],
  '벅차':          [{ domain: 'Tension', weight: 1 }, { domain: 'Energy', weight: 1 }],
  '이유를 모르겠': [{ domain: 'Tension', weight: 1 }, { domain: 'EmotionFlow', weight: 1 }],

  // ── Emotion: EmotionFlow ─────────────────────────
  '기분이 자꾸 바뀌': [{ domain: 'EmotionFlow', weight: 2 }],
  '감정 기복':         [{ domain: 'EmotionFlow', weight: 2 }],
  '갑자기 화가':       [{ domain: 'EmotionFlow', weight: 2 }],
  '화가 나':           [{ domain: 'EmotionFlow', weight: 2 }],
  '짜증':              [{ domain: 'EmotionFlow', weight: 2 }, { domain: 'Tension', weight: 1 }],
  '열받':              [{ domain: 'EmotionFlow', weight: 2 }],
  '웃다가 울':         [{ domain: 'EmotionFlow', weight: 2 }],
  '왜 이렇게 예민':    [{ domain: 'EmotionFlow', weight: 2 }],
  '감정 조절':         [{ domain: 'EmotionFlow', weight: 2 }],
  '기분이 오락가락':   [{ domain: 'EmotionFlow', weight: 2 }],

  // ── Emotion: SelfView ────────────────────────────
  '나는 왜':  [{ domain: 'SelfView', weight: 2 }],
  '바보같':   [{ domain: 'SelfView', weight: 2 }],
  '한심':     [{ domain: 'SelfView', weight: 2 }],
  '못난':     [{ domain: 'SelfView', weight: 2 }],
  '쓸모없':   [{ domain: 'SelfView', weight: 2 }, { domain: 'Direction', weight: 1 }],
  '난 안 돼': [{ domain: 'SelfView', weight: 2 }],
  '실패':     [{ domain: 'SelfView', weight: 1 }, { domain: 'Tension', weight: 1 }],
  '나만':     [{ domain: 'SelfView', weight: 1 }, { domain: 'Relationship', weight: 1 }],
  '능력 없':  [{ domain: 'SelfView', weight: 2 }],

  // ── Connection: Relationship ─────────────────────
  '혼자':           [{ domain: 'Relationship', weight: 1 }],
  '아무도 없':      [{ domain: 'Relationship', weight: 2 }, { domain: 'Direction', weight: 1 }],
  '외로워':         [{ domain: 'Relationship', weight: 2 }],
  '친구가 없':      [{ domain: 'Relationship', weight: 2 }],
  '말할 사람이 없': [{ domain: 'Relationship', weight: 2 }],
  '사람들이 싫':    [{ domain: 'Relationship', weight: 1 }, { domain: 'EmotionFlow', weight: 1 }],
  '나만 이런':      [{ domain: 'Relationship', weight: 1 }, { domain: 'SelfView', weight: 1 }],
  '연결':           [{ domain: 'Relationship', weight: 1 }],

  // ── Meaning: Direction ───────────────────────────
  '희망이 없':      [{ domain: 'Direction', weight: 2 }],
  '의미가 없':      [{ domain: 'Direction', weight: 2 }],
  '미래가 안 보':   [{ domain: 'Direction', weight: 2 }],
  '나아질 것 같지': [{ domain: 'Direction', weight: 2 }],
  '다 소용없':      [{ domain: 'Direction', weight: 2 }],
  '아무 의미':      [{ domain: 'Direction', weight: 2 }],
  '살아야 할 이유': [{ domain: 'Direction', weight: 2 }],

  // ── Meaning: Growth ──────────────────────────────
  '나아지고 싶': [{ domain: 'Growth', weight: 2 }],
  '변하고 싶':   [{ domain: 'Growth', weight: 2 }],
  '노력해볼게':  [{ domain: 'Growth', weight: 2 }],
  '어떻게 하면': [{ domain: 'Growth', weight: 1 }],
  '도움이 필요': [{ domain: 'Growth', weight: 1 }],
  '해보고 싶':   [{ domain: 'Growth', weight: 1 }],
  '달라지고 싶': [{ domain: 'Growth', weight: 2 }],
}

// =====================================================
// 사정 함수 — 복수 도메인 동시 감지
// =====================================================

export function assessMessage(message: string): CareflowAssessment {
  const lowerMsg = message.toLowerCase()

  // 위기 감지 최우선
  const crisisLevel = detectCrisisLevel(lowerMsg)
  const referralInfo = buildReferralInfo(crisisLevel)

  // 도메인별 점수 초기화
  const scores: Record<ObservationDomain, number> = {
    Sleep: 0, Energy: 0, BodySignals: 0,
    EmotionFlow: 0, Tension: 0, SelfView: 0,
    Relationship: 0,
    Direction: 0, Growth: 0,
    General: 0,
  }

  const detected: string[] = []

  for (const [keyword, targets] of Object.entries(DOMAIN_SIGNALS)) {
    if (lowerMsg.includes(keyword)) {
      detected.push(keyword)
      for (const { domain, weight } of targets) {
        scores[domain] += weight
      }
    }
  }

  // 축별 점수 집계
  const axisScores: Record<CareAxis, number> = {
    Body: 0, Emotion: 0, Connection: 0, Meaning: 0,
  }
  for (const [domain, score] of Object.entries(scores) as [ObservationDomain, number][]) {
    if (score > 0) {
      axisScores[domainAxisMap[domain]] += score
    }
  }

  // 활성 도메인 정렬 (score > 0, 높은 순)
  const activeDomains: DomainSignal[] = (
    Object.entries(scores) as [ObservationDomain, number][]
  )
    .filter(([, score]) => score > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([domain, score]) => ({ domain, score, axis: domainAxisMap[domain] }))

  const primaryDomain: ObservationDomain =
    activeDomains.length > 0 ? activeDomains[0].domain : 'General'

  return {
    primaryDomain,
    activeDomains,
    axisScores,
    crisisLevel,
    detectedKeywords: Array.from(new Set(detected)),
    referralInfo,
  }
}

// =====================================================
// 자기돌봄 방향 (내부용 — 사용자에게 그대로 노출 안 됨)
// =====================================================

const careDirections: Record<ObservationDomain, string> = {
  Sleep:
    '수면과 회복 상태에 초점. 잠들기 전 어떤 상태인지 물어보기. 취침 전 5분 루틴 1가지 제안.',
  Energy:
    '에너지 고갈 패턴 탐색. 지금 당장 5분 안에 할 수 있는 아주 작은 행동 하나만 제안. 회피가 아닌 아주 작은 시작.',
  BodySignals:
    '이명·비문증·어지럼증 등 만성 감각 증상이 감지된 경우: ' +
    '이곳은 치료하는 공간이 아님을 전제. "의사도 뾰족한 방법이 없다고 했어요" 또는 "함께 살아가야 한다고 했어요"라는 현실 속에 있는 사람을 상정. ' +
    '증상 자체를 고치거나 민간요법·식이요법을 제안하려 하지 말 것. ' +
    '\n[다중 진료과 현실 인식] ' +
    '이명은 이비인후과, 비문증은 안과, 그러나 동시에 정신건강의학과 약물을 복용하기도 한다. ' +
    '한 명의 환자가 여러 진료과를 넘나드는 현실에서, CareFlow는 그 사이 공간을 채우는 역할. ' +
    '어떤 과에서 어떻게 치료받으라고 안내하는 것이 아니라, 오늘 몸이 어떤 상태인지를 함께 살피는 것. ' +
    '여러 진료과가 연결된 복잡한 상황을 사용자가 언급할 경우: "그 사이에서 오늘 가장 힘든 게 어느 쪽이에요?" 처럼 현재에 집중. ' +
    '약물에 대해 묻는 경우: 구체적인 처방 안내는 전문의에게, 약물 정보는 의약품안전나라(karp.drugsafe.or.kr)를 안내할 것. ' +
    '\n[이명 환자 평온 요소 주의] ' +
    '이명이 감지된 경우, 오늘 평온을 깬 환경 요소가 있었는지 자연스럽게 물어볼 것. ' +
    '예: "오늘 갑작스러운 큰 소리가 있었어요?", "시끄러운 공간에 있었나요?" ' +
    '높은 데시벨 환경(공사 소음, 갑작스러운 경보음, 콘서트 등)은 이명을 악화시킬 수 있음. ' +
    '이를 사전에 파악하고 "오늘 소리 환경이 어땠는지"를 관찰 항목으로 다룰 것. ' +
    '\n[증상 악화 시 감정 빠른 체크] ' +
    '이명·비문증·어지럼이 심한 날에는 짜증·불안·무력감이 동반될 수 있음. ' +
    '증상 악화 감지 시: "그게 심했던 오늘, 감정은 어땠어요?" 같이 짧게 감정 상태도 함께 체크. ' +
    '사회적 자아 보호 질문: "주변 사람들한테 영향이 갔나요?", "오늘 일하거나 대화하는 데 어려움이 있었어요?" ' +
    '\n[비문증 주기 관찰] ' +
    '비문증이 심한 날 기록 → "이번 주 심한 날이 며칠이었어요?"처럼 주기 파악 유도. 캘린더 기록 권유 가능. ' +
    '\n대신 "그 증상과 함께 오늘 하루를 어떻게 버텨냈는지"에 집중. ' +
    '어지럼 감지 시: "오늘 발작처럼 왔어요, 아니면 만성적인 어지럼이에요?", "어지럼이 올 때 기분은 어떤가요?" ' +
    '이명 감지 시: "그 소리가 오늘은 얼마나 크게 느껴졌어요?", "심해지는 날 뭐가 제일 달라져요?" ' +
    '오늘 그 상태를 함께 관찰하는 것 자체가 목표. ' +
    '일반 몸 신호(두통·두근거림 등)는 지금 어느 부분에서 느껴지는지 물어보고 복식호흡 또는 몸 스캔 제안.',
  Tension:
    '긴장과 불안의 신체적 감각 공감. 5-4-3-2-1 그라운딩 또는 복식호흡 제안. "지금 여기"에 집중 유도.',
  EmotionFlow:
    '감정 흐름의 자연스러움 인정. 지금 이 순간의 감정 이름 붙이기 유도. 판단 없이 관찰하는 태도 권유.',
  SelfView:
    '자기 비난 패턴 인식. 같은 상황의 친한 친구에게 뭐라고 할지 물어보기. 작은 것도 인정하는 연습.',
  Relationship:
    '연결의 욕구 공감. 지금 연락할 수 있는 한 사람 탐색. 연결 자체의 두려움도 열린 질문으로 탐색.',
  Direction:
    '오늘 하루 딱 한 가지 의미 있는 것 탐색. 거창한 미래가 아닌 지금 이 순간에 집중. 아주 작은 것도 충분함을 인정.',
  Growth:
    '변화 의지를 적극 지지. 작고 구체적인 다음 단계 함께 설계. 완벽이 아닌 방향성이 중요함을 강조.',
  General:
    '열린 질문으로 더 깊은 이야기 이끌기. 몸, 감정, 관계, 의미 중 어디서 어려움이 있는지 탐색.',
}

// =====================================================
// 시스템 프롬프트 생성
// =====================================================

export function buildSystemPrompt(assessment: CareflowAssessment, mode: ConversationMode = '엄격'): string {
  const { activeDomains, axisScores, crisisLevel } = assessment

  // 상위 3개 관찰 영역의 자기돌봄 방향
  const topDirections = activeDomains.length > 0
    ? activeDomains.slice(0, 3)
        .map(({ domain }) => `- ${domainLabels[domain]}: ${careDirections[domain]}`)
        .join('\n')
    : `- ${careDirections['General']}`

  // 활성화된 축 요약
  const activeAxesSummary = (Object.entries(axisScores) as [CareAxis, number][])
    .filter(([, score]) => score > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([axis]) => axisLabels[axis])
    .join(', ') || '전반'

  const crisisNote = crisisLevel !== 'none'
    ? `\n\n[위기 감지: ${crisisLevel.toUpperCase()}]\n` +
      `반드시 전문 기관 연결 안내를 포함하세요. 공감 -> 위기 안내 -> 다음 단계 순서로.`
    : ''

  // 대화 모드별 말투 가이드
  const toneGuide = mode === '친근'
    ? `[대화 모드: 친근]
사용자가 반말/편한 말투를 선택했습니다. 친구처럼 자연스럽게 대화하세요.
- 말투: "어땠어?", "많이 힘들었겠다", "그래서 어떻게 됐어?"
- 감탄사/짧은 반응: "아, 그랬구나.", "그거 진짜 힘들었겠다."
- 조언: "이런 거 해봐." 대신 "이런 거 해보는 건 어때?"
- 절대 금지: "~하셨군요", "~겠어요" (격식체 혼용 금지)`
    : `[대화 모드: 엄격]
사용자가 격식체 존댓말을 선택했습니다. 정중하고 명확하게 대화하세요.
- 말투: "어떠셨어요?", "오늘 많이 힘드셨어요?", "그게 언제부터였어요?"
- 핵심 원칙: 감정을 대신 규정하지 않기. "힘드셨겠어요" 대신 "어떠셨어요?" (묻기)
- 짧고 명확하게. 길게 설명하지 않기.
- 절대 금지: "~하셨군요" (단언·투사식 표현), "그런 반응은 자연스러운 거예요" (가르치는 투)`

  return `당신은 CareFlow의 자기관찰 동행 AI입니다.

[역할]
사용자가 오늘 자신의 몸과 감정 상태를 스스로 들여다볼 수 있도록 함께합니다.
진단하거나 처방하지 않습니다. 일기장처럼 — 오늘의 나를 함께 기록하는 공간입니다.
이명·비문증·어지럼증처럼 의료가 "함께 살아가야 한다"고 한 그 이후, 아직 아무도 없던 자리에 있습니다.

[약물 원칙]
약물 기전·처방 변경·용량 판단은 다루지 않습니다.
약 관련 문의: "담당 선생님께 여쭤보시거나, 의약품안전나라(karp.drugsafe.or.kr)에서 확인해 보세요."

[한국어 대화 핵심 원칙]
- 감정을 대신 규정하지 말 것. "힘드셨겠어요" → "오늘 어떠셨어요?" (묻기가 먼저)
- "~구나", "~하셨군요" 단언 투사 표현 금지
- "그런 반응은 자연스러워요" 같은 가르치는 투 금지
- 짧고 자연스러운 한국어. 번역체 금지.
- 질문은 한 번에 하나만. 여러 개 묻지 말 것.

${toneGuide}

[절대 금지]
- 의학적 진단명 사용
- 임상 분류명·진단 코드 노출
- 첫 반응으로 "병원에 가세요" 단독 제시
- 근거 없는 낙관
- 4줄 이상 긴 답변
- 약물 기전 설명·처방 변경 제안·용량 판단

[오늘의 관찰 신호: ${activeAxesSummary} 영역]
${topDirections}

[응답 형식]
짧은 공감 1문장(감정 투사 없이) + 오늘 할 수 있는 작은 자기돌봄 행동 1가지 (5분 내)
${crisisNote}

언어: 사용자가 한국어로 쓰면 한국어로 답합니다.`
}

// =====================================================
// UI 표시용 레이블
// =====================================================

export const domainLabels: Record<ObservationDomain, string> = {
  Sleep: '잠과 회복',
  Energy: '에너지와 활동',
  BodySignals: '몸의 목소리',
  EmotionFlow: '감정의 흐름',
  Tension: '불안과 긴장',
  SelfView: '나를 대하는 방식',
  Relationship: '연결과 관계',
  Direction: '의미와 방향감',
  Growth: '성장 준비',
  General: '오늘의 나',
}

export const axisLabels: Record<CareAxis, string> = {
  Body: '몸',
  Emotion: '감정',
  Connection: '관계',
  Meaning: '의미',
}

export const crisisLabels: Record<CrisisLevel, string> = {
  critical: '즉각 개입 필요',
  urgent: '긴급 전문가 연결',
  monitor: '지속 모니터링',
  none: '자기돌봄 범위',
}
