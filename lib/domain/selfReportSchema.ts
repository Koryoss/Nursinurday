// ============================================================================
// 🌼 CareFlow — 자기보고 스키마 (Self-Report Schema)
// ============================================================================
// Phase 4-D: 이명/비문증 사용자 입력 양식 & 데이터 구조
//
// 📌 Tier 2 전략: 센서로 감지 불가능한 증상은 사용자 자기보고로 수집
//   - 이명(Tinnitus): 소리 특성, 강도, 주기, 트리거
//   - 비문증(Floaters): 가시성, 위치, 조명 조건, 불안감
//
// 📌 질병분류 기준 (ICD-10 | KCD 병행):
//   - 이명: ICD-10: H93.1 | KCD: H93.1
//   - 비문증: ICD-10: H43.39 | KCD: H43.39
//   - 공식 참조: https://www.koicd.kr/
//   - 공식 참조: https://kcdcode.kr/
// ============================================================================

// ── 공통 타입 ───────────────────────────────────────────────────────────

/** 시간대 */
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

/** 강도 (1-10 스케일) */
export type IntensityScale = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** 빈도 */
export type Frequency = 'rare' | 'sporadic' | '1-2_hours' | '3-5_hours' | 'continuous';

/** 추세 방향 */
export type TrendDirection = 'improving' | 'stable' | 'worsening';

// ── 이명(Tinnitus) 자기보고 ─────────────────────────────────────────────

/** 이명 소리 유형 */
export type TinnitusSound =
  | '윙윙'       // 낮은 울림
  | '삐익'       // 높은 음
  | '쌩'         // 바람 소리
  | '찌릿'       // 전기 같은 소리
  | '매미소리'   // 매미 우는 소리
  | '맥박소리'   // 심장 박동과 동기화 (박동성 이명)
  | '기타';      // 직접 입력

/** 이명 트리거 */
export type TinnitusTrigger =
  | '스트레스'
  | '수면부족'
  | '카페인'
  | '시끄러운환경'
  | '목긴장'
  | '피로'
  | '약물'
  | '없음'
  | '모르겠음';

/** 이명 자기보고 데이터 */
export interface TinnitusSelfReport {
  id: string;
  date: string;                     // YYYY-MM-DD
  time: TimeOfDay;
  intensity: IntensityScale;        // 1(거의 없음) ~ 10(극심함)
  duration: {
    minutes: number;                // 지속 시간 (분)
  };
  frequency: Frequency;
  sound: TinnitusSound;
  soundCustom?: string;             // sound가 '기타'일 때 직접 입력
  triggers: TinnitusTrigger[];      // 복수 선택 가능
  laterality: 'left' | 'right' | 'both' | 'unclear';  // 좌/우/양측/불명확
  sleep: {
    affected: boolean;              // 수면에 영향 줬는지
    hoursMissed?: number;           // 수면 방해로 잃은 시간
  };
  concentration: {
    affected: boolean;              // 집중력에 영향 줬는지
    level?: IntensityScale;         // 집중력 방해 정도 (1-10)
  };
  mood: IntensityScale;             // 기분 (1: 매우 나쁨 ~ 10: 매우 좋음)
  notes: string;                    // 자유 기록
  timestamp: string;                // ISO 8601 (기록 시점)
}

// ── 비문증(Floaters) 자기보고 ───────────────────────────────────────────

/** 비문증 위치 */
export type FloaterLocation = 'center' | 'periphery' | 'all' | 'moving';

/** 비문증 형태 */
export type FloaterShape =
  | '점'         // 작은 검은 점
  | '띠'         // 긴 실 모양
  | '거미줄'     // 거미줄 같은 형태
  | '고리'       // 원형
  | '구름'       // 흐릿한 덩어리
  | '기타';

/** 비문증 트리거 */
export type FloaterTrigger =
  | '눈피로'
  | '밝은곳'
  | '수면부족'
  | '스트레스'
  | '오래보기'    // 화면/책 오래 봤을 때
  | '없음'
  | '모르겠음';

/** 비문증 자기보고 데이터 */
export interface FloatersSelfReport {
  id: string;
  date: string;                     // YYYY-MM-DD
  time: TimeOfDay;
  visibility: IntensityScale;       // 1(거의 안 보임) ~ 10(매우 뚜렷함)
  location: FloaterLocation;
  shape: FloaterShape;
  shapeCustom?: string;
  quantity: 'few' | 'moderate' | 'many';
  brightness: 'dim_indoor' | 'bright_indoor' | 'overcast' | 'bright_outdoor';
  eye: 'left' | 'right' | 'both';
  triggers: FloaterTrigger[];
  anxiety: IntensityScale;          // 1(불안 없음) ~ 10(극심한 불안)
  newSymptom: boolean;              // 새로운 증상인지 (갑자기 증가 → 안과 진료 권유)
  flashesSeen: boolean;             // 번쩍임(photopsia) 동반 여부 → 안과 응급
  notes: string;
  timestamp: string;
}

// ── 어지럼증 자기보고 (센서 보완용) ─────────────────────────────────────

/** 어지럼증 트리거 */
export type DizzinessTrigger =
  | '자세변화'     // 일어나기, 돌아눕기
  | '고개돌림'     // 고개를 빠르게 돌림
  | '스트레스'
  | '수면부족'
  | '기상직후'
  | '운동후'
  | '식사전'       // 공복
  | '없음'
  | '모르겠음';

/** 어지럼증 자기보고 데이터 (센서가 없거나 보완할 때) */
export interface DizzinessSelfReport {
  id: string;
  date: string;
  time: TimeOfDay;
  intensity: IntensityScale;        // 1(거의 없음) ~ 10(극심함)
  type: 'spinning' | 'lightheaded' | 'unsteady' | 'floating';
  duration: {
    minutes: number;
  };
  triggers: DizzinessTrigger[];
  nausea: boolean;                  // 메스꺼움 동반
  fallRisk: boolean;                // 넘어질 뻔 했는지
  hearingChange: boolean;           // 청력 변화 (메니에르 의심)
  earFullness: boolean;             // 귀 충만감 (메니에르 의심)
  sensorDataAvailable: boolean;     // 워치 센서 데이터 있는지
  notes: string;
  timestamp: string;
}

// ── 통합 리포트 ─────────────────────────────────────────────────────────

/** 모든 자기보고 타입의 통합 */
export type SelfReport =
  | { type: 'tinnitus'; data: TinnitusSelfReport }
  | { type: 'floaters'; data: FloatersSelfReport }
  | { type: 'dizziness'; data: DizzinessSelfReport };

/** 일일 종합 리포트 */
export interface DailySummary {
  date: string;
  reports: SelfReport[];
  overallMood: IntensityScale;
  sleepHours: number;
  dominantSymptom: 'tinnitus' | 'floaters' | 'dizziness' | 'none';
  careflowDomainScores?: {
    Body: number;
    Emotion: number;
    Connection: number;
    Meaning: number;
  };
}

// ── 유틸리티 함수 ───────────────────────────────────────────────────────

/** 리포트 ID 생성 */
export function generateReportId(type: string): string {
  const prefix = type === 'tinnitus' ? 'tn' : type === 'floaters' ? 'fl' : 'dz';
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
}

/** 빈 이명 리포트 생성 (기본값) */
export function createEmptyTinnitusReport(): TinnitusSelfReport {
  return {
    id: generateReportId('tinnitus'),
    date: new Date().toISOString().split('T')[0],
    time: getCurrentTimeOfDay(),
    intensity: 5,
    duration: { minutes: 30 },
    frequency: 'sporadic',
    sound: '윙윙',
    triggers: [],
    laterality: 'both',
    sleep: { affected: false },
    concentration: { affected: false },
    mood: 5,
    notes: '',
    timestamp: new Date().toISOString(),
  };
}

/** 빈 비문증 리포트 생성 (기본값) */
export function createEmptyFloatersReport(): FloatersSelfReport {
  return {
    id: generateReportId('floaters'),
    date: new Date().toISOString().split('T')[0],
    time: getCurrentTimeOfDay(),
    visibility: 3,
    location: 'center',
    shape: '점',
    quantity: 'few',
    brightness: 'bright_indoor',
    eye: 'both',
    triggers: [],
    anxiety: 3,
    newSymptom: false,
    flashesSeen: false,
    notes: '',
    timestamp: new Date().toISOString(),
  };
}

/** 현재 시간대 반환 */
function getCurrentTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

/** 비문증 응급 체크: 번쩍임 + 갑자기 증가 → 안과 응급 권유 */
export function checkFloatersEmergency(report: FloatersSelfReport): {
  isEmergency: boolean;
  message: string;
} {
  if (report.flashesSeen && report.newSymptom) {
    return {
      isEmergency: true,
      message: '⚠️ 번쩍임과 함께 갑자기 비문증이 증가했습니다. 망막박리 가능성이 있으니 즉시 안과 진료를 받아주세요.',
    };
  }
  if (report.flashesSeen) {
    return {
      isEmergency: false,
      message: '번쩍임이 함께 보인다면 안과 상담을 추천합니다.',
    };
  }
  if (report.newSymptom && report.visibility >= 7) {
    return {
      isEmergency: false,
      message: '새로 생긴 증상이 강하게 보인다면 안과 확인을 권합니다.',
    };
  }
  return {
    isEmergency: false,
    message: '',
  };
}

/** 메니에르 의심 체크: 어지럼증 + 이명 + 청력변화 + 귀충만감 */
export function checkMenieresSuspicion(
  dizzinessReport: DizzinessSelfReport
): {
  isSuspected: boolean;
  matchedSymptoms: string[];
  message: string;
} {
  const symptoms: string[] = [];

  if (dizzinessReport.intensity >= 5) symptoms.push('어지럼증');
  if (dizzinessReport.hearingChange) symptoms.push('청력 변화');
  if (dizzinessReport.earFullness) symptoms.push('귀 충만감');

  // 3개 이상 증상 동시 → 메니에르 의심
  const isSuspected = symptoms.length >= 3;

  return {
    isSuspected,
    matchedSymptoms: symptoms,
    message: isSuspected
      ? `⚠️ 메니에르병 가능성: ${symptoms.join(', ')}이 동시에 나타났습니다. 이비인후과 진료를 권합니다. (ICD-10: H81.0 | KCD: H81.0)`
      : '',
  };
}
