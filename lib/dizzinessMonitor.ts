// ============================================================================
// 🌼 CareFlow — 어지럼증 센서 데이터 모니터 (Dizziness Sensor Monitor)
// ============================================================================
// Phase 4-C: Apple Watch 센서 데이터 수집 및 관리
//
// 📌 센서 접근 계층:
//   - 네이티브 앱 (Swift): CMMotionManager → 자이로 + 가속도 직접 접근 ✅
//   - 웹 앱 (Safari): DeviceMotion API → 제한적 (iOS 13+ 권한 필요) ⚠️
//   - HealthKit: 네이티브 앱 전용 (웹 접근 불가) ❌
//
// 📌 MVP 전략:
//   - Step 1: iOS Shortcuts → HealthKit 간접 연동 (심박, 수면, 활동)
//   - Step 2: Swift 네이티브 앱 → CMMotionManager 직접 접근 (자이로, 가속도)
//
// 📌 질병분류 기준 (ICD-10 | KCD 병행):
//   - 어지럼증: ICD-10: R42 | KCD: R42
//   - 전정기능 장애: ICD-10: H81 | KCD: H81
//   - 메니에르병: ICD-10: H81.0 | KCD: H81.0
//   - 공식 참조: https://www.koicd.kr/ (질병분류정보센터)
//   - 공식 참조: https://kcdcode.kr/ (KCD 코드 검색)
// ============================================================================

// ── 센서 원시 데이터 (Apple Watch CMMotionManager) ──────────────────────

/** 자이로스코프 데이터 (회전 운동) */
export interface GyroscopeData {
  x: number;          // 롤(Roll) — 좌우 회전 (rad/s)
  y: number;          // 피치(Pitch) — 앞뒤 기울기 (rad/s)
  z: number;          // 요(Yaw) — 수직축 회전 (rad/s)
  magnitude: number;  // √(x² + y² + z²) — 회전 강도
}

/** 가속도계 데이터 (직선 운동) */
export interface AccelerometerData {
  x: number;          // 좌우 흔들림 (g)
  y: number;          // 위아래 충격 (g)
  z: number;          // 앞뒤 움직임 (g)
  tilt: number;       // 신체 기울기 각도 (degrees)
}

// ── 어지럼증 측정 데이터 ────────────────────────────────────────────────

/** 어지럼증 심각도 */
export type DizzinessSeverity = 'mild' | 'moderate' | 'severe';

/** 센서 데이터 출처 */
export type SensorSource = 'apple_watch' | 'galaxy_watch' | 'iphone' | 'manual_input';

/** 어지럼증 센서 데이터 (단일 측정값) */
export interface DizzinessData {
  timestamp: string;                // ISO 8601
  gyroscope: GyroscopeData;         // 자이로 데이터
  accelerometer: AccelerometerData; // 가속도 데이터
  heartRate: number;                // 심박수 (bpm)
  heartRateVariability?: number;    // 심박 변동성 HRV (ms)
  confidence: number;               // 0-100: 어지럼증 감지 신뢰도
  severity: DizzinessSeverity;      // 심각도 분류
  duration: number;                 // 지속 시간 (초)
  source: SensorSource;             // 데이터 출처
}

/** 어지럼증 에피소드 (한 번의 발작 세션) */
export interface DizzinessSession {
  sessionId: string;
  startTime: string;                // ISO 8601
  endTime: string;                  // ISO 8601
  dataPoints: DizzinessData[];      // 수집된 센서 데이터
  peakSeverity: DizzinessSeverity;  // 세션 내 최고 심각도
  avgConfidence: number;            // 평균 신뢰도
  triggerEstimate: string;          // 추정 트리거
  symptomNotes: string;             // 사용자 입력
  environmentalContext?: {
    timeOfDay: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';
    posture: 'lying' | 'sitting' | 'standing' | 'walking';
    recentActivity?: string;
  };
}

// ── HealthKit 간접 데이터 (iOS Shortcuts MVP) ───────────────────────────

/** HealthKit에서 가져온 일일 건강 데이터 */
export interface HealthKitDailyData {
  date: string;                     // YYYY-MM-DD
  heartRate: {
    current: number;                // 현재 심박 (bpm)
    resting: number;                // 안정시 심박 (bpm)
    max: number;                    // 최대 심박
    min: number;                    // 최소 심박
    avg: number;                    // 평균 심박
  };
  heartRateVariability: {
    avg: number;                    // 평균 HRV (ms)
    trend: 'improving' | 'stable' | 'declining';
  };
  sleep: {
    duration: number;               // 총 수면 시간 (시간)
    deepSleep: number;              // 깊은 수면 (시간)
    remSleep: number;               // REM 수면 (시간)
    awakenings: number;             // 깨어난 횟수
    quality: 'poor' | 'fair' | 'good' | 'excellent';
  };
  activity: {
    steps: number;                  // 걸음 수
    distance: number;               // 이동 거리 (km)
    activeEnergy: number;           // 활동 칼로리 (kcal)
    exerciseMinutes: number;        // 운동 시간 (분)
    level: 'sedentary' | 'light' | 'moderate' | 'vigorous';
  };
  oxygen?: {
    spo2: number;                   // 혈중 산소 (%)
  };
  noise?: {
    avgDecibels: number;            // 평균 소음 (dB) — 이명 관련 간접 지표
  };
  source: 'ios_shortcuts' | 'native_app' | 'manual';
  syncedAt: string;                 // 동기화 시간
}

// ── CareFlow 통합 응답 ─────────────────────────────────────────────────

/** 센서 데이터 → CareFlow 도메인 점수 변환 결과 */
export interface SensorToCareFlowMapping {
  primaryDomain: 'BodySignals';
  axisScores: {
    Body: number;       // 0-10
    Emotion: number;    // 0-10
    Connection: number; // 0-10
    Meaning: number;    // 0-10
  };
  autoSuggestion: {
    diagnosis: string;
    confidence: number;
    icdCode: string;      // "ICD-10: R42 | KCD: R42"
    autoDetected: boolean;
    userConfirmationNeeded: boolean;
  };
  alerts: SensorAlert[];
}

/** 센서 기반 자동 알림 */
export interface SensorAlert {
  type: 'dizziness_detected' | 'heart_rate_spike' | 'sleep_deficit' | 'activity_drop';
  severity: 'info' | 'warning' | 'urgent';
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

// ── 유틸리티 함수 ───────────────────────────────────────────────────────

/** 자이로 크기(magnitude) 계산 */
export function calculateGyroMagnitude(gyro: Pick<GyroscopeData, 'x' | 'y' | 'z'>): number {
  return Math.sqrt(gyro.x ** 2 + gyro.y ** 2 + gyro.z ** 2);
}

/** 기울기 각도 계산 (가속도계 기반) */
export function calculateTilt(accel: Pick<AccelerometerData, 'x' | 'y' | 'z'>): number {
  const magnitude = Math.sqrt(accel.x ** 2 + accel.y ** 2 + accel.z ** 2);
  if (magnitude === 0) return 0;
  // z축 기준 기울기 (degrees)
  return Math.acos(Math.abs(accel.z) / magnitude) * (180 / Math.PI);
}

/** 심각도 판정 */
export function getSeverity(confidence: number): DizzinessSeverity {
  if (confidence >= 80) return 'severe';
  if (confidence >= 50) return 'moderate';
  return 'mild';
}

/** 세션 ID 생성 */
export function generateSessionId(): string {
  return `dz_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/** HealthKit 데이터 → CareFlow 도메인 점수 자동 변환 */
export function healthKitToCareFlow(data: HealthKitDailyData): SensorToCareFlowMapping {
  const bodyScore = Math.min(10, Math.round(
    (data.sleep.duration < 6 ? 4 : 1) +
    (data.activity.steps < 3000 ? 3 : 0) +
    (data.heartRate.avg > 90 ? 2 : 0)
  ));

  const emotionScore = Math.min(10, Math.round(
    (data.heartRate.avg > 85 ? 4 : 1) +
    (data.heartRateVariability.avg < 30 ? 3 : 0) +
    (data.sleep.quality === 'poor' ? 2 : 0)
  ));

  const connectionScore = Math.min(10, Math.round(
    (data.activity.steps < 3000 ? 4 : 1) +
    (data.activity.exerciseMinutes < 10 ? 2 : 0)
  ));

  const meaningScore = Math.min(10, Math.round(
    (data.sleep.duration < 5 ? 3 : 1) +
    (data.activity.level === 'sedentary' ? 2 : 0)
  ));

  const alerts: SensorAlert[] = [];

  if (data.heartRate.avg > 90) {
    alerts.push({
      type: 'heart_rate_spike',
      severity: 'warning',
      message: '심박수가 평소보다 높습니다. 스트레스나 불안을 확인해보세요.',
      timestamp: data.syncedAt,
    });
  }

  if (data.sleep.duration < 5) {
    alerts.push({
      type: 'sleep_deficit',
      severity: 'warning',
      message: `수면이 ${data.sleep.duration}시간으로 부족합니다. 충분한 휴식이 필요합니다.`,
      timestamp: data.syncedAt,
    });
  }

  if (data.activity.steps < 2000) {
    alerts.push({
      type: 'activity_drop',
      severity: 'info',
      message: '오늘 활동량이 매우 적습니다. 어지럼증이나 무기력감이 있는지 확인해보세요.',
      timestamp: data.syncedAt,
    });
  }

  return {
    primaryDomain: 'BodySignals',
    axisScores: {
      Body: bodyScore,
      Emotion: emotionScore,
      Connection: connectionScore,
      Meaning: meaningScore,
    },
    autoSuggestion: {
      diagnosis: bodyScore >= 6
        ? '어지럼증(현훈) 균형 불안'
        : emotionScore >= 6
        ? '일반화된 불안장애'
        : '신체 감각 과민',
      confidence: Math.min(1, (bodyScore + emotionScore) / 20),
      icdCode: 'ICD-10: R42 | KCD: R42',
      autoDetected: true,
      userConfirmationNeeded: true,
    },
    alerts,
  };
}
