// ============================================================================
// 🌼 CareFlow — 통계 분석 엔진 (Statistical Analysis Engine)
// ============================================================================
// Phase 4-D: 이명/비문증 자기보고 데이터의 통계 분석
//
// 📌 분석 기능:
//   1. 주기성 분석 — 요일별, 시간대별 패턴 감지
//   2. 상관관계 분석 — 트리거와 증상 강도의 피어슨 상관계수
//   3. 추세 분석 — 개선/악화/안정 판정 (선형 회귀)
//   4. 인사이트 생성 — 자연어 기반 맞춤 조언
//
// 📌 통계 기법:
//   - 피어슨 상관계수 (Pearson Correlation Coefficient)
//   - 선형 회귀 (Simple Linear Regression)
//   - 이동 평균 (Moving Average)
//   - 표준 편차 (Standard Deviation)
// ============================================================================

import {
  TinnitusSelfReport,
  FloatersSelfReport,
  IntensityScale,
  TimeOfDay,
  TrendDirection,
} from './selfReportSchema';

// ── 분석 결과 타입 ──────────────────────────────────────────────────────

/** 주기성 분석 결과 */
export interface PeriodicPattern {
  key: string;          // 요일 이름 or 시간대
  mean: number;         // 평균 강도
  count: number;        // 데이터 수
  stdDev: number;       // 표준 편차
}

/** 상관관계 분석 결과 */
export interface CorrelationResult {
  factor: string;           // 트리거 이름
  coefficient: number;      // -1.0 ~ 1.0
  sampleSize: number;       // 데이터 수
  strength: 'strong' | 'moderate' | 'weak' | 'none';
  direction: 'positive' | 'negative' | 'none';
}

/** 추세 분석 결과 */
export interface TrendResult {
  trend: TrendDirection;
  strength: number;         // 0-100 (추세 강도)
  slope: number;            // 기울기 (일당 변화량)
  avgBefore: number;        // 전반부 평균
  avgAfter: number;         // 후반부 평균
  confidence: number;       // R² 값 (결정계수)
}

/** AI 인사이트 */
export interface Insight {
  type: 'pattern' | 'trigger' | 'trend' | 'recommendation' | 'warning';
  priority: 'high' | 'medium' | 'low';
  text: string;
  data?: Record<string, unknown>;
}

/** 종합 분석 결과 */
export interface AnalysisReport {
  symptomType: 'tinnitus' | 'floaters';
  period: { from: string; to: string };
  totalReports: number;
  summary: {
    avgIntensity: number;
    maxIntensity: number;
    minIntensity: number;
    stdDev: number;
  };
  weeklyPattern: PeriodicPattern[];
  timePattern: PeriodicPattern[];
  triggerCorrelations: CorrelationResult[];
  trend: TrendResult;
  insights: Insight[];
  generatedAt: string;
}

// ── 메인 분석기 클래스 ──────────────────────────────────────────────────

export class StatisticalAnalyzer {

  // ── 1. 주기성 분석 ──────────────────────────────────────────────────

  /** 요일별 패턴 분석 */
  analyzeWeeklyPattern(reports: TinnitusSelfReport[]): PeriodicPattern[] {
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const grouped = new Map<string, number[]>();

    // 요일별 그룹핑
    days.forEach(day => grouped.set(day, []));
    reports.forEach(report => {
      const dayIndex = new Date(report.date).getDay();
      const dayName = days[dayIndex];
      grouped.get(dayName)?.push(report.intensity);
    });

    // 통계 계산
    return days.map(day => {
      const values = grouped.get(day) || [];
      return {
        key: day,
        mean: values.length > 0 ? this.mean(values) : 0,
        count: values.length,
        stdDev: values.length > 1 ? this.standardDeviation(values) : 0,
      };
    }).filter(p => p.count > 0);
  }

  /** 시간대별 패턴 분석 */
  analyzeTimePattern(reports: TinnitusSelfReport[]): PeriodicPattern[] {
    const times: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night'];
    const timeLabels: Record<TimeOfDay, string> = {
      morning: '오전',
      afternoon: '오후',
      evening: '저녁',
      night: '밤',
    };

    const grouped = new Map<TimeOfDay, number[]>();
    times.forEach(t => grouped.set(t, []));

    reports.forEach(report => {
      grouped.get(report.time)?.push(report.intensity);
    });

    return times.map(time => {
      const values = grouped.get(time) || [];
      return {
        key: timeLabels[time],
        mean: values.length > 0 ? this.mean(values) : 0,
        count: values.length,
        stdDev: values.length > 1 ? this.standardDeviation(values) : 0,
      };
    }).filter(p => p.count > 0);
  }

  // ── 2. 상관관계 분석 ────────────────────────────────────────────────

  /** 트리거별 상관계수 계산 */
  analyzeTriggerCorrelation(reports: TinnitusSelfReport[]): CorrelationResult[] {
    if (reports.length < 5) return [];

    // 모든 트리거 수집
    const allTriggers = new Set<string>();
    reports.forEach(r => r.triggers.forEach(t => allTriggers.add(t)));

    const results: CorrelationResult[] = [];

    allTriggers.forEach(trigger => {
      if (trigger === '없음' || trigger === '모르겠음') return;

      // 이진 변수: 해당 트리거 있음(1) / 없음(0)
      const triggerPresence = reports.map(r =>
        r.triggers.includes(trigger as any) ? 1 : 0
      );
      const intensities = reports.map(r => r.intensity);

      // 트리거가 한 번도 안 나왔거나 항상 나왔으면 계산 불가
      const triggerSum = triggerPresence.reduce((a, b) => a + b, 0);
      if (triggerSum === 0 || triggerSum === reports.length) return;

      const coefficient = this.pearsonCorrelation(triggerPresence, intensities);

      results.push({
        factor: trigger,
        coefficient: Math.round(coefficient * 100) / 100,
        sampleSize: reports.length,
        strength: this.getCorrelationStrength(coefficient),
        direction: coefficient > 0.1 ? 'positive' : coefficient < -0.1 ? 'negative' : 'none',
      });
    });

    // 상관계수 절대값 기준 정렬
    return results.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));
  }

  /** 수면-증상 상관관계 */
  analyzeSleepCorrelation(reports: TinnitusSelfReport[]): CorrelationResult | null {
    if (reports.length < 5) return null;

    const sleepAffected = reports.map(r => r.sleep.affected ? 1 : 0);
    const intensities = reports.map(r => r.intensity);

    const coefficient = this.pearsonCorrelation(sleepAffected, intensities);

    return {
      factor: '수면 영향',
      coefficient: Math.round(coefficient * 100) / 100,
      sampleSize: reports.length,
      strength: this.getCorrelationStrength(coefficient),
      direction: coefficient > 0.1 ? 'positive' : coefficient < -0.1 ? 'negative' : 'none',
    };
  }

  // ── 3. 추세 분석 ────────────────────────────────────────────────────

  /** 선형 회귀 기반 추세 분석 */
  analyzeTrend(reports: TinnitusSelfReport[], days: 7 | 14 | 30 | 90 = 7): TrendResult {
    if (reports.length < 3) {
      return {
        trend: 'stable',
        strength: 0,
        slope: 0,
        avgBefore: 0,
        avgAfter: 0,
        confidence: 0,
      };
    }

    // 날짜순 정렬
    const sorted = [...reports].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // 선형 회귀
    const x = sorted.map((_, i) => i); // 인덱스를 시간 축으로
    const y = sorted.map(r => r.intensity);
    const regression = this.linearRegression(x, y);

    // 전반/후반 비교
    const midpoint = Math.floor(sorted.length / 2);
    const before = sorted.slice(0, midpoint).map(r => r.intensity);
    const after = sorted.slice(midpoint).map(r => r.intensity);

    const avgBefore = this.mean(before);
    const avgAfter = this.mean(after);
    const diff = avgBefore - avgAfter;

    // 추세 판정
    let trend: TrendDirection;
    if (diff > 0.5 && regression.slope < -0.05) {
      trend = 'improving';
    } else if (diff < -0.5 && regression.slope > 0.05) {
      trend = 'worsening';
    } else {
      trend = 'stable';
    }

    const strength = Math.min(100, Math.abs(diff) * 20);

    return {
      trend,
      strength: Math.round(strength),
      slope: Math.round(regression.slope * 1000) / 1000,
      avgBefore: Math.round(avgBefore * 10) / 10,
      avgAfter: Math.round(avgAfter * 10) / 10,
      confidence: Math.round(regression.rSquared * 100) / 100,
    };
  }

  // ── 4. 인사이트 생성 ────────────────────────────────────────────────

  /** 종합 인사이트 생성 */
  generateInsights(
    reports: TinnitusSelfReport[],
    weeklyPattern: PeriodicPattern[],
    correlations: CorrelationResult[],
    trend: TrendResult
  ): Insight[] {
    const insights: Insight[] = [];

    // 주기성 인사이트
    if (weeklyPattern.length > 0) {
      const worst = weeklyPattern.reduce((a, b) => a.mean > b.mean ? a : b);
      const best = weeklyPattern.reduce((a, b) => a.mean < b.mean ? a : b);

      if (worst.mean - best.mean > 1.5) {
        insights.push({
          type: 'pattern',
          priority: 'medium',
          text: `${worst.key}에 증상이 가장 심하고(평균 ${worst.mean.toFixed(1)}), ${best.key}에 가장 약합니다(평균 ${best.mean.toFixed(1)}).`,
          data: { worstDay: worst.key, bestDay: best.key },
        });
      }
    }

    // 트리거 인사이트
    const strongCorrelations = correlations.filter(c => c.strength === 'strong' || c.strength === 'moderate');
    strongCorrelations.forEach(corr => {
      insights.push({
        type: 'trigger',
        priority: corr.strength === 'strong' ? 'high' : 'medium',
        text: `'${corr.factor}'와의 상관계수가 ${corr.coefficient}로 ${corr.strength === 'strong' ? '매우 높습니다' : '높은 편입니다'}. ${corr.direction === 'positive' ? '이 요인이 있을 때 증상이 강해지는 경향' : '이 요인이 있을 때 증상이 약해지는 경향'}이 있습니다.`,
        data: { factor: corr.factor, coefficient: corr.coefficient },
      });
    });

    // 추세 인사이트
    if (trend.trend === 'improving' && trend.strength > 20) {
      insights.push({
        type: 'trend',
        priority: 'low',
        text: `좋은 소식! 최근 증상이 개선되고 있습니다 (평균 ${trend.avgBefore.toFixed(1)} → ${trend.avgAfter.toFixed(1)}).`,
      });
    } else if (trend.trend === 'worsening' && trend.strength > 20) {
      insights.push({
        type: 'trend',
        priority: 'high',
        text: `주의: 최근 증상이 악화되고 있습니다 (평균 ${trend.avgBefore.toFixed(1)} → ${trend.avgAfter.toFixed(1)}). 의료 상담을 고려해보세요.`,
      });
    }

    // 추천 인사이트
    if (strongCorrelations.length > 0) {
      const topTrigger = strongCorrelations[0];
      const recommendations: Record<string, string> = {
        '스트레스': '명상, 심호흡, 산책 등 스트레스 관리가 증상 완화에 도움될 수 있습니다.',
        '수면부족': '충분한 수면(7-8시간)이 증상 완화와 가장 큰 상관관계를 보입니다.',
        '카페인': '카페인 섭취를 줄여보세요. 카페인이 증상을 악화시킬 수 있습니다.',
        '시끄러운환경': '소음이 많은 환경을 피하거나, 소음 차단 이어플러그를 사용해보세요.',
        '목긴장': '목과 어깨 스트레칭이 도움될 수 있습니다. 자세를 자주 바꿔주세요.',
        '피로': '충분한 휴식을 취하세요. 과도한 활동이 증상을 악화시킬 수 있습니다.',
      };

      if (recommendations[topTrigger.factor]) {
        insights.push({
          type: 'recommendation',
          priority: 'high',
          text: recommendations[topTrigger.factor],
        });
      }
    }

    // 데이터 부족 경고
    if (reports.length < 7) {
      insights.push({
        type: 'warning',
        priority: 'low',
        text: `현재 ${reports.length}일의 데이터가 있습니다. 7일 이상 기록하면 더 정확한 패턴 분석이 가능합니다.`,
      });
    }

    return insights;
  }

  // ── 5. 종합 분석 리포트 생성 ────────────────────────────────────────

  /** 이명 종합 분석 */
  generateTinnitusReport(reports: TinnitusSelfReport[]): AnalysisReport {
    const intensities = reports.map(r => r.intensity);
    const weeklyPattern = this.analyzeWeeklyPattern(reports);
    const timePattern = this.analyzeTimePattern(reports);
    const correlations = this.analyzeTriggerCorrelation(reports);
    const trend = this.analyzeTrend(reports);
    const insights = this.generateInsights(reports, weeklyPattern, correlations, trend);

    return {
      symptomType: 'tinnitus',
      period: {
        from: reports.length > 0 ? reports[0].date : '',
        to: reports.length > 0 ? reports[reports.length - 1].date : '',
      },
      totalReports: reports.length,
      summary: {
        avgIntensity: Math.round(this.mean(intensities) * 10) / 10,
        maxIntensity: Math.max(...intensities) as IntensityScale,
        minIntensity: Math.min(...intensities) as IntensityScale,
        stdDev: Math.round(this.standardDeviation(intensities) * 100) / 100,
      },
      weeklyPattern,
      timePattern,
      triggerCorrelations: correlations,
      trend,
      insights,
      generatedAt: new Date().toISOString(),
    };
  }

  /** 비문증 종합 분석 (FloatersSelfReport 용) */
  generateFloatersReport(reports: FloatersSelfReport[]): AnalysisReport {
    // 비문증은 visibility를 강도로 사용
    const adapted = reports.map(r => ({
      ...r,
      intensity: r.visibility,
      triggers: r.triggers as any[],
      sleep: { affected: false },
      concentration: { affected: false },
      mood: 5 as IntensityScale,
      duration: { minutes: 0 },
      frequency: 'sporadic' as const,
      sound: '점' as any,
      laterality: 'both' as const,
    })) as unknown as TinnitusSelfReport[];

    const report = this.generateTinnitusReport(adapted);
    report.symptomType = 'floaters';
    return report;
  }

  // ── Private 수학 함수 ───────────────────────────────────────────────

  /** 평균 */
  private mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /** 표준 편차 */
  private standardDeviation(values: number[]): number {
    if (values.length < 2) return 0;
    const avg = this.mean(values);
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    return Math.sqrt(this.mean(squareDiffs));
  }

  /** 피어슨 상관계수 */
  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n < 3) return 0;

    const meanX = this.mean(x);
    const meanY = this.mean(y);

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

  /** 선형 회귀 */
  private linearRegression(x: number[], y: number[]): { slope: number; intercept: number; rSquared: number } {
    const n = x.length;
    if (n < 2) return { slope: 0, intercept: 0, rSquared: 0 };

    const meanX = this.mean(x);
    const meanY = this.mean(y);

    let ssXY = 0;
    let ssXX = 0;
    let ssYY = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      ssXY += dx * dy;
      ssXX += dx * dx;
      ssYY += dy * dy;
    }

    const slope = ssXX === 0 ? 0 : ssXY / ssXX;
    const intercept = meanY - slope * meanX;
    const rSquared = (ssXX === 0 || ssYY === 0) ? 0 : Math.pow(ssXY, 2) / (ssXX * ssYY);

    return { slope, intercept, rSquared };
  }

  /** 상관관계 강도 판정 */
  private getCorrelationStrength(r: number): 'strong' | 'moderate' | 'weak' | 'none' {
    const abs = Math.abs(r);
    if (abs >= 0.7) return 'strong';
    if (abs >= 0.4) return 'moderate';
    if (abs >= 0.2) return 'weak';
    return 'none';
  }
}

// ── 팩토리 함수 ─────────────────────────────────────────────────────────

/** 기본 분석기 생성 */
export function createAnalyzer(): StatisticalAnalyzer {
  return new StatisticalAnalyzer();
}
