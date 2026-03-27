// =====================================================
// 온보딩 페이지 — 수국 버터크림 테마 v2
// Step 0: 친근/엄격 모드 선택 (ConversationMode)
// Step 1-3: CareFlow 소개
// =====================================================
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type ConversationMode = '친근' | '엄격' | null

const INTRO_STEPS = [
  {
    eyebrow: '🌼 오늘, 잠깐',
    title: '나를 들여다보는\n일기장이에요',
    body: '오늘 몸이 어떤 신호를 보냈는지—\n고치려는 게 아니에요\n오늘의 나를 같이 적어 봐요',
    badge: null,
  },
  {
    eyebrow: '단, 이곳은',
    title: '병원이 아니에요',
    body: '진단도 처방도 하지 않아요\n의학적 판단은 꼭 병원을 가세요',
    badge: { text: '의료 진단·처방을 대체하지 않습니다', warn: true },
  },
  {
    eyebrow: '그러니까 이곳은',
    title: '오늘의 나를 위한\n기록 공간이에요',
    body: '말로 설명하기 어려운 어려움이 있을 때\n어디에도 이야기할 곳이 없을 때—\n여기 와서 오늘 있었던 걸 적어 줘요',
    badge: null,
  },
]

const C = {
  bg: '#FFFBF3',
  bgCard: '#FFF8EC',
  border: '#EAD9BA',
  accent: '#28C840',
  accentLight: '#C8F0D0',
  textDark: '#2C1C10',
  textMid: '#7A5A3C',
  textLight: '#B89A6A',
  badgeWarn: '#FFF3CD',
  badgeWarnText: '#7A5500',
}

export default function OnboardingPage() {
  const [mode, setMode] = useState<ConversationMode>(null)
  const [introStep, setIntroStep] = useState(0)
  const [phase, setPhase] = useState<'mode' | 'intro'>('mode')
  const router = useRouter()

  const isLastIntro = introStep === INTRO_STEPS.length - 1
  const current = INTRO_STEPS[introStep]

  const handleModeSelect = (m: '친근' | '엄격') => {
    setMode(m)
    setTimeout(() => setPhase('intro'), 350)
  }

  const handleNext = () => {
    if (isLastIntro) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('careflow_mode', mode ?? '엄격')
      }
      router.push('/chat')
    } else {
      setIntroStep(s => s + 1)
    }
  }

  // ── 모드 선택 화면 ──
  if (phase === 'mode') {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
        style={{ background: `linear-gradient(160deg, ${C.bg} 0%, #FFF5E0 100%)` }}
      >
        <span style={{ color: C.accent }} className="font-bold text-xl mb-10 tracking-tight">
          🌼 CareFlow
        </span>

        <h2 className="text-2xl font-bold text-center mb-2" style={{ color: C.textDark }}>
          어떻게 이야기할까요?
        </h2>
        <p className="text-sm text-center mb-10 max-w-xs" style={{ color: C.textMid }}>
          편한 말투를 고르면, 그 방식으로 계속 이야기해요.
        </p>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={() => handleModeSelect('친근')}
            className="rounded-2xl p-5 text-left transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: mode === '친근' ? C.accentLight : C.bgCard,
              border: `2px solid ${mode === '친근' ? C.accent : C.border}`,
            }}
          >
            <div className="font-bold text-base mb-1" style={{ color: C.textDark }}>
              💬 친근 모드
            </div>
            <div className="text-sm" style={{ color: C.textMid }}>
              반말로 편하게 — "오늘 어땠어?", "그랬구나."<br />
              친구한테 이야기하는 느낌이에요.
            </div>
          </button>

          <button
            onClick={() => handleModeSelect('엄격')}
            className="rounded-2xl p-5 text-left transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: mode === '엄격' ? C.accentLight : C.bgCard,
              border: `2px solid ${mode === '엄격' ? C.accent : C.border}`,
            }}
          >
            <div className="font-bold text-base mb-1" style={{ color: C.textDark }}>
              🤝 엄격 모드
            </div>
            <div className="text-sm" style={{ color: C.textMid }}>
              존댓말로 정중하게 — "오늘 어떠셨어요?"<br />
              차분하고 명확한 대화예요.
            </div>
          </button>
        </div>

        <p className="mt-8 text-xs text-center" style={{ color: C.textLight }}>
          모드는 언제든 바꿀 수 있어요
        </p>
      </div>
    )
  }

  // ── 소개 단계 ──
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: `linear-gradient(160deg, ${C.bg} 0%, #FFF5E0 100%)` }}
    >
      <header className="px-6 pt-6 pb-2">
        <span style={{ color: C.accent }} className="font-bold text-lg tracking-tight">
          🌼 CareFlow
        </span>
      </header>

      {/* 진행 점 */}
      <div className="flex justify-center gap-2 pt-4">
        {INTRO_STEPS.map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === introStep ? '24px' : '12px',
              background: i <= introStep ? C.accent : C.border,
            }}
          />
        ))}
      </div>

      <main className="flex-1 flex flex-col justify-center px-8 pb-4 max-w-sm mx-auto w-full">
        <div key={introStep} style={{ animation: 'fadeSlideUp 0.35s ease both' }}>
          <p className="text-sm font-medium mb-2 tracking-wide" style={{ color: C.textLight }}>
            {current.eyebrow}
          </p>

          <h1
            className="text-3xl font-bold leading-snug mb-5 whitespace-pre-line"
            style={{ color: C.textDark }}
          >
            {current.title}
          </h1>

          {current.badge && (
            <div
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-4"
              style={{ background: C.badgeWarn, color: C.badgeWarnText }}
            >
              ⚠️ {current.badge.text}
            </div>
          )}

          <p
            className="text-base leading-relaxed whitespace-pre-line"
            style={{ color: C.textMid }}
          >
            {current.body}
          </p>
        </div>
      </main>

      <div className="px-8 pb-10 max-w-sm mx-auto w-full">
        <button
          onClick={handleNext}
          className="w-full py-4 rounded-2xl font-semibold text-base transition-all duration-200 hover:-translate-y-0.5"
          style={{
            background: C.accent,
            color: C.bg,
            boxShadow: '0 4px 16px rgba(184, 134, 11, 0.25)',
          }}
        >
          {isLastIntro ? '시작하기 →' : '다음 →'}
        </button>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
