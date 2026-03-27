// ============================================================================
// 🌼 CareFlow — 이명 자기보고 양식 (Tinnitus Self-Report Form)
// ============================================================================
// Phase 4-D: 이명 증상 일일 체크인 UI
//
// 📌 입력 항목:
//   - 강도 (1-10 슬라이더)
//   - 지속 시간 (분 단위)
//   - 소리 유형 (태그 선택)
//   - 트리거 (복수 선택)
//   - 수면 영향 여부
//   - 자유 기록
//
// 📌 질병분류: ICD-10: H93.1 | KCD: H93.1
// 📌 수국 버터크림 팔레트 적용
// ============================================================================

'use client';

import { useState } from 'react';
import {
  TinnitusSelfReport,
  TinnitusSound,
  TinnitusTrigger,
  TimeOfDay,
  IntensityScale,
  createEmptyTinnitusReport,
} from '@/lib/selfReportSchema';

// ── Props ───────────────────────────────────────────────────────────────

interface TinnitusSelfReportFormProps {
  onSubmit: (report: TinnitusSelfReport) => void;
  onCancel?: () => void;
  className?: string;
}

// ── 옵션 데이터 ─────────────────────────────────────────────────────────

const SOUND_OPTIONS: { value: TinnitusSound; label: string; emoji: string }[] = [
  { value: '윙윙', label: '윙윙', emoji: '🔊' },
  { value: '삐익', label: '삐익', emoji: '📢' },
  { value: '쌩', label: '쌩', emoji: '💨' },
  { value: '찌릿', label: '찌릿', emoji: '⚡' },
  { value: '매미소리', label: '매미 소리', emoji: '🦗' },
  { value: '맥박소리', label: '맥박 소리', emoji: '💓' },
  { value: '기타', label: '기타', emoji: '✏️' },
];

const TRIGGER_OPTIONS: { value: TinnitusTrigger; label: string }[] = [
  { value: '스트레스', label: '스트레스' },
  { value: '수면부족', label: '수면 부족' },
  { value: '카페인', label: '카페인' },
  { value: '시끄러운환경', label: '시끄러운 환경' },
  { value: '목긴장', label: '목/어깨 긴장' },
  { value: '피로', label: '피로' },
  { value: '약물', label: '약물' },
  { value: '없음', label: '특별한 것 없음' },
  { value: '모르겠음', label: '잘 모르겠음' },
];

const TIME_OPTIONS: { value: TimeOfDay; label: string }[] = [
  { value: 'morning', label: '🌅 오전' },
  { value: 'afternoon', label: '☀️ 오후' },
  { value: 'evening', label: '🌇 저녁' },
  { value: 'night', label: '🌙 밤' },
];

const LATERALITY_OPTIONS = [
  { value: 'left', label: '왼쪽 귀' },
  { value: 'right', label: '오른쪽 귀' },
  { value: 'both', label: '양쪽 다' },
  { value: 'unclear', label: '잘 모르겠어요' },
] as const;

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────

export default function TinnitusSelfReportForm({
  onSubmit,
  onCancel,
  className = '',
}: TinnitusSelfReportFormProps) {
  const [form, setForm] = useState<TinnitusSelfReport>(createEmptyTinnitusReport());
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const updateForm = (partial: Partial<TinnitusSelfReport>) => {
    setForm(prev => ({ ...prev, ...partial }));
  };

  const handleSubmit = () => {
    const final: TinnitusSelfReport = {
      ...form,
      timestamp: new Date().toISOString(),
    };
    onSubmit(final);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return true; // 강도는 기본값이 있으므로 항상 진행 가능
      case 2: return true;
      case 3: return true;
      case 4: return true;
      default: return true;
    }
  };

  return (
    <div className={`bg-gradient-to-br from-[#FFFBF3] to-[#FFF8EC] rounded-2xl shadow-lg overflow-hidden ${className}`}>
      {/* 헤더 */}
      <div className="bg-[#3D2B1F] text-white p-5">
        <h2 className="text-xl font-semibold">📋 이명 증상 기록</h2>
        <p className="text-sm text-[#EAD9BA] mt-1">
          오늘의 증상을 기록하면 패턴을 분석해드릴게요
        </p>
        {/* 진행 바 */}
        <div className="flex gap-1 mt-3">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i < step ? 'bg-[#28C840]' : 'bg-[#8B6F57]'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-[#EAD9BA] mt-1">{step} / {totalSteps}</p>
      </div>

      {/* 본문 */}
      <div className="p-6 space-y-6">
        {/* Step 1: 강도 & 시간 */}
        {step === 1 && (
          <>
            <SectionTitle>오늘 이명의 강도는?</SectionTitle>
            <IntensitySlider
              value={form.intensity}
              onChange={v => updateForm({ intensity: v as IntensityScale })}
            />

            <SectionTitle>언제 가장 심했나요?</SectionTitle>
            <OptionGrid
              options={TIME_OPTIONS}
              selected={form.time}
              onSelect={v => updateForm({ time: v as TimeOfDay })}
            />

            <SectionTitle>얼마나 오래 들렸나요?</SectionTitle>
            <DurationInput
              value={form.duration.minutes}
              onChange={m => updateForm({ duration: { minutes: m } })}
            />
          </>
        )}

        {/* Step 2: 소리 특성 */}
        {step === 2 && (
          <>
            <SectionTitle>어떤 소리인가요?</SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              {SOUND_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => updateForm({ sound: opt.value })}
                  className={`p-3 rounded-xl text-sm font-medium transition border-2 ${
                    form.sound === opt.value
                      ? 'border-[#28C840] bg-green-50 text-[#3D2B1F]'
                      : 'border-[#EAD9BA] bg-white text-[#8B6F57] hover:border-[#28C840]'
                  }`}
                >
                  <span className="text-lg block mb-1">{opt.emoji}</span>
                  {opt.label}
                </button>
              ))}
            </div>
            {form.sound === '기타' && (
              <input
                type="text"
                placeholder="어떤 소리인지 적어주세요..."
                value={form.soundCustom || ''}
                onChange={e => updateForm({ soundCustom: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#EAD9BA] focus:border-[#28C840] outline-none text-[#3D2B1F]"
              />
            )}

            <SectionTitle>어느 쪽 귀에서 들리나요?</SectionTitle>
            <OptionGrid
              options={LATERALITY_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
              selected={form.laterality}
              onSelect={v => updateForm({ laterality: v as any })}
            />
          </>
        )}

        {/* Step 3: 트리거 & 영향 */}
        {step === 3 && (
          <>
            <SectionTitle>오늘 뭔가 특별했나요? (복수 선택)</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {TRIGGER_OPTIONS.map(opt => {
                const isSelected = form.triggers.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      const updated = isSelected
                        ? form.triggers.filter(t => t !== opt.value)
                        : [...form.triggers, opt.value];
                      updateForm({ triggers: updated });
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition border-2 ${
                      isSelected
                        ? 'border-[#28C840] bg-green-50 text-[#3D2B1F]'
                        : 'border-[#EAD9BA] bg-white text-[#8B6F57] hover:border-[#28C840]'
                    }`}
                  >
                    {isSelected ? '✓ ' : ''}{opt.label}
                  </button>
                );
              })}
            </div>

            <SectionTitle>수면에 영향을 줬나요?</SectionTitle>
            <div className="flex gap-3">
              <ToggleButton
                active={form.sleep.affected}
                onClick={() => updateForm({ sleep: { ...form.sleep, affected: true } })}
                label="😴 네, 잠을 방해했어요"
              />
              <ToggleButton
                active={!form.sleep.affected}
                onClick={() => updateForm({ sleep: { affected: false } })}
                label="😊 아니요, 괜찮았어요"
              />
            </div>
            {form.sleep.affected && (
              <div>
                <label className="text-sm text-[#8B6F57] mb-1 block">잃은 수면 시간 (시간)</label>
                <input
                  type="number"
                  min={0}
                  max={12}
                  step={0.5}
                  value={form.sleep.hoursMissed || 0}
                  onChange={e => updateForm({
                    sleep: { ...form.sleep, hoursMissed: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-32 px-4 py-2 rounded-xl border-2 border-[#EAD9BA] focus:border-[#28C840] outline-none text-[#3D2B1F]"
                />
              </div>
            )}
          </>
        )}

        {/* Step 4: 기분 & 메모 */}
        {step === 4 && (
          <>
            <SectionTitle>오늘 전반적인 기분은?</SectionTitle>
            <IntensitySlider
              value={form.mood}
              onChange={v => updateForm({ mood: v as IntensityScale })}
              labels={{ low: '😫 매우 나쁨', high: '😊 매우 좋음' }}
            />

            <SectionTitle>집중력에 영향 줬나요?</SectionTitle>
            <div className="flex gap-3">
              <ToggleButton
                active={form.concentration.affected}
                onClick={() => updateForm({ concentration: { ...form.concentration, affected: true } })}
                label="네"
              />
              <ToggleButton
                active={!form.concentration.affected}
                onClick={() => updateForm({ concentration: { affected: false } })}
                label="아니요"
              />
            </div>

            <SectionTitle>추가로 기록하고 싶은 것</SectionTitle>
            <textarea
              value={form.notes}
              onChange={e => updateForm({ notes: e.target.value })}
              placeholder="예: 밤 11시부터 새벽 3시까지 심했어요..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#EAD9BA] focus:border-[#28C840] outline-none text-[#3D2B1F] resize-none"
            />

            {/* 요약 미리보기 */}
            <div className="bg-white p-4 rounded-xl border border-[#EAD9BA]">
              <p className="text-sm font-semibold text-[#3D2B1F] mb-2">📊 기록 요약</p>
              <div className="text-sm text-[#8B6F57] space-y-1">
                <p>강도: {form.intensity}/10 | 소리: {form.sound} | 시간: {form.duration.minutes}분</p>
                <p>트리거: {form.triggers.length > 0 ? form.triggers.join(', ') : '없음'}</p>
                <p>수면 영향: {form.sleep.affected ? `있음 (${form.sleep.hoursMissed || 0}시간 손실)` : '없음'}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 네비게이션 */}
      <div className="flex gap-3 p-6 pt-0">
        {step > 1 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="flex-1 py-3 rounded-xl border-2 border-[#EAD9BA] text-[#8B6F57] font-semibold hover:bg-[#FFF8EC] transition"
          >
            ← 이전
          </button>
        )}
        {onCancel && step === 1 && (
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border-2 border-[#EAD9BA] text-[#8B6F57] font-semibold hover:bg-[#FFF8EC] transition"
          >
            취소
          </button>
        )}
        {step < totalSteps ? (
          <button
            onClick={() => canProceed() && setStep(s => s + 1)}
            className="flex-1 py-3 rounded-xl bg-[#28C840] text-white font-semibold hover:bg-[#1fa530] transition"
          >
            다음 →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 rounded-xl bg-[#28C840] text-white font-semibold hover:bg-[#1fa530] transition"
          >
            📊 기록 저장
          </button>
        )}
      </div>
    </div>
  );
}

// ── 재사용 서브 컴포넌트 ────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-[#3D2B1F]">{children}</h3>;
}

function IntensitySlider({ value, onChange, labels }: {
  value: number;
  onChange: (v: number) => void;
  labels?: { low: string; high: string };
}) {
  return (
    <div>
      <div className="flex justify-between text-xs text-[#8B6F57] mb-2">
        <span>{labels?.low || '1 (거의 없음)'}</span>
        <span className="text-lg font-bold text-[#3D2B1F]">{value}</span>
        <span>{labels?.high || '10 (극심함)'}</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-[#EAD9BA] rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-6
          [&::-webkit-slider-thumb]:h-6
          [&::-webkit-slider-thumb]:bg-[#28C840]
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:shadow-md"
      />
    </div>
  );
}

function DurationInput({ value, onChange }: { value: number; onChange: (m: number) => void }) {
  const presets = [10, 30, 60, 120, 300];
  const presetLabels = ['10분', '30분', '1시간', '2시간', '5시간+'];

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-2">
        {presets.map((preset, i) => (
          <button
            key={preset}
            onClick={() => onChange(preset)}
            className={`px-3 py-1 rounded-lg text-sm transition border ${
              value === preset
                ? 'border-[#28C840] bg-green-50 text-[#3D2B1F] font-medium'
                : 'border-[#EAD9BA] bg-white text-[#8B6F57]'
            }`}
          >
            {presetLabels[i]}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={1440}
          value={value}
          onChange={e => onChange(parseInt(e.target.value) || 0)}
          className="w-24 px-3 py-2 rounded-xl border-2 border-[#EAD9BA] focus:border-[#28C840] outline-none text-[#3D2B1F]"
        />
        <span className="text-sm text-[#8B6F57]">분</span>
      </div>
    </div>
  );
}

function OptionGrid<T extends string>({ options, selected, onSelect }: {
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition border-2 ${
            selected === opt.value
              ? 'border-[#28C840] bg-green-50 text-[#3D2B1F]'
              : 'border-[#EAD9BA] bg-white text-[#8B6F57] hover:border-[#28C840]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ToggleButton({ active, onClick, label }: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition border-2 ${
        active
          ? 'border-[#28C840] bg-green-50 text-[#3D2B1F]'
          : 'border-[#EAD9BA] bg-white text-[#8B6F57] hover:border-[#28C840]'
      }`}
    >
      {label}
    </button>
  );
}
