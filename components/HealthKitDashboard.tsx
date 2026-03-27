// ============================================================================
// 🌼 CareFlow — HealthKit 대시보드 (Apple Watch 건강 데이터 시각화)
// ============================================================================
// Phase 4-C: Apple Watch 건강 데이터를 시각적으로 표현
//
// 📌 표시 항목:
//   - 심박수 추이 (평균, 최대, 안정시)
//   - 수면 시간 및 질
//   - 일일 활동량 (걸음, 운동 시간)
//   - AI 인사이트 (자동 분석 결과)
//
// 📌 수국 버터크림 팔레트:
//   - #FFFBF3 (primary-dark), #FFF8EC (surface)
//   - #28C840 (accent green), #3D2B1F (dark text)
//   - #8B6F57 (warm brown), #EAD9BA (warm beige)
// ============================================================================

'use client';

import { useState, useEffect } from 'react';

// ── 타입 ────────────────────────────────────────────────────────────────

interface HealthKitRecord {
  date: string;
  heartRate: { current: number; resting: number; max: number; min: number; avg: number };
  heartRateVariability: { avg: number; trend: string };
  sleep: { duration: number; deepSleep: number; remSleep: number; awakenings: number; quality: string };
  activity: { steps: number; distance: number; activeEnergy: number; exerciseMinutes: number; level: string };
}

interface DashboardProps {
  className?: string;
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────

export default function HealthKitDashboard({ className = '' }: DashboardProps) {
  const [data, setData] = useState<HealthKitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 14 | 30>(7);

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/sensors/healthkit?days=${selectedPeriod}`);
      if (!res.ok) throw new Error('데이터 조회 실패');
      const result = await res.json();
      setData(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  const latest = data.length > 0 ? data[data.length - 1] : null;

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-12 ${className}`}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#28C840] border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-[#8B6F57]">Apple Watch 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 bg-red-50 rounded-2xl ${className}`}>
        <p className="text-red-600">오류: {error}</p>
        <button
          onClick={fetchData}
          className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#3D2B1F]">
          ⌚ Apple Watch 건강 데이터
        </h1>
        <div className="flex gap-2">
          {([7, 14, 30] as const).map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                selectedPeriod === period
                  ? 'bg-[#28C840] text-white'
                  : 'bg-[#FFF8EC] text-[#8B6F57] hover:bg-[#EAD9BA]'
              }`}
            >
              {period}일
            </button>
          ))}
        </div>
      </div>

      {/* 데이터 없음 */}
      {data.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* 요약 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard
              icon="🫀"
              title="평균 심박"
              value={latest?.heartRate.avg || 0}
              unit="bpm"
              status={getHeartRateStatus(latest?.heartRate.avg || 0)}
            />
            <SummaryCard
              icon="😴"
              title="어제 수면"
              value={latest?.sleep.duration || 0}
              unit="시간"
              decimal
              status={getSleepStatus(latest?.sleep.duration || 0)}
            />
            <SummaryCard
              icon="🚶"
              title="오늘 보행"
              value={latest?.activity.steps || 0}
              unit="걸음"
              format="comma"
              status={getStepsStatus(latest?.activity.steps || 0)}
            />
            <SummaryCard
              icon="💪"
              title="운동 시간"
              value={latest?.activity.exerciseMinutes || 0}
              unit="분"
              status={getExerciseStatus(latest?.activity.exerciseMinutes || 0)}
            />
          </div>

          {/* 심박수 상세 */}
          <DetailCard title="🫀 심박 상세" data={latest}>
            <div className="grid grid-cols-4 gap-3 text-center">
              <MiniStat label="현재" value={latest?.heartRate.current || 0} unit="bpm" />
              <MiniStat label="안정시" value={latest?.heartRate.resting || 0} unit="bpm" />
              <MiniStat label="최저" value={latest?.heartRate.min || 0} unit="bpm" />
              <MiniStat label="최고" value={latest?.heartRate.max || 0} unit="bpm" />
            </div>
            {latest?.heartRateVariability && (
              <div className="mt-3 text-sm text-[#8B6F57]">
                HRV 평균: {latest.heartRateVariability.avg}ms
                ({latest.heartRateVariability.trend === 'improving' ? '↗️ 개선 중' :
                  latest.heartRateVariability.trend === 'declining' ? '↘️ 주의' : '→ 안정'})
              </div>
            )}
          </DetailCard>

          {/* 수면 상세 */}
          <DetailCard title="😴 수면 상세" data={latest}>
            <div className="grid grid-cols-4 gap-3 text-center">
              <MiniStat label="총 수면" value={latest?.sleep.duration || 0} unit="시간" decimal />
              <MiniStat label="깊은 수면" value={latest?.sleep.deepSleep || 0} unit="시간" decimal />
              <MiniStat label="REM" value={latest?.sleep.remSleep || 0} unit="시간" decimal />
              <MiniStat label="깨어남" value={latest?.sleep.awakenings || 0} unit="회" />
            </div>
            <div className="mt-3">
              <SleepQualityBar quality={latest?.sleep.quality || 'fair'} />
            </div>
          </DetailCard>

          {/* 간단 히스토리 (텍스트 기반) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#EAD9BA]">
            <h2 className="text-lg font-semibold text-[#3D2B1F] mb-4">📊 최근 기록</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {data.slice().reverse().map((record, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[#FFF8EC] last:border-0">
                  <span className="text-sm text-[#8B6F57]">{record.date}</span>
                  <div className="flex gap-4 text-sm">
                    <span>🫀 {record.heartRate.avg}bpm</span>
                    <span>😴 {record.sleep.duration.toFixed(1)}h</span>
                    <span>🚶 {record.activity.steps.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI 인사이트 */}
          <InsightPanel data={data} latest={latest} />
        </>
      )}
    </div>
  );
}

// ── 서브 컴포넌트 ──────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="bg-[#FFF8EC] p-8 rounded-2xl text-center">
      <p className="text-4xl mb-4">⌚</p>
      <h2 className="text-xl font-semibold text-[#3D2B1F] mb-2">아직 데이터가 없습니다</h2>
      <p className="text-[#8B6F57] mb-4">
        iOS Shortcuts를 설정하면 Apple Watch 데이터가 자동으로 수집됩니다.
      </p>
      <div className="text-left bg-white p-4 rounded-xl text-sm text-[#3D2B1F] space-y-2">
        <p className="font-semibold">설정 방법:</p>
        <p>1. iPhone에서 Shortcuts 앱 열기</p>
        <p>2. CareFlow HealthKit 숏컷 생성</p>
        <p>3. HealthKit 데이터 → JSON 변환 → POST 전송</p>
        <p>4. 매일 자동 실행 설정</p>
      </div>
    </div>
  );
}

function SummaryCard({ icon, title, value, unit, decimal, format, status }: {
  icon: string;
  title: string;
  value: number;
  unit: string;
  decimal?: boolean;
  format?: 'comma';
  status: 'good' | 'warning' | 'alert';
}) {
  const statusColors = {
    good: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    alert: 'bg-red-50 border-red-200',
  };

  const displayValue = format === 'comma'
    ? value.toLocaleString()
    : decimal
    ? value.toFixed(1)
    : value;

  return (
    <div className={`p-4 rounded-xl border-2 ${statusColors[status]} text-center`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xs text-[#8B6F57] mb-1">{title}</div>
      <div className="text-xl font-bold text-[#3D2B1F]">
        {displayValue}
        <span className="text-xs font-normal ml-1">{unit}</span>
      </div>
    </div>
  );
}

function DetailCard({ title, data, children }: {
  title: string;
  data: any;
  children: React.ReactNode;
}) {
  if (!data) return null;
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#EAD9BA]">
      <h2 className="text-lg font-semibold text-[#3D2B1F] mb-4">{title}</h2>
      {children}
    </div>
  );
}

function MiniStat({ label, value, unit, decimal }: {
  label: string;
  value: number;
  unit: string;
  decimal?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-[#8B6F57]">{label}</div>
      <div className="text-lg font-semibold text-[#3D2B1F]">
        {decimal ? value.toFixed(1) : value}
        <span className="text-xs font-normal ml-0.5">{unit}</span>
      </div>
    </div>
  );
}

function SleepQualityBar({ quality }: { quality: string }) {
  const levels = ['poor', 'fair', 'good', 'excellent'];
  const labels: Record<string, string> = {
    poor: '😫 나쁨',
    fair: '😐 보통',
    good: '😊 좋음',
    excellent: '😴 최고',
  };
  const currentIndex = levels.indexOf(quality);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-[#8B6F57]">수면 질:</span>
      <div className="flex gap-1 flex-1">
        {levels.map((level, i) => (
          <div
            key={level}
            className={`h-2 flex-1 rounded-full transition ${
              i <= currentIndex ? 'bg-[#28C840]' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <span className="text-sm font-medium">{labels[quality] || quality}</span>
    </div>
  );
}

function InsightPanel({ data, latest }: { data: HealthKitRecord[]; latest: HealthKitRecord | null }) {
  if (!latest) return null;

  const insights: string[] = [];

  if (latest.sleep.duration < 6) {
    insights.push(`😴 수면이 ${latest.sleep.duration.toFixed(1)}시간으로 부족합니다. 이명이나 어지럼증 악화와 관련될 수 있어요.`);
  }
  if (latest.heartRate.avg > 85) {
    insights.push('🫀 심박이 평소보다 높습니다. 스트레스나 불안 상태를 확인해보세요.');
  }
  if (latest.activity.steps < 3000) {
    insights.push('🚶 활동량이 적습니다. 어지럼증으로 인한 활동 제약일 수 있어요.');
  }
  if (latest.sleep.awakenings > 3) {
    insights.push(`🌙 밤에 ${latest.sleep.awakenings}번 깼습니다. 이명이 수면을 방해했을 수 있어요.`);
  }
  if (latest.heartRate.resting > 80) {
    insights.push('💓 안정시 심박이 높은 편입니다. 자율신경계 균형을 확인해보세요.');
  }

  if (insights.length === 0) {
    insights.push('모든 건강 지표가 양호합니다! 좋은 상태를 유지하세요.');
  }

  return (
    <div className="bg-gradient-to-br from-[#28C840] to-[#1fa530] p-6 rounded-2xl text-white">
      <h2 className="text-lg font-semibold mb-3">💡 오늘의 CareFlow 인사이트</h2>
      <div className="space-y-2">
        {insights.map((insight, i) => (
          <p key={i} className="text-sm leading-relaxed">{insight}</p>
        ))}
      </div>
    </div>
  );
}

// ── 상태 판정 함수 ──────────────────────────────────────────────────────

function getHeartRateStatus(avg: number): 'good' | 'warning' | 'alert' {
  if (avg > 100 || avg < 50) return 'alert';
  if (avg > 85 || avg < 55) return 'warning';
  return 'good';
}

function getSleepStatus(hours: number): 'good' | 'warning' | 'alert' {
  if (hours < 4) return 'alert';
  if (hours < 6) return 'warning';
  return 'good';
}

function getStepsStatus(steps: number): 'good' | 'warning' | 'alert' {
  if (steps < 2000) return 'alert';
  if (steps < 5000) return 'warning';
  return 'good';
}

function getExerciseStatus(minutes: number): 'good' | 'warning' | 'alert' {
  if (minutes < 5) return 'alert';
  if (minutes < 20) return 'warning';
  return 'good';
}
