'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

/* ── 디자인 토큰 ── */
const C = {
  bg:     '#FBFBFB',
  text:   '#2D2D2D',
  mid:    '#6B6B6B',
  light:  '#ABABAB',
  sage:   '#A3B18A',
  sageDk: '#7A9E6A',
  purple: '#B8A8D4',
  gold:   '#D4AF37',
  goldLt: '#E8C86E',
}

const FONT = "'Pretendard', -apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif"

/* ── 로고 SVG ── */
function CareFlowLogo({ width = 260 }: { width?: number }) {
  const h = width * 0.52
  return (
    <svg width={width} height={h} viewBox="0 0 500 260" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lgWave" x1="0" y1="0" x2="500" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#6BAE96"/>
          <stop offset="30%"  stopColor="#A3B18A"/>
          <stop offset="55%"  stopColor="#C4B488"/>
          <stop offset="75%"  stopColor="#B8A8D4"/>
          <stop offset="100%" stopColor="#D4C896"/>
        </linearGradient>
        <linearGradient id="lgWave2" x1="0" y1="0" x2="500" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#B8A8D4" stopOpacity="0"/>
          <stop offset="30%"  stopColor="#B8A8D4" stopOpacity="0.6"/>
          <stop offset="70%"  stopColor="#C8B8D8"/>
          <stop offset="100%" stopColor="#D4C896"/>
        </linearGradient>
        <linearGradient id="lgWave3" x1="0" y1="0" x2="500" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#D4C896" stopOpacity="0"/>
          <stop offset="40%"  stopColor="#D4C896" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#E8D8A0"/>
        </linearGradient>
      </defs>
      <path
        d="M18,105 L48,105 L60,38 L72,168 L80,58 L90,138 L98,78 L106,122 L116,95 L132,98
           C160,98 180,72 210,58 C240,44 268,82 290,50 C318,10 360,18 410,22 C440,24 470,14 490,8"
        stroke="url(#lgWave)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M200,118 C228,108 260,96 290,66 C318,32 358,38 408,42 C440,44 470,34 490,28"
        stroke="url(#lgWave2)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M230,80 C260,64 295,46 330,32 C365,18 420,10 490,6"
        stroke="url(#lgWave3)"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

/* ── 스플래시 스크린 ── */
function SplashScreen({ onNavigate }: { onNavigate: () => void }) {
  const [phase, setPhase] = useState<0|1|2>(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1400)
    const t2 = setTimeout(() => setPhase(2), 2200)
    const t3 = setTimeout(() => onNavigate(), 3100)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onNavigate])

  const waveAnim = phase === 1
    ? { x: [0, -5, 5, -4, 4, -2, 2, 0], scaleY: [1, 1.06, 0.94, 1.04, 0.96, 1.01, 0.99, 1] }
    : phase === 2
    ? { x: [0, -2, 2, -1, 0], scaleY: [1, 1.02, 0.99, 1.01, 1] }
    : {}

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: C.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 0,
        fontFamily: FONT,
      }}
    >
      <motion.div
        animate={waveAnim}
        transition={{
          duration: phase === 1 ? 0.9 : 0.6,
          ease: 'easeInOut',
          times: phase === 1 ? [0,.14,.28,.42,.57,.71,.85,1] : [0,.25,.5,.75,1],
        }}
        style={{ marginBottom: 20 }}
      >
        <CareFlowLogo width={300} />
      </motion.div>

      <AnimatePresence>
        {phase === 0 && (
          <motion.h1
            key="logo-text"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45 }}
            style={{
              fontSize: 'clamp(44px, 8vw, 80px)',
              fontWeight: 800,
              letterSpacing: '-3px',
              color: C.text,
              margin: 0,
              lineHeight: 1,
            }}
          >
            CareFlow
          </motion.h1>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 2 && (
          <motion.div
            key="cta"
            initial={{ opacity: 0, scale: 0.85, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#fff',
              padding: '14px 40px',
              borderRadius: 16,
              background: `linear-gradient(135deg, ${C.sage}, ${C.sageDk})`,
              boxShadow: '0 8px 28px rgba(163,177,138,0.4)',
              letterSpacing: '-0.3px',
            }}
          >
            지금 시작하기 →
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ── 데이터 ── */
const stats = [
  { num: '41', unit: '%',  label: '이석증(BPPV) 환자 중\n이명을 동반하는 비율', source: 'Messina et al., 2017 · 2,682명' },
  { num: '2',  unit: '배', label: '이명 환자의 우울 위험\n일반인 대비',           source: 'Meta-analysis · 22개 연구, 2025' },
  { num: '115',unit: '만', label: '한국 어지러움\n연간 진료 환자 수',             source: '건강보험심사평가원, 2022' },
]

const problemSteps = [
  { num: '01', title: '의학의 한계',
    desc: '이명·어지러움은 완치가 없습니다. 약물은 증상을 줄이는 것까지. 그 이후 일상 관리는 의료 시스템이 커버할 수 없는 영역입니다.' },
  { num: '02', title: '일상의 공백',
    desc: '2개월에 한 번 진료. 그 사이 언제, 왜 증상이 심해지는지 환자도 의사도 모릅니다. 기억에 의존해 말하는 짧은 진료 시간이 전부입니다.' },
  { num: '03', title: '기록 부재의 진짜 이유',
    desc: '귀찮아서가 아닙니다. 스트레스가 증상을 악화시킨다는 건 알지만, 어떤 스트레스가 얼마나 영향을 주는지는 모릅니다.',
    highlight: '"해봐야 뭐가 달라져?"' },
]

const dataCards = [
  { num: '2.47×', label: '이명 환자의 이석증 발생 위험\n일반인 대비',      source: '한국 NHIS 데이터 · 58만 명 · Rim et al., 2025', color: C.sage },
  { num: '5.3×',  label: '이명 환자의 자살 사고 위험\n일반인 대비',        source: 'American Journal of Otolaryngology, 2025',   color: '#F5A87C' },
  { num: '53%',   label: '이명 환자에서 보고되는\n수면장애 유병률',        source: 'Journal of Clinical Sleep Medicine, 2024',  color: C.purple },
]

const solutions = [
  { num: '01 / 기록', title: '버튼 하나로 기록 완료',
    desc: '어지러운 순간, 타이핑할 수 없습니다. 증상 발생 시 버튼 하나로 기록이 끝납니다. 나머지는 앱이 채웁니다.',
    tag: '자동 수집 — 시간 · 날씨 · 기압 · 수면', accent: C.sage },
  { num: '02 / 분석', title: '스트레스-증상 패턴 시각화',
    desc: '기록이 쌓이면 어떤 날, 어떤 상황에서 증상이 심해지는지 보입니다. 패턴이 보이면 관리가 시작됩니다.',
    tag: '타임라인 · 상관관계 그래프', accent: C.purple },
  { num: '03 / 활용', title: '진료 시 참고 리포트',
    desc: '2개월간의 패턴을 한 장으로. 기억에 의존하지 않고 데이터로 의사와 이야기할 수 있습니다.',
    tag: '비의료기기 · 자기관리 도구', accent: C.goldLt },
]

const flowSteps = [
  { title: '증상 발생', desc: '이명이 울리거나 어지러움이 시작되는 순간' },
  { title: '원탭 기록', desc: '버튼 하나. 시간·날씨·수면은 자동 수집' },
  { title: '패턴 발견', desc: '스트레스와 증상의 상관관계가 그래프로' },
  { title: '관리 시작', desc: '어떤 날 조심해야 하는지 스스로 알게 됨' },
]

const researchItems = [
  { label: '자율신경계 · 내이',
    quote: '스트레스 호르몬의 지속적 상승은 교감신경계를 통해 이명, 어지러움 등 내이 기능 이상으로 이어질 수 있다',
    source: 'Horner KC · Neuroscience & Biobehavioral Reviews · 2003', color: C.sage },
  { label: '이명 · 어지러움 동반',
    quote: '이석증(BPPV) 환자의 41.2%가 이명을 동반한다 — 두 증상은 함께 관리되어야 한다',
    source: 'Messina et al. · Acta Otorhinolaryngol Ital · 2017 · n=2,682', color: '#F5A87C' },
  { label: '정신건강 연동',
    quote: '이명 환자의 우울 위험 1.92배, 불안 1.63배, 불면 3.07배 — 신체 증상이 정신건강 악순환을 만든다',
    source: 'Meta-analysis · American Journal of Otolaryngology · 2025 · 22개 연구', color: C.purple },
  { label: '한국 데이터',
    quote: '이명 환자의 BPPV 발생 위험 2.47배, BPPV 환자의 이명 발생 위험 2.05배 — 양방향 연관 확인',
    source: 'Rim et al. · 한국 NHIS 데이터 · 2025 · n=580,000', color: C.goldLt },
]

const axes = [
  { color:'#F5A87C', bg:'rgba(245,168,124,0.08)', border:'rgba(245,168,124,0.25)', label:'몸',  sub:'신체 증상 · 에너지',
    items:['이명이 있었나요?','어지러움이 있었나요?','피로감을 느꼈나요?','두통이 있었나요?'] },
  { color:'#EE9FB8', bg:'rgba(238,159,184,0.08)', border:'rgba(238,159,184,0.25)', label:'감정', sub:'불안 · 긴장 · 감정 기복',
    items:['불안감을 느꼈나요?','예민하거나 짜증이 났나요?','두려움이 있었나요?','기분 변화가 심했나요?'] },
  { color:'#B8A8D4', bg:'rgba(184,168,212,0.08)', border:'rgba(184,168,212,0.25)', label:'관계', sub:'연결 · 고립 · 사회 참여',
    items:['사람들과 함께했나요?','고립감을 느꼈나요?','소통이 힘들었나요?'] },
  { color:'#E8C86E', bg:'rgba(232,200,110,0.08)', border:'rgba(232,200,110,0.25)', label:'의미', sub:'방향 · 성취 · 삶의 질',
    items:['성취감을 느꼈나요?','하루가 의미 있었나요?','계획한 일을 했나요?'] },
]

export default function HomePage() {
  const router = useRouter()
  const [showSplash, setShowSplash] = useState(false)

  const handleNavigate = useCallback(() => {
    router.push('/explore')
  }, [router])

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <SplashScreen key="splash" onNavigate={handleNavigate} />
        )}
      </AnimatePresence>

      <div style={{ background: C.bg, minHeight: '100vh', fontFamily: FONT, color: C.text, overflowX: 'hidden' }}>

        {/* ── 헤더 ── */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'rgba(251,251,251,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(163,177,138,0.12)',
        }}>
          <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 32px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: `linear-gradient(135deg, ${C.sage}, ${C.sageDk})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 15 }}>🌿</span>
              </div>
              <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: C.text }}>CareFlow</span>
            </div>
            <nav style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Link href="/explore"      style={{ fontSize: 14, fontWeight: 600, color: C.mid, textDecoration: 'none', padding: '8px 14px', borderRadius: 99 }}>기록</Link>
              <Link href="/notification" style={{ fontSize: 14, fontWeight: 600, color: C.mid, textDecoration: 'none', padding: '8px 14px', borderRadius: 99 }}>알림</Link>
              <Link href="/dashboard"    style={{ fontSize: 14, fontWeight: 600, color: C.mid, textDecoration: 'none', padding: '8px 14px', borderRadius: 99 }}>대시보드</Link>
              <button
                onClick={() => setShowSplash(true)}
                style={{
                  fontSize: 14, fontWeight: 700, color: '#fff',
                  padding: '9px 22px', borderRadius: 99, border: 'none', cursor: 'pointer',
                  background: `linear-gradient(135deg, ${C.sage}, ${C.sageDk})`,
                  boxShadow: '0 4px 14px rgba(163,177,138,0.35)',
                }}
              >체험해 보기</button>
            </nav>
          </div>
        </header>

        {/* ── 히어로 ── */}
        <section style={{ position: 'relative', maxWidth: 1160, margin: '0 auto', padding: '80px 32px 100px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', overflow: 'hidden' }}>
          {/* 흐린 배경 로고 — 텍스트 뒤에 위치 */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -54%)', opacity: 0.07, pointerEvents: 'none', zIndex: 0 }}>
            <CareFlowLogo width={900} />
          </div>

          {/* 텍스트 콘텐츠 */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ marginBottom: 24 }}>
              <CareFlowLogo width={320} />
            </div>

            <h1 style={{ fontSize: 'clamp(52px, 8vw, 96px)', fontWeight: 800, letterSpacing: '-3px', lineHeight: 1, margin: '0 0 24px', color: C.text }}>
              CareFlow
            </h1>

            <p style={{ fontSize: 'clamp(18px, 3vw, 26px)', fontWeight: 500, color: C.mid, lineHeight: 1.6, maxWidth: 520, margin: '0 0 12px' }}>
              진료실 밖 당신의 일상을 연결합니다.
            </p>
            <p style={{ fontSize: 'clamp(14px, 2vw, 17px)', color: C.light, lineHeight: 1.8, maxWidth: 540, margin: '0 0 52px' }}>
              어지럼증과 이명, 오늘부터 매일 기록하세요.<br/>
              내 몸·감정·관계·의미, 네 가지 축으로 삶의 패턴을 발견해요.
            </p>

            <button
              onClick={() => setShowSplash(true)}
              style={{
                fontSize: 17, fontWeight: 700, color: '#fff',
                padding: '16px 48px', borderRadius: 16, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, ${C.sage}, ${C.sageDk})`,
                boxShadow: '0 8px 28px rgba(163,177,138,0.40)',
                letterSpacing: '-0.3px',
              }}
            >
              체험해 보기 →
            </button>
          </div>
        </section>

        {/* ── 통계 바 ── */}
        <div style={{ background: C.text, padding: '0' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {stats.map((s, i) => (
              <div key={i} style={{
                padding: '48px 40px',
                borderRight: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none',
              }}>
                <div style={{ fontSize: 'clamp(36px, 5vw, 52px)', fontWeight: 800, color: '#fff', lineHeight: 1, marginBottom: 12, letterSpacing: '-2px' }}>
                  <span style={{ color: C.sage }}>{s.num}</span>{s.unit}
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, whiteSpace: 'pre-line', marginBottom: 10 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em', fontWeight: 500 }}>{s.source}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 문제 섹션 ── */}
        <section style={{ padding: '120px 32px' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto' }}>
            <div style={{ marginBottom: 64 }}>
              <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: C.sage, textTransform: 'uppercase', marginBottom: 20, padding: '5px 14px', borderRadius: 99, background: 'rgba(163,177,138,0.12)' }}>
                Problem
              </div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.25, margin: 0, color: C.text }}>
                완치 없는 병,<br/>그 이후의 공백
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>
              {/* 좌: 단계 */}
              <div>
                {problemSteps.map((step, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 24, padding: '32px 0',
                    borderBottom: '1px solid rgba(163,177,138,0.15)',
                    borderTop: i === 0 ? '1px solid rgba(163,177,138,0.15)' : 'none',
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.light, letterSpacing: '0.06em', paddingTop: 4, minWidth: 32 }}>{step.num}</span>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8, lineHeight: 1.4 }}>{step.title}</div>
                      <div style={{ fontSize: 14, color: C.mid, lineHeight: 1.85 }}>{step.desc}</div>
                      {step.highlight && (
                        <div style={{ display: 'inline-block', marginTop: 12, fontSize: 15, fontWeight: 600, color: C.text, fontStyle: 'italic', padding: '10px 16px', background: 'rgba(163,177,138,0.10)', borderLeft: `3px solid ${C.sage}`, borderRadius: '0 8px 8px 0' }}>
                          {step.highlight}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* 우: 데이터 카드 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 100 }}>
                {dataCards.map((d, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderRadius: 20, padding: '32px 32px',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                    borderLeft: `4px solid ${d.color}`,
                  }}>
                    <div style={{ fontSize: 'clamp(32px, 4vw, 42px)', fontWeight: 800, color: d.color, lineHeight: 1, marginBottom: 8, letterSpacing: '-2px' }}>{d.num}</div>
                    <div style={{ fontSize: 14, color: C.text, lineHeight: 1.6, whiteSpace: 'pre-line', marginBottom: 10 }}>{d.label}</div>
                    <div style={{ fontSize: 11, color: C.light, letterSpacing: '0.06em' }}>{d.source}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 솔루션 섹션 ── */}
        <section style={{ background: `linear-gradient(160deg, ${C.sageDk} 0%, ${C.sage} 100%)`, padding: '120px 32px' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto' }}>
            <div style={{ marginBottom: 64 }}>
              <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: 20, padding: '5px 14px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.25)' }}>
                Solution
              </div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.25, margin: 0, color: '#fff' }}>
                기록의 의미를 만드는 것이<br/>핵심입니다
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
              {solutions.map((s, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  padding: '48px 36px',
                  borderRadius: i === 0 ? '20px 0 0 20px' : i === 2 ? '0 20px 20px 0' : 0,
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRight: i < 2 ? 'none' : '1px solid rgba(255,255,255,0.15)',
                  transition: 'background 0.2s',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>{s.num}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 16, lineHeight: 1.35, letterSpacing: '-0.5px' }}>{s.title}</div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.85, marginBottom: 24 }}>{s.desc}</div>
                  <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.3)', padding: '5px 12px', borderRadius: 99 }}>
                    {s.tag}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section style={{ padding: '120px 32px', background: 'rgba(163,177,138,0.05)', borderTop: '1px solid rgba(163,177,138,0.10)' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 80 }}>
              <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: C.sage, textTransform: 'uppercase', marginBottom: 16, padding: '5px 14px', borderRadius: 99, background: 'rgba(163,177,138,0.12)' }}>
                How it works
              </div>
              <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-1px', margin: 0 }}>
                네 단계로 작동합니다
              </h2>
            </div>

            <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
              {/* 연결선 */}
              <div style={{ position: 'absolute', top: 19, left: '12.5%', right: '12.5%', height: 1, background: 'rgba(163,177,138,0.3)', zIndex: 0 }} />

              {flowSteps.map((step, i) => (
                <div key={i} style={{ padding: '0 24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', margin: '0 auto 28px', background: i === 0 ? C.text : `linear-gradient(135deg, ${C.sage}, ${C.sageDk})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(163,177,138,0.3)' }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{i + 1}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 10, lineHeight: 1.4 }}>{step.title}</div>
                  <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.7 }}>{step.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4축 섹션 ── */}
        <section style={{ padding: '100px 32px', background: `linear-gradient(160deg, rgba(184,168,212,0.06) 0%, rgba(163,177,138,0.06) 100%)`, borderTop: '1px solid rgba(184,168,212,0.12)' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, letterSpacing: 1.2, color: C.goldLt, textTransform: 'uppercase', marginBottom: 16, padding: '5px 14px', borderRadius: 99, background: 'rgba(232,200,110,0.15)' }}>
                4축 기록 모델
              </div>
              <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-1px', margin: '0 0 16px' }}>
                4축으로 나를 기록해요
              </h2>
              <p style={{ fontSize: 17, color: C.mid, lineHeight: 1.75, maxWidth: 500, margin: '0 auto' }}>
                증상뿐 아니라 <strong style={{ color: C.text }}>몸·감정·관계·의미</strong> 전체를 함께 들여다봐요
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
              {axes.map((axis, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 24, padding: '32px 28px', border: `1px solid ${axis.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', borderTop: `3px solid ${axis.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: `${axis.color}20`, border: `1px solid ${axis.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: axis.color, opacity: 0.8 }}/>
                    </div>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: '-0.5px' }}>{axis.label}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: axis.color, marginTop: 1 }}>{axis.sub}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {axis.items.map((item, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: C.mid }}>
                        <div style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, background: `${axis.color}20`, border: `1.5px solid ${axis.color}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: axis.color, fontWeight: 800 }}>✓</div>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 학술 근거 ── */}
        <section style={{ padding: '120px 32px', borderTop: '1px solid rgba(163,177,138,0.12)' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: C.purple, textTransform: 'uppercase', marginBottom: 16, padding: '5px 14px', borderRadius: 99, background: 'rgba(184,168,212,0.12)' }}>
                근거
              </div>
              <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-1px', margin: 0 }}>
                학술 근거 위에 설계했습니다
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
              {researchItems.map((r, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  borderRadius: 20, padding: '36px 36px',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                  borderTop: `3px solid ${r.color}`,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: r.color, marginBottom: 16, textTransform: 'uppercase' }}>{r.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 500, color: C.text, lineHeight: 1.7, marginBottom: 16 }}>{r.quote}</div>
                  <div style={{ fontSize: 11, color: C.light, letterSpacing: '0.06em' }}>{r.source}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 왜 CareFlow ── */}
        <section style={{ padding: '120px 32px', background: C.text }}>
          <div style={{ maxWidth: 1160, margin: '0 auto' }}>
            <div style={{ marginBottom: 64 }}>
              <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: C.sage, textTransform: 'uppercase', marginBottom: 20, padding: '5px 14px', borderRadius: 99, border: `1px solid ${C.sage}40` }}>
                Why CareFlow
              </div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.25, margin: 0, color: '#fff' }}>
                이 문제를 해결하고 싶어서<br/>간호학과에 왔습니다
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.9, marginBottom: 20 }}>
                  이명과 어지러움을 만성으로 겪는 가족을 곁에서 지켜보며 문제를 발견했습니다. <strong style={{ color: '#fff' }}>돌봄을 기술로 일상에 끌어올 수 있다는 확신</strong>이 있었고, 실제 환자가 옆에 있었기에 공감이 추상적이지 않았습니다.
                </p>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.9, marginBottom: 20 }}>
                  기록을 권유했을 때 돌아온 답은 <strong style={{ color: '#fff' }}>"해봐야 뭐가 달라져?"</strong>였습니다. 귀찮음이 아니라 불신이었습니다. 이 차이가 CareFlow 설계의 출발점입니다.
                </p>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.9, marginBottom: 0 }}>
                  간호학적 전인 돌봄의 관점 — 신체 증상이 정신건강으로 이어지는 악순환 — 이 자기관리 도구의 설계 원리가 됩니다. <strong style={{ color: '#fff' }}>의료와 일상 사이의 공백을 메우는 것</strong>이 CareFlow의 역할입니다.
                </p>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 24, padding: 48,
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4, letterSpacing: '-0.5px' }}>정유진</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.sage, letterSpacing: '0.12em', marginBottom: 32, textTransform: 'uppercase' }}>CareFlow · Founder</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, marginBottom: 12 }}>서울대학교 간호학과 재학 (학사편입, 2026)</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, marginBottom: 12 }}>뇌인지과학학회 회원</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, marginBottom: 28 }}>서울대 창업지원단 생활비 지원 수혜</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['간호학', '자율신경계', '만성 증상 관리', '디지털 헬스케어'].map((tag, i) => (
                    <span key={i} style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: C.sage, border: `1px solid ${C.sage}50`, padding: '5px 12px', borderRadius: 99 }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 하단 CTA ── */}
        <section style={{ padding: '100px 32px' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <CareFlowLogo width={220} />
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, letterSpacing: '-1.5px', margin: '0 0 16px', lineHeight: 1.2 }}>
              오늘부터 기록을<br/>시작해보세요
            </h2>
            <p style={{ fontSize: 17, color: C.mid, lineHeight: 1.75, margin: '0 0 48px' }}>
              진료실 밖 당신의 일상을 연결합니다.
            </p>
            <button
              onClick={() => setShowSplash(true)}
              style={{
                fontSize: 17, fontWeight: 700, color: '#fff',
                padding: '16px 48px', borderRadius: 16, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, ${C.sage}, ${C.sageDk})`,
                boxShadow: '0 8px 28px rgba(163,177,138,0.40)',
                letterSpacing: '-0.3px',
              }}
            >
              체험해 보기 →
            </button>

            <div style={{ display: 'flex', gap: 40, justifyContent: 'center', marginTop: 64, flexWrap: 'wrap' }}>
              {[
                { num: '4', label: '가지 기록 축',  color: C.sage   },
                { num: '3', label: '회 복약 알림',   color: C.goldLt },
                { num: '7', label: '일 주간 리포트', color: C.purple },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 44, fontWeight: 800, color: s.color, letterSpacing: '-2px', lineHeight: 1 }}>{s.num}</div>
                  <div style={{ fontSize: 13, color: C.light, marginTop: 6, fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 면책 ── */}
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 32px 40px', fontSize: 13, color: C.light, lineHeight: 1.9, textAlign: 'center' }}>
          본 서비스는 의료 기기가 아닙니다. 제공되는 기록과 시각화 데이터는 사용자의 자기 관리 및 진료 시 참고를 돕기 위한 정보일 뿐이며, 어떠한 의학적 진단이나 치료 결정도 대신하지 않습니다.
        </div>

        {/* ── 푸터 ── */}
        <footer style={{ borderTop: '1px solid rgba(163,177,138,0.12)', padding: '28px 32px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: `linear-gradient(135deg, ${C.sage}, ${C.sageDk})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 12 }}>🌿</span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>CareFlow</span>
          </div>
          <span style={{ fontSize: 13, color: C.light }}>© 2026 CareFlow. 진료실 밖 일상을 연결합니다.</span>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link href="/explore"      style={{ fontSize: 13, color: C.light, textDecoration: 'none' }}>기록</Link>
            <Link href="/notification" style={{ fontSize: 13, color: C.light, textDecoration: 'none' }}>알림</Link>
            <Link href="/dashboard"    style={{ fontSize: 13, color: C.light, textDecoration: 'none' }}>대시보드</Link>
          </div>
        </footer>

      </div>
    </>
  )
}
