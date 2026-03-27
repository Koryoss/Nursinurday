// ============================================================================
// 🌼 CareFlow — HealthKit 데이터 수신 API
// ============================================================================
// Phase 4-C: Apple Watch → iOS Shortcuts → CareFlow 연동
//
// 📌 엔드포인트:
//   POST /api/sensors/healthkit     — HealthKit 일일 데이터 수신
//   GET  /api/sensors/healthkit     — 저장된 데이터 히스토리 조회
//
// 📌 데이터 흐름:
//   Apple Watch → HealthKit (iPhone) → iOS Shortcuts (매일 자동)
//   → POST /api/sensors/healthkit → CareFlow DB → 대시보드
//
// 📌 MVP 구현:
//   - Step 1: iOS Shortcuts에서 JSON 전송 (간접 연동)
//   - Step 2: Swift 네이티브 앱에서 직접 전송 (추후)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  HealthKitDailyData,
  SensorToCareFlowMapping,
  SensorAlert,
  healthKitToCareFlow,
} from '@/lib/dizzinessMonitor';

// ── 인메모리 저장소 (MVP용, 추후 DB로 교체) ────────────────────────────

const healthKitStore: HealthKitDailyData[] = [];

// ── POST: HealthKit 데이터 수신 ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const data: HealthKitDailyData = await req.json();

    // 1. 데이터 유효성 검사
    const validation = validateHealthKitData(data);
    if (!validation.valid) {
      return NextResponse.json(
        { error: '데이터 유효성 검사 실패', details: validation.errors },
        { status: 400 }
      );
    }

    // 2. 동기화 시간 추가
    const enrichedData: HealthKitDailyData = {
      ...data,
      syncedAt: new Date().toISOString(),
      source: data.source || 'ios_shortcuts',
    };

    // 3. 저장 (중복 날짜면 덮어쓰기)
    const existingIndex = healthKitStore.findIndex(d => d.date === enrichedData.date);
    if (existingIndex >= 0) {
      healthKitStore[existingIndex] = enrichedData;
    } else {
      healthKitStore.push(enrichedData);
    }

    // 날짜순 정렬
    healthKitStore.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 4. CareFlow 도메인 점수 자동 계산
    const careflowMapping: SensorToCareFlowMapping = healthKitToCareFlow(enrichedData);

    // 5. 응답
    return NextResponse.json({
      success: true,
      message: 'HealthKit 데이터 수신 완료',
      data: {
        date: enrichedData.date,
        syncedAt: enrichedData.syncedAt,
        totalRecords: healthKitStore.length,
        careflowMapping: {
          axisScores: careflowMapping.axisScores,
          suggestion: careflowMapping.autoSuggestion,
          alerts: careflowMapping.alerts,
        },
      },
    });
  } catch (error) {
    console.error('HealthKit 데이터 처리 오류:', error);
    return NextResponse.json(
      { error: 'HealthKit 데이터 처리 실패', details: String(error) },
      { status: 500 }
    );
  }
}

// ── GET: 저장된 HealthKit 데이터 조회 ───────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '7');
    const format = searchParams.get('format') || 'full'; // 'full' | 'summary'

    // 최근 N일 데이터
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    const filtered = healthKitStore.filter(d => d.date >= cutoffStr);

    if (format === 'summary') {
      // 요약 형식
      const summary = filtered.map(d => ({
        date: d.date,
        heartRateAvg: d.heartRate.avg,
        sleepDuration: d.sleep.duration,
        steps: d.activity.steps,
        sleepQuality: d.sleep.quality,
      }));

      return NextResponse.json({
        period: { days, from: cutoffStr, to: new Date().toISOString().split('T')[0] },
        count: summary.length,
        data: summary,
      });
    }

    // 전체 형식
    return NextResponse.json({
      period: { days, from: cutoffStr, to: new Date().toISOString().split('T')[0] },
      count: filtered.length,
      data: filtered,
    });
  } catch (error) {
    console.error('HealthKit 데이터 조회 오류:', error);
    return NextResponse.json(
      { error: 'HealthKit 데이터 조회 실패' },
      { status: 500 }
    );
  }
}

// ── 유효성 검사 ─────────────────────────────────────────────────────────

function validateHealthKitData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    errors.push('날짜(date)가 YYYY-MM-DD 형식이어야 합니다.');
  }

  if (!data.heartRate || typeof data.heartRate.avg !== 'number') {
    errors.push('심박 데이터(heartRate.avg)가 필요합니다.');
  } else {
    if (data.heartRate.avg < 30 || data.heartRate.avg > 220) {
      errors.push('심박수(heartRate.avg)가 비정상 범위입니다 (30-220 bpm).');
    }
  }

  if (!data.sleep || typeof data.sleep.duration !== 'number') {
    errors.push('수면 데이터(sleep.duration)가 필요합니다.');
  } else {
    if (data.sleep.duration < 0 || data.sleep.duration > 24) {
      errors.push('수면 시간(sleep.duration)이 비정상 범위입니다 (0-24시간).');
    }
  }

  if (!data.activity || typeof data.activity.steps !== 'number') {
    errors.push('활동 데이터(activity.steps)가 필요합니다.');
  }

  return { valid: errors.length === 0, errors };
}
