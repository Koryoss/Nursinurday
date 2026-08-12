// ============================================================================
// CareFlow — dizziness observation sensor API
// ============================================================================
// MVP endpoint for Apple Watch/iPhone observation records.
// This route stores self-observation data only. It does not diagnose, score
// medical severity, predict prognosis, or recommend treatment.
//
// TODO(Supabase): replace the in-memory store with a table such as
// careflow_dizziness_observations(
//   id uuid primary key,
//   user_id uuid null,
//   session_id text unique not null,
//   episode_id text null,
//   start_time timestamptz not null,
//   end_time timestamptz not null,
//   peak_severity text not null,
//   avg_confidence numeric not null,
//   is_manual_report boolean not null default false,
//   posture text not null,
//   trigger_estimate text null,
//   data_point_count integer not null default 0,
//   source text not null,
//   raw_payload jsonb not null,
//   created_at timestamptz not null default now()
// ) with RLS scoped to the owning user.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';

type DizzinessObservationSource = 'careflow_watch' | 'apple_watch' | 'iphone' | 'manual_input' | string;
type DizzinessObservationLevel = 'none' | 'mild' | 'moderate' | 'severe' | string;
type DizzinessPosture = 'unknown' | 'lying' | 'sitting' | 'standing' | 'walking' | string;

interface DizzinessObservationPayload {
  episodeId?: string;
  sessionId?: string;
  startTime: string;
  endTime: string;
  peakSeverity: DizzinessObservationLevel;
  avgConfidence: number;
  isManualReport: boolean;
  posture: DizzinessPosture;
  triggerEstimate: string;
  dataPointCount: number;
  source: DizzinessObservationSource;
  dataPoints?: unknown[];
}

interface StoredDizzinessObservation extends DizzinessObservationPayload {
  sessionId: string;
  episodeId: string;
  receivedAt: string;
}

const dizzinessStore: StoredDizzinessObservation[] = [];

export async function POST(req: NextRequest) {
  try {
    const rawPayload = await req.json();
    const normalization = normalizePayload(rawPayload);

    if (!normalization.valid) {
      return NextResponse.json(
        { success: false, message: normalization.message },
        { status: 400 }
      );
    }

    const observation = normalization.observation;
    dizzinessStore.push(observation);

    if (dizzinessStore.length > 100) {
      dizzinessStore.shift();
    }

    return NextResponse.json({
      success: true,
      message: '관찰 기록을 저장했습니다.',
      data: {
        sessionId: observation.sessionId,
        episodeId: observation.episodeId,
        totalEpisodes: dizzinessStore.length,
      },
    });
  } catch (error) {
    console.error('Dizziness observation API error:', error);
    return NextResponse.json(
      { success: false, message: '관찰 기록을 저장하지 못했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
    const level = searchParams.get('severity');

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    let filtered = dizzinessStore.filter(
      observation => new Date(observation.startTime) >= cutoff
    );

    if (level) {
      filtered = filtered.filter(observation => observation.peakSeverity === level);
    }

    return NextResponse.json({
      period: { days },
      count: filtered.length,
      episodes: filtered.map(observation => ({
        sessionId: observation.sessionId,
        episodeId: observation.episodeId,
        startTime: observation.startTime,
        endTime: observation.endTime,
        peakSeverity: observation.peakSeverity,
        avgConfidence: observation.avgConfidence,
        isManualReport: observation.isManualReport,
        posture: observation.posture,
        triggerEstimate: observation.triggerEstimate,
        dataPointCount: observation.dataPointCount,
        source: observation.source,
        receivedAt: observation.receivedAt,
      })),
    });
  } catch (error) {
    console.error('Dizziness observation history API error:', error);
    return NextResponse.json(
      { success: false, message: '관찰 기록을 불러오지 못했습니다.' },
      { status: 500 }
    );
  }
}

function normalizePayload(payload: any):
  | { valid: true; observation: StoredDizzinessObservation }
  | { valid: false; message: string } {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, message: '요청 본문이 올바른 JSON 객체가 아닙니다.' };
  }

  const startTime = asString(payload.startTime);
  const endTime = asString(payload.endTime) || startTime;
  const peakSeverity = asString(payload.peakSeverity) || 'none';
  const posture = asString(payload.posture) || payload.environmentalContext?.posture || 'unknown';
  const source = asString(payload.source) || 'careflow_watch';
  const dataPoints = Array.isArray(payload.dataPoints) ? payload.dataPoints : undefined;
  const dataPointCount = asFiniteNumber(payload.dataPointCount) ?? dataPoints?.length ?? 0;
  const avgConfidence = clamp(asFiniteNumber(payload.avgConfidence) ?? averageConfidence(dataPoints), 0, 100);
  const isManualReport = Boolean(payload.isManualReport);

  if (!startTime || Number.isNaN(Date.parse(startTime))) {
    return { valid: false, message: 'startTime은 ISO 8601 형식의 필수 값입니다.' };
  }

  if (!endTime || Number.isNaN(Date.parse(endTime))) {
    return { valid: false, message: 'endTime은 ISO 8601 형식이어야 합니다.' };
  }

  const episodeId = asString(payload.episodeId) || asString(payload.id) || generateObservationId('episode');
  const sessionId = asString(payload.sessionId) || episodeId;

  return {
    valid: true,
    observation: {
      episodeId,
      sessionId,
      startTime,
      endTime,
      peakSeverity,
      avgConfidence,
      isManualReport,
      posture,
      triggerEstimate: sanitizeObservationText(asString(payload.triggerEstimate) || ''),
      dataPointCount,
      source,
      dataPoints,
      receivedAt: new Date().toISOString(),
    },
  };
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function averageConfidence(dataPoints?: unknown[]): number {
  if (!dataPoints?.length) return 0;

  const values = dataPoints
    .map(point => typeof point === 'object' && point !== null ? asFiniteNumber((point as any).confidence) : undefined)
    .filter((value): value is number => typeof value === 'number');

  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sanitizeObservationText(value: string): string {
  return value
    .replace(/메니에르병|전정기능 장애|질병|진단|ICD-?10|KCD/gi, '몸 신호')
    .replace(/즉각적 의료 평가 필요|진료를 권합니다|치료가 필요합니다/g, '쉬면서 상태를 확인해 주세요')
    .trim();
}

function generateObservationId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
