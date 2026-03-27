// ============================================================================
// 🌼 CareFlow — 어지럼증 감지 알고리즘 (Dizziness Detection Engine)
// ============================================================================
// Phase 4-C: 센서 데이터 기반 어지럼증 에피소드 자동 감지
//
// 📌 감지 원리:
//   1. 자이로스코프 → 비정상적 회전 운동 감지 (rad/s 임계값 초과)
//   2. 가속도계 → 보행 불안정성, 급격한 기울기 변화 감지
//   3. 심박수 → 불안/스트레스 동반 여부 확인 (상관관계)
//   4. 패턴 분석 → 5초 이상 지속 시 에피소드로 판정
//
// 📌 Apple Watch 센서 스펙:
//   - 자이로스코프: ±2000 deg/s (약 ±34.9 rad/s)
//   - 가속도계: ±16g
//   - 심박 센서: 광학식 (PPG), 30-210 bpm
//   - 샘플링: 최대 100Hz (CoreMotion)
//
// 📌 질병분류 기준 (ICD-10 | KCD 병행):
//   - 어지럼증: ICD-10: R42 | KCD: R42
//   - 전정기능 장애: ICD-10: H81 | KCD: H81
//   - 공식 참조: https://www.koicd.kr/
// ============================================================================

import {
  DizzinessData,
  DizzinessSession,
  DizzinessSeverity,
  GyroscopeData,
  AccelerometerData,
  SensorAlert,
  calculateGyroMagnitude,
  calculateTilt,
  getSeverity,
  generateSessionId,
} from './dizzinessMonitor';

// ── 감지 임계값 설정 ────────────────────────────────────────────────────

export interface DetectionThresholds {
  /** 자이로 회전 속도 임계값 (rad/s) — 이 이상이면 비정상 회전 */
  gyroVelocity: number;
  /** 가속도 피크 임계값 (g) — 이 이상이면 급격한 움직임 */
  accelPeak: number;
  /** 기울기 변화 임계값 (degrees) — 이 이상이면 균형 불안정 */
  tiltChange: number;
  /** 심박 변화 임계값 (bpm) — 기준선 대비 이 이상 상승 시 */
  heartRateChange: number;
  /** 최소 지속 시간 (초) — 이 이상 지속 시 에피소드로 판정 */
  minDuration: number;
  /** 신뢰도 임계값 (0-100) — 이 이상일 때 알림 발송 */
  alertThreshold: number;
}

/** 기본 임계값 (임상 연구 기반 초기값, 사용자별 조정 가능) */
export const DEFAULT_THRESHOLDS: DetectionThresholds = {
  gyroVelocity: 2.0,       // rad/s — 일반 보행: 0.5~1.5, 어지럼증: 2.0+
  accelPeak: 1.5,           // g — 정상 보행: 0.8~1.2g, 비틀거림: 1.5g+
  tiltChange: 15,           // degrees — 정상: 5-10°, 불안정: 15°+
  heartRateChange: 15,      // bpm — 안정시 대비 15bpm+ 상승
  minDuration: 5,           // 5초 이상 지속
  alertThreshold: 70,       // 70% 이상 신뢰도일 때 알림
};

// ── 분석된 패턴 ─────────────────────────────────────────────────────────

interface AnalyzedPattern {
  startTime: string;
  endTime: string;
  data: DizzinessData[];
  amplitude: number;        // 평균 자이로 크기
  duration: number;         // 초
  accelTilt: number;        // 평균 기울기
  heartRateSpike: boolean;  // 심박 급등 여부
  hour: number;             // 발생 시간 (0-23)
}

// ── 메인 감지 클래스 ────────────────────────────────────────────────────

export class DizzinessDetector {
  private thresholds: DetectionThresholds;
  private baselineHeartRate: number;
  private dataBuffer: DizzinessData[] = [];
  private readonly BUFFER_SIZE = 600; // 최대 10분(1Hz) 또는 60초(10Hz)

  constructor(
    thresholds: DetectionThresholds = DEFAULT_THRESHOLDS,
    baselineHeartRate: number = 72
  ) {
    this.thresholds = thresholds;
    this.baselineHeartRate = baselineHeartRate;
  }

  /** 기준 심박수 업데이트 (사용자의 평소 안정 심박) */
  updateBaseline(restingHeartRate: number): void {
    this.baselineHeartRate = restingHeartRate;
  }

  /** 임계값 조정 (사용자 맞춤) */
  updateThresholds(partial: Partial<DetectionThresholds>): void {
    this.thresholds = { ...this.thresholds, ...partial };
  }

  /** 새 데이터 포인트 추가 및 실시간 분석 */
  addDataPoint(data: DizzinessData): SensorAlert | null {
    this.dataBuffer.push(data);

    // 버퍼 크기 제한
    if (this.dataBuffer.length > this.BUFFER_SIZE) {
      this.dataBuffer.shift();
    }

    // 실시간 임계값 검사
    if (data.confidence >= this.thresholds.alertThreshold) {
      return {
        type: 'dizziness_detected',
        severity: data.severity === 'severe' ? 'urgent' : 'warning',
        message: this.generateAlertMessage(data),
        timestamp: data.timestamp,
        data: {
          confidence: data.confidence,
          severity: data.severity,
          gyroMagnitude: data.gyroscope.magnitude,
          heartRate: data.heartRate,
        },
      };
    }

    return null;
  }

  /** 버퍼 데이터에서 에피소드 감지 */
  detectEpisode(): DizzinessSession | null {
    if (this.dataBuffer.length < 5) return null;

    // 1. 연속적인 불안정 패턴 탐색
    const pattern = this.findAnomalyPattern();
    if (!pattern) return null;

    // 2. 최소 지속 시간 확인
    if (pattern.duration < this.thresholds.minDuration) return null;

    // 3. 심박 상관관계 확인
    const heartRateCorrelation = this.calculateHeartRateCorrelation(pattern);

    // 4. 최종 세션 구성
    const peakSeverity = this.calculatePeakSeverity(pattern);

    return {
      sessionId: generateSessionId(),
      startTime: pattern.startTime,
      endTime: pattern.endTime,
      dataPoints: pattern.data,
      peakSeverity,
      avgConfidence: pattern.data.reduce((sum, d) => sum + d.confidence, 0) / pattern.data.length,
      triggerEstimate: this.estimateTrigger(pattern),
      symptomNotes: '',
      environmentalContext: {
        timeOfDay: this.getTimeOfDay(pattern.hour),
        posture: this.estimatePosture(pattern),
      },
    };
  }

  /** 버퍼 초기화 (에피소드 처리 후) */
  clearBuffer(): void {
    this.dataBuffer = [];
  }

  // ── Private 메서드 ──────────────────────────────────────────────────

  /** 비정상 패턴 탐색: 연속된 임계값 초과 구간 찾기 */
  private findAnomalyPattern(): AnalyzedPattern | null {
    const anomalies: DizzinessData[] = [];
    let inAnomaly = false;

    for (const point of this.dataBuffer) {
      const isAnomalous =
        point.gyroscope.magnitude > this.thresholds.gyroVelocity ||
        point.accelerometer.tilt > this.thresholds.tiltChange ||
        (point.heartRate - this.baselineHeartRate) > this.thresholds.heartRateChange;

      if (isAnomalous) {
        anomalies.push(point);
        inAnomaly = true;
      } else if (inAnomaly && anomalies.length >= 3) {
        // 잠깐 정상이어도 이미 충분한 데이터가 있으면 계속
        break;
      } else {
        // 패턴이 끊기면 리셋
        if (anomalies.length < 3) {
          anomalies.length = 0;
        }
        inAnomaly = false;
      }
    }

    if (anomalies.length < 3) return null;

    const startTime = anomalies[0].timestamp;
    const endTime = anomalies[anomalies.length - 1].timestamp;
    const duration = (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000;

    return {
      startTime,
      endTime,
      data: anomalies,
      amplitude: anomalies.reduce((sum, d) => sum + d.gyroscope.magnitude, 0) / anomalies.length,
      duration,
      accelTilt: anomalies.reduce((sum, d) => sum + d.accelerometer.tilt, 0) / anomalies.length,
      heartRateSpike: anomalies.some(d => (d.heartRate - this.baselineHeartRate) > this.thresholds.heartRateChange),
      hour: new Date(startTime).getHours(),
    };
  }

  /** 심박-어지럼증 상관관계 계산 */
  private calculateHeartRateCorrelation(pattern: AnalyzedPattern): number {
    if (pattern.data.length < 3) return 0;

    const gyroValues = pattern.data.map(d => d.gyroscope.magnitude);
    const hrValues = pattern.data.map(d => d.heartRate);

    return this.pearsonCorrelation(gyroValues, hrValues);
  }

  /** 피어슨 상관계수 */
  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n < 2) return 0;

    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }

    const denominator = Math.sqrt(denomX) * Math.sqrt(denomY);
    if (denominator === 0) return 0;

    return numerator / denominator;
  }

  /** 세션 내 최고 심각도 */
  private calculatePeakSeverity(pattern: AnalyzedPattern): DizzinessSeverity {
    const maxConfidence = Math.max(...pattern.data.map(d => d.confidence));
    return getSeverity(maxConfidence);
  }

  /** 트리거 추정 */
  private estimateTrigger(pattern: AnalyzedPattern): string {
    if (pattern.accelTilt > 30) return '갑작스러운 자세 변화';
    if (pattern.heartRateSpike) return '스트레스 또는 불안 동반';
    if (pattern.hour >= 0 && pattern.hour < 7) return '수면에서 깨어난 직후';
    if (pattern.hour >= 7 && pattern.hour < 9) return '기상 직후 (기립성)';
    if (pattern.amplitude > 3.0) return '강한 회전 운동 (BPPV 가능성)';
    return '원인 불명확 — 추가 관찰 필요';
  }

  /** 시간대 분류 */
  private getTimeOfDay(hour: number): 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night' {
    if (hour < 6) return 'dawn';
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }

  /** 자세 추정 (가속도 데이터 기반) */
  private estimatePosture(pattern: AnalyzedPattern): 'lying' | 'sitting' | 'standing' | 'walking' {
    const avgTilt = pattern.accelTilt;
    const avgAccelMag = pattern.data.reduce(
      (sum, d) => sum + Math.sqrt(d.accelerometer.x ** 2 + d.accelerometer.y ** 2 + d.accelerometer.z ** 2),
      0
    ) / pattern.data.length;

    if (avgTilt > 60) return 'lying';
    if (avgAccelMag < 1.05) return 'sitting';
    if (avgAccelMag < 1.3) return 'standing';
    return 'walking';
  }

  /** 알림 메시지 생성 */
  private generateAlertMessage(data: DizzinessData): string {
    if (data.severity === 'severe') {
      return '⚠️ 강한 어지럼증이 감지되었습니다. 안전한 곳에서 잠시 쉬어주세요. 증상이 계속되면 의료 상담을 권합니다.';
    }
    if (data.severity === 'moderate') {
      return '어지럼증이 감지되었습니다. 갑자기 움직이지 말고 천천히 움직여주세요.';
    }
    return '가벼운 어지럼증이 있는 것 같습니다. 잠시 쉬어가세요.';
  }
}

// ── 팩토리 함수 ─────────────────────────────────────────────────────────

/** 기본 설정으로 감지기 생성 */
export function createDizzinessDetector(
  baselineHeartRate?: number
): DizzinessDetector {
  return new DizzinessDetector(DEFAULT_THRESHOLDS, baselineHeartRate);
}

/** 민감도 높은 설정 (초기 모니터링용) */
export function createSensitiveDetector(
  baselineHeartRate?: number
): DizzinessDetector {
  return new DizzinessDetector(
    {
      gyroVelocity: 1.5,
      accelPeak: 1.2,
      tiltChange: 10,
      heartRateChange: 10,
      minDuration: 3,
      alertThreshold: 50,
    },
    baselineHeartRate
  );
}
