// ============================================================================
// 🌼 CareFlow — 어지럼증 센서 API
// ============================================================================
// Phase 4-C: 어지럼증 에피소드 데이터 수신 및 분석
//
// 📌 엔드포인트:
//   POST /api/sensors/dizziness     — 어지럼증 에피소드 데이터 수신
//   GET  /api/sensors/dizziness     — 에피소드 히스토리 조회
//
// 📌 데이터 흐름:
//   Apple Watch 센서 → Swift 앱 → DizzinessDetector 분석
//   → POST /api/sensors/dizziness → CareFlow DB → 자동 NANDA 진단 제안
//
// 📌 질병분류 기준 (ICD-10 | KCD 병행):
//   - 어지럼증: ICD-10: R42 | KCD: R42
//   - 전정기능 장애: ICD-10: H81 | KCD: H81
//   - 메니에르병: ICD-10: H81.0 | KCD: H81.0
//   - 공식 참조: https://www.koicd.kr/
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { DizzinessSession, SensorToCareFlowMapping } from '@/lib/dizzinessMonitor';

// ── 인메모리 저장소 (MVP용) ─────────────────────────────────────────────

const dizzinessStore: DizzinessSession[] = [];

// ── POST: 어지럼증 에피소드 데이터 수신 ─────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session: DizzinessSession = await req.json();

    // 1. 유효성 검사
    if (!session.sessionId || !session.startTime || !session.dataPoints) {
      return NextResponse.json(
        { error: '필수 필드 누락: sessionId, startTime, dataPoints' },
        { status: 400 }
      );
    }

    // 2. 저장
    dizzinessStore.push(session);

    // 최대 100건 유지 (MVP)
    if (dizzinessStore.length > 100) {
      dizzinessStore.shift();
    }

    // 3. CareFlow 도메인 점수 자동 계산
    const bodyScore = session.peakSeverity === 'severe' ? 9
      : session.peakSeverity === 'moderate' ? 6 : 3;

    const emotionScore = session.peakSeverity === 'severe' ? 8
      : session.peakSeverity === 'moderate' ? 5 : 2;

    const careflowUpdate: SensorToCareFlowMapping = {
      primaryDomain: 'BodySignals',
      axisScores: {
        Body: bodyScore,
        Emotion: emotionScore,
        Connection: session.peakSeverity === 'severe' ? 5 : 2,
        Meaning: session.avgConfidence > 80 ? 4 : 1,
      },
      autoSuggestion: {
        diagnosis: '어지럼증(현훈) 균형 불안 (Dizziness/Vertigo Anxiety)',
        confidence: session.avgConfidence / 100,
        icdCode: 'ICD-10: R42 | KCD: R42, ICD-10: H81 | KCD: H81',
        autoDetected: true,
        userConfirmationNeeded: true,
      },
      alerts: [],
    };

    // 심각한 에피소드 시 알림
    if (session.peakSeverity === 'severe') {
      careflowUpdate.alerts.push({
        type: 'dizziness_detected',
        severity: 'urgent',
        message: '⚠️ 강한 어지럼증이 감지되었습니다. 안전한 곳에서 쉬세요. 증상이 지속되면 이비인후과 또는 신경과 진료를 권합니다.',
        timestamp: session.endTime,
      });
    }

    // 4. 패턴 분석 (최근 에피소드와 비교)
    const recentEpisodes = dizzinessStore.slice(-10);
    const frequencyAnalysis = analyzeFrequency(recentEpisodes);

    return NextResponse.json({
      success: true,
      message: '어지럼증 에피소드 기록 완료',
      data: {
        sessionId: session.sessionId,
        severity: session.peakSeverity,
        confidence: session.avgConfidence,
        triggerEstimate: session.triggerEstimate,
        careflowUpdate,
        frequencyAnalysis,
        totalEpisodes: dizzinessStore.length,
      },
    });
  } catch (error) {
    console.error('어지럼증 데이터 처리 오류:', error);
    return NextResponse.json(
      { error: '어지럼증 데이터 처리 실패' },
      { status: 500 }
    );
  }
}

// ── GET: 에피소드 히스토리 조회 ──────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');
    const severity = searchParams.get('severity'); // 'mild' | 'moderate' | 'severe'

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    let filtered = dizzinessStore.filter(
      s => new Date(s.startTime) >= cutoff
    );

    if (severity) {
      filtered = filtered.filter(s => s.peakSeverity === severity);
    }

    // 요약 통계
    const summary = {
      totalEpisodes: filtered.length,
      severityBreakdown: {
        mild: filtered.filter(s => s.peakSeverity === 'mild').length,
        moderate: filtered.filter(s => s.peakSeverity === 'moderate').length,
        severe: filtered.filter(s => s.peakSeverity === 'severe').length,
      },
      avgConfidence: filtered.length > 0
        ? filtered.reduce((sum, s) => sum + s.avgConfidence, 0) / filtered.length
        : 0,
      commonTriggers: getCommonTriggers(filtered),
    };

    return NextResponse.json({
      period: { days },
      summary,
      episodes: filtered.map(s => ({
        sessionId: s.sessionId,
        startTime: s.startTime,
        endTime: s.endTime,
        peakSeverity: s.peakSeverity,
        avgConfidence: s.avgConfidence,
        triggerEstimate: s.triggerEstimate,
        dataPointCount: s.dataPoints.length,
      })),
    });
  } catch (error) {
    console.error('어지럼증 히스토리 조회 오류:', error);
    return NextResponse.json(
      { error: '어지럼증 히스토리 조회 실패' },
      { status: 500 }
    );
  }
}

// ── 유틸리티 ────────────────────────────────────────────────────────────

/** 발생 빈도 분석 */
function analyzeFrequency(episodes: DizzinessSession[]): {
  recentCount: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  avgInterval: number; // 평균 간격 (시간)
} {
  if (episodes.length < 2) {
    return { recentCount: episodes.length, trend: 'stable', avgInterval: 0 };
  }

  // 평균 간격 계산
  const intervals: number[] = [];
  for (let i = 1; i < episodes.length; i++) {
    const diff = new Date(episodes[i].startTime).getTime() -
      new Date(episodes[i - 1].startTime).getTime();
    intervals.push(diff / (1000 * 60 * 60)); // 시간 단위
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

  // 추세: 최근 간격이 줄어들면 increasing
  const recentIntervals = intervals.slice(-3);
  const olderIntervals = intervals.slice(0, -3);

  let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
  if (recentIntervals.length > 0 && olderIntervals.length > 0) {
    const recentAvg = recentIntervals.reduce((a, b) => a + b, 0) / recentIntervals.length;
    const olderAvg = olderIntervals.reduce((a, b) => a + b, 0) / olderIntervals.length;

    if (recentAvg < olderAvg * 0.7) trend = 'increasing';  // 간격 줄어듦 → 빈도 증가
    else if (recentAvg > olderAvg * 1.3) trend = 'decreasing';
  }

  return {
    recentCount: episodes.length,
    trend,
    avgInterval: Math.round(avgInterval * 10) / 10,
  };
}

/** 빈출 트리거 추출 */
function getCommonTriggers(episodes: DizzinessSession[]): { trigger: string; count: number }[] {
  const triggerCounts = new Map<string, number>();

  episodes.forEach(ep => {
    if (ep.triggerEstimate) {
      const current = triggerCounts.get(ep.triggerEstimate) || 0;
      triggerCounts.set(ep.triggerEstimate, current + 1);
    }
  });

  return Array.from(triggerCounts.entries())
    .map(([trigger, count]) => ({ trigger, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}
