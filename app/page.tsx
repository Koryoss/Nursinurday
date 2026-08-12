'use client'

import { useState, useEffect, useCallback, type CSSProperties } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { CARE_COLORS, CARE_FONT, CARE_GRADIENTS, CARE_RADIUS, CARE_SHADOW } from '@/lib/ui/designTokens'

// TODO: 실제 배포되면 TestFlight/APK 다운로드 링크로 교체
const APP_DOWNLOAD_URL = '#app-download-link-todo'

function goToAppDownload() {
  window.open(APP_DOWNLOAD_URL, '_blank', 'noopener,noreferrer')
}

/* ── 디자인 토큰 ── */
const C = {
  bg: CARE_COLORS.surface,
  text: CARE_COLORS.text,
  mid: CARE_COLORS.mid,
  light: CARE_COLORS.light,
  sage: CARE_COLORS.primary,
  sageDk: CARE_COLORS.primaryDark,
  purple: CARE_COLORS.lilac,
  gold: CARE_COLORS.accent,
  goldLt: CARE_COLORS.accent,
}

const FONT = CARE_FONT

function BrandImage({
  width,
  height,
  priority = false,
  style,
}: {
  width: number
  height: number
  priority?: boolean
  style?: CSSProperties
}) {
  return (
    <img
      src="/careflow-brand.png"
      alt="CareFlow"
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      style={{ display: 'block', width, height, objectFit: 'contain', ...style }}
    />
  )
}

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

/* ── 스플래시 스크린 (아이폰 프레임 안) ── */
function SplashScreen({ onNavigate }: { onNavigate: () => void }) {
  const [phase, setPhase] = useState<0|1|2>(0)
  // 0: 파동 그리기
  // 1: CareFlow 텍스트 등장
  // 2: 지금 시작하기 버튼

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1900)
    const t2 = setTimeout(() => setPhase(2), 2700)
    const t3 = setTimeout(() => onNavigate(), 3800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onNavigate])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: CARE_GRADIENTS.app,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px 16px',
        fontFamily: FONT,
      }}
    >
      {/* 아이폰 프레임 */}
      <div style={{
        width: 390, height: 844,
        borderRadius: CARE_RADIUS.shell,
        background: CARE_GRADIENTS.shell,
        border: '1.5px solid rgba(255,255,255,0.9)',
        boxShadow: CARE_SHADOW.shell,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', position: 'relative',
      }}>
        {/* Dynamic Island */}
        <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', width: 120, height: 36, background: '#1C1C1E', borderRadius: 18, zIndex: 20 }} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ marginBottom: 10 }}
        >
          <BrandImage width={286} height={234} priority />
        </motion.div>

        {/* 파동 SVG — 오른쪽→왼쪽으로 그려짐 */}
        <svg width={250} height={130} viewBox="0 0 500 260" fill="none">
          <defs>
            <linearGradient id="spWave1" x1="490" y1="0" x2="0" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#6BAE96"/>
              <stop offset="30%"  stopColor="#A3B18A"/>
              <stop offset="55%"  stopColor="#C4B488"/>
              <stop offset="75%"  stopColor="#B8A8D4"/>
              <stop offset="100%" stopColor="#D4C896"/>
            </linearGradient>
            <linearGradient id="spWave2" x1="490" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#B8A8D4"/>
              <stop offset="60%"  stopColor="#C8B8D8"/>
              <stop offset="100%" stopColor="#D4C896" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="spWave3" x1="490" y1="0" x2="230" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#E8D8A0"/>
              <stop offset="100%" stopColor="#D4C896" stopOpacity="0"/>
            </linearGradient>
          </defs>
          {/* 메인 파동 — 오른쪽 끝(M490,8)에서 시작해 왼쪽으로 */}
          <motion.path
            d="M490,8 C470,14 440,24 410,22 C360,18 318,10 290,50 C268,82 240,44 210,58 C180,72 160,98 132,98 L116,95 L106,122 L98,78 L90,138 L80,58 L72,168 L60,38 L48,105 L18,105"
            stroke="url(#spWave1)"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.8, ease: 'easeOut' }}
          />
          {/* 두 번째 선 */}
          <motion.path
            d="M490,28 C470,34 440,44 408,42 C358,38 318,32 290,66 C260,96 228,108 200,118"
            stroke="url(#spWave2)"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.25 }}
          />
          {/* 세 번째 선 */}
          <motion.path
            d="M490,6 C420,10 365,18 330,32 C295,46 260,64 230,80"
            stroke="url(#spWave3)"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.3, ease: 'easeOut', delay: 0.5 }}
          />
        </svg>

        {/* CareFlow 텍스트 — phase 1 등장 */}
        <AnimatePresence>
          {phase >= 1 && (
            <motion.h1
              key="cf-text"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.34, 1.4, 0.64, 1] }}
              style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', color: C.mid, margin: '8px 0 0', lineHeight: 1 }}
            >
              오늘의 흐름을 함께 볼까요?
            </motion.h1>
          )}
        </AnimatePresence>

        {/* 지금 시작하기 — phase 2 등장 */}
        <AnimatePresence>
          {phase >= 2 && (
            <motion.div
              key="cta-btn"
              initial={{ opacity: 0, scale: 0.88, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              style={{
                marginTop: 32,
                fontSize: 17, fontWeight: 700, color: '#fff',
                padding: '14px 40px', borderRadius: 16,
                background: `linear-gradient(135deg, ${C.sage}, ${C.sageDk})`,
                boxShadow: '0 8px 28px rgba(163,177,138,0.4)',
                letterSpacing: '-0.3px',
              }}
            >
              지금 시작하기 →
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

/* ── 데이터 ── */
const stats = [
  { num: '4', unit: '축', label: '몸·감정·관계·의미를\n한 흐름으로 기록' },
  { num: '5', unit: '구간', label: '아침·점심·저녁·취침 전과\n응급 시점을 구분' },
  { num: '7', unit: '일', label: '최근 기록을 기준으로\n평소와의 차이를 관찰' },
]

const problemSteps = [
  { num: '01', title: '기억에 의존하는 기록',
    desc: '증상이 있었던 날의 몸 상태, 감정, 관계와 의미를 나중에 떠올리기는 쉽지 않습니다. 따라서 CareFlow는 그날의 흐름을 짧게 남길 수 있게 돕습니다.' },
  { num: '02', title: '흩어진 생활 맥락',
    desc: '몸 신호만 따로 보거나 감정만 따로 보면 하루의 맥락이 잘 보이지 않을 수 있습니다. 따라서 네 축을 함께 놓고 관찰합니다.' },
  { num: '03', title: '나에게 맞는 기준의 필요',
    desc: 'CareFlow는 절대 정상치를 말하지 않습니다. 따라서 사용자의 최근 기록을 기준으로 평소와 어떻게 달랐는지 함께 봅니다.',
    highlight: '"오늘 기록을 함께 볼까요?"' },
]

const dataCards = [
  { num: '입력', label: '몸 안의 수면 기록까지\n짧은 폼으로 저장', color: C.sage },
  { num: '흐름', label: '내 최근 기록과 비교해\n평소와 다른 날을 확인', color: C.goldLt },
  { num: '의견', label: '사용자의 목소리로\n다음 화면을 다듬기', color: C.purple },
]

const flowSteps = [
  { title: '하루 선택', desc: '오늘의 기록 시점을 고릅니다' },
  { title: '짧게 입력', desc: '몸·감정·관계·의미를 남깁니다' },
  { title: '흐름 확인', desc: '기록 기반 지표와 추세를 봅니다' },
  { title: '함께 보기', desc: '필요한 변화와 질문을 살펴봅니다' },
]

const researchItems = [
  { label: '자율신경계 · 내이',
    quote: '몸 신호와 생활 맥락을 함께 기록하면 다음 대화에서 살펴볼 질문을 정리하기 쉬워집니다',
    source: '기록과 대화 준비', color: C.sage },
  { label: '이명 · 어지러움 동반',
    quote: '함께 나타난 몸 신호를 기록하고, 관찰된 흐름을 사용자의 기준으로 다시 봅니다',
    source: '몸 신호 기록', color: C.goldLt },
  { label: '정신건강 연동',
    quote: '감정과 수면 기록을 함께 놓고 하루의 흐름을 살펴봅니다',
    source: '자기돌봄 참고 자료', color: C.purple },
  { label: '한국 데이터',
    quote: '개인 기준선 대비 band만 사용하고 절대 정상치나 예후 확률은 제공하지 않습니다',
    source: '개인 기록 기준', color: C.goldLt },
]

const axes = [
  { color:'#C58F5B', bg:'rgba(197,143,91,0.10)', border:'rgba(197,143,91,0.28)', label:'몸',  sub:'몸 신호 · 수면 · 에너지',
    items:['이명이 있었나요?','어지러움이 있었나요?','두통이 있었나요?','수면은 어땠나요?'] },
  { color:'#9B8AC6', bg:'rgba(155,138,198,0.10)', border:'rgba(155,138,198,0.28)', label:'감정', sub:'불안 · 긴장 · 감정 기복',
    items:['불안감을 느꼈나요?','예민하거나 짜증이 났나요?','두려움이 있었나요?','기분 변화가 심했나요?'] },
  { color:'#5C7A5E', bg:'rgba(92,122,94,0.10)', border:'rgba(92,122,94,0.28)', label:'관계', sub:'연결 · 고립 · 사회 참여',
    items:['사람들과 함께했나요?','고립감을 느꼈나요?','소통이 힘들었나요?'] },
  { color:'#B7A35A', bg:'rgba(183,163,90,0.10)', border:'rgba(183,163,90,0.28)', label:'의미', sub:'방향 · 성취 · 삶의 질',
    items:['성취감을 느꼈나요?','하루가 의미 있었나요?','계획한 일을 했나요?'] },
]

const appPreviews = [
  { title: '요약', kind: 'home' },
  { title: '추세', kind: 'trend' },
  { title: '기록', kind: 'record' },
  { title: '알림', kind: 'alert' },
]

function MiniGauge({ label, band, color, position = '55%', copy }: { label: string; band: string; color: string; position?: string; copy?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid rgba(92,122,94,0.16)', borderRadius: 16, padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 17, fontWeight: 900, color: C.text }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 900, color: '#fff', background: color, padding: '5px 11px', borderRadius: 99 }}>{band}</span>
      </div>
      <div style={{ position: 'relative', height: 11, margin: '11px 0 7px' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 3, height: 8, borderRadius: 99, background: '#ECF1EC' }} />
        <div style={{ position: 'absolute', left: position, top: -2, width: 4, height: 18, borderRadius: 99, background: C.text, transform: 'translateX(-50%)' }} />
      </div>
      {copy && <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.45, fontWeight: 700 }}>{copy}</div>}
    </div>
  )
}

function PreviewPhone({ kind }: { kind: string }) {
  return (
    <div style={{
      width: '100%', maxWidth: 310, aspectRatio: '390 / 720',
      borderRadius: 34,
      background: CARE_GRADIENTS.shell,
      border: '1.5px solid rgba(255,255,255,0.9)',
      boxShadow: '0 22px 60px rgba(38,49,42,0.12)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ height: 62, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 20px 12px', borderBottom: '1px solid rgba(92,122,94,0.18)', margin: '0 14px', flexShrink: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 18, fontWeight: 900, color: C.sageDk }}>
          <span style={{ width: 9, height: 9, borderRadius: 99, background: C.sage }} />
          CareFlow
        </span>
        <span style={{ fontSize: 15, fontWeight: 800, color: C.light }}>{kind === 'trend' ? '추세' : '9:41'}</span>
      </div>
      <div style={{ flex: 1, minHeight: 0, padding: 16, overflow: 'hidden' }}>
        {kind === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <div style={{ background: '#fff', border: '1px solid rgba(92,122,94,0.16)', borderRadius: 16, padding: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: C.mid, marginBottom: 12 }}>오늘 저장된 기록</div>
              <div style={{ fontSize: 15, color: C.mid, lineHeight: 1.65, fontWeight: 700 }}>아침 · 몸 신호 2개<br/>수면 · 23:00 ~ 07:00</div>
            </div>
            <MiniGauge label="걸음 안정도" band="낮음" color="#7E9AA0" position="28%" copy="개인 최근 기록과의 차이를 함께 볼까요?" />
            <MiniGauge label="활동 범위" band="보통" color={C.sage} position="52%" />
          </div>
        )}
        {kind === 'trend' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#fff', border: '1px solid rgba(92,122,94,0.16)', borderRadius: 16, padding: 15 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: C.mid, marginBottom: 20 }}>활동 범위 추세</div>
              <div style={{ height: 72, display: 'flex', alignItems: 'flex-end', gap: 9, margin: '0 4px 7px' }}>
                {[42, 55, 50, 68].map((height, index) => (
                  <span key={index} style={{ flex: 1, height: `${height}%`, background: '#D6E2D6', borderRadius: '5px 5px 0 0' }} />
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, color: C.light, fontSize: 12, fontWeight: 800, textAlign: 'center' }}>
                <span>1주</span><span>2주</span><span>3주</span><span>4주</span>
              </div>
              <div style={{ color: C.light, fontSize: 12, fontWeight: 700, marginTop: 8 }}>시작 ~ 최근 · 전체 기록 기준</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid rgba(92,122,94,0.16)', borderRadius: 16, padding: 15 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: C.mid, marginBottom: 12 }}>관찰된 연관</div>
              <div style={{ fontSize: 15, color: C.mid, lineHeight: 1.55, fontWeight: 700 }}>걷기 불안과 두통이 <b style={{ color: C.text }}>함께 오르내리는 흐름</b>이 관찰돼요.</div>
              <div style={{ color: C.light, fontSize: 12, fontWeight: 700, marginTop: 10 }}>상관(연관)일 뿐, 원인·진단 아님</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid rgba(92,122,94,0.16)', borderRadius: 16, padding: 15 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: C.mid }}>주1회 체크인</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.light }}>추세용 · 판정 아님</span>
              </div>
              <div style={{ fontSize: 15, color: C.mid, fontWeight: 800 }}>DHI · THI · HADS · VSS-SF</div>
            </div>
            <div style={{ borderLeft: `3px solid ${C.gold}`, background: 'rgba(197,143,91,0.10)', borderRadius: '0 8px 8px 0', padding: '10px 12px', color: '#7A5A36', fontSize: 12, lineHeight: 1.5, fontWeight: 800 }}>
              비의료기기 경계 · 의료진·외부자원 연계를 우선 안내
            </div>
          </div>
        )}
        {kind === 'record' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: '#fff', border: '1px solid rgba(92,122,94,0.16)', borderRadius: 16, padding: 14 }}>
              <div style={{ fontSize: 13, color: C.mid, fontWeight: 800, marginBottom: 8 }}>기록 날짜</div>
              <div style={{ fontSize: 17, color: C.text, fontWeight: 900 }}>2026-06-22</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid rgba(92,122,94,0.16)', borderRadius: 16, padding: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
                {axes.map(axis => (
                  <div key={axis.label} style={{ border: `1px solid ${axis.border}`, background: axis.bg, borderRadius: 12, padding: '10px 4px', textAlign: 'center', fontSize: 15, fontWeight: 900, color: axis.color }}>{axis.label}</div>
                ))}
              </div>
              <div style={{ background: 'rgba(197,143,91,0.12)', borderRadius: 12, padding: 12, textAlign: 'center', color: '#9A5A2F', fontSize: 14, fontWeight: 900 }}>심할수록 10에 가깝게</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                {['어지럼', '이명'].map((item, index) => (
                  <div key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, color: C.text, fontWeight: 800 }}>
                    <span>{item}</span>
                    <span style={{ color: C.sageDk }}>{index + 2}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, padding: '9px 10px', background: 'rgba(197,143,91,0.10)', border: '1px solid rgba(197,143,91,0.20)', fontSize: 13, color: C.text, fontWeight: 800 }}>
                  <span>몸 안의 수면</span>
                  <span style={{ color: C.gold }}>07:00</span>
                </div>
              </div>
            </div>
            <div style={{ background: C.sage, color: '#fff', borderRadius: 14, padding: 14, textAlign: 'center', fontSize: 16, fontWeight: 900 }}>기록 저장</div>
          </div>
        )}
        {kind === 'alert' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.text, alignSelf: 'stretch' }}>알림 시간</div>
            <div style={{ width: 138, height: 138, borderRadius: 69, border: `7px solid ${C.sage}`, background: '#fff', position: 'relative', margin: '6px 0 4px' }}>
              <div style={{ position: 'absolute', left: 64, bottom: 68, width: 5, height: 45, borderRadius: 3, background: C.gold, transform: 'rotate(90deg)', transformOrigin: 'bottom' }} />
              <div style={{ position: 'absolute', left: 64, bottom: 68, width: 5, height: 34, borderRadius: 3, background: C.sageDk, transform: 'rotate(25deg)', transformOrigin: 'bottom' }} />
              <div style={{ position: 'absolute', left: 62, top: 62, width: 12, height: 12, borderRadius: 6, background: C.sageDk }} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: C.text }}>08:00</div>
            {['기상 직후', '아침', '점심', '저녁', '취침 전'].map((item, index) => (
              <div key={item} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid rgba(92,122,94,0.16)', borderRadius: 14, padding: '10px 12px' }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: C.text }}>{item}</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: C.sageDk }}>{['07:00', '08:00', '12:30', '19:00', '22:30'][index]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function HomePage() {
  const [showSplash, setShowSplash] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)

  const handleNavigate = useCallback(() => {
    goToAppDownload()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setPreviewIndex(index => (index + 1) % appPreviews.length)
    }, 2200)
    return () => clearInterval(timer)
  }, [])

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
          <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 32px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <nav style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={() => setShowSplash(true)}
                style={{
                  fontSize: 14, fontWeight: 700, color: '#fff',
                  padding: '9px 22px', borderRadius: 99, border: 'none', cursor: 'pointer',
                  background: `linear-gradient(135deg, ${C.sage}, ${C.sageDk})`,
                  boxShadow: CARE_SHADOW.button,
                }}
              >시작하기</button>
            </nav>
          </div>
        </header>

        {/* ── 히어로 ── */}
        <section style={{ position: 'relative', maxWidth: 1160, margin: '0 auto', padding: '56px 32px 100px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', overflow: 'hidden' }}>
          {/* 흐린 배경 로고 — 텍스트 뒤에 위치 */}
          <div style={{ position: 'absolute', top: '48%', left: '50%', transform: 'translate(-50%, -52%)', opacity: 0.06, pointerEvents: 'none', zIndex: 0 }}>
            <BrandImage width={900} height={738} priority />
          </div>

          {/* 텍스트 콘텐츠 */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ marginBottom: 6 }}>
              <BrandImage width={430} height={352} priority />
            </div>

            <p style={{ fontSize: 'clamp(18px, 3vw, 26px)', fontWeight: 500, color: C.mid, lineHeight: 1.6, maxWidth: 520, margin: '0 0 12px' }}>
              베타 참여자를 모집하고 있어요.
            </p>
            <p style={{ fontSize: 'clamp(14px, 2vw, 17px)', color: C.light, lineHeight: 1.8, maxWidth: 540, margin: '0 0 52px' }}>
              몸·감정·관계·의미 기록을 바탕으로 나의 흐름을 함께 볼까요?<br/>
              CareFlow는 진단이나 치료를 대체하지 않는 비의료기기 자기돌봄 도구입니다.
            </p>

            <button
              onClick={goToAppDownload}
              style={{
                fontSize: 17, fontWeight: 700, color: '#fff',
                padding: '16px 48px', borderRadius: CARE_RADIUS.lg, border: 'none', cursor: 'pointer',
                background: CARE_GRADIENTS.primary,
                boxShadow: CARE_SHADOW.button,
                letterSpacing: '-0.3px',
              }}
            >
              앱 다운로드 →
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
              </div>
            ))}
          </div>
        </div>

        {/* ── 앱 화면 미리보기 ── */}
        <section style={{ padding: '110px 32px', background: 'rgba(92,122,94,0.05)', borderTop: '1px solid rgba(92,122,94,0.10)' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: C.sage, marginBottom: 16, padding: '5px 14px', borderRadius: 99, background: 'rgba(92,122,94,0.12)' }}>
                앱 화면 미리보기
              </div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.25, margin: '0 0 14px', color: C.text }}>
                로그인 전에도 화면 흐름을 볼 수 있어요
              </h2>
              <p style={{ fontSize: 17, color: C.mid, lineHeight: 1.75, maxWidth: 560, margin: '0 auto' }}>
                실제 앱에서 쓰는 홈, 기록, 알림 화면을 공개 페이지에서 먼저 확인해보세요.
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 28, alignItems: 'center', width: '100%', maxWidth: 760 }}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={appPreviews[previewIndex].kind}
                      initial={{ opacity: 0, y: 18, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -18, scale: 0.98 }}
                      transition={{ duration: 0.45 }}
                      style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                    >
                      <PreviewPhone kind={appPreviews[previewIndex].kind} />
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', color: C.sage, marginBottom: 12 }}>화면 흐름 미리보기</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: C.text, letterSpacing: '-0.8px', marginBottom: 12 }}>
                    요약 → 추세 → 기록 → 알림
                  </div>
                  <div style={{ fontSize: 15, lineHeight: 1.8, color: C.mid, marginBottom: 18 }}>
                    영상처럼 자동으로 전환되는 화면 흐름이에요. 참고 와이어프레임의 홈·추세 카드 배치를 로그인 전에 먼저 볼 수 있습니다.
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {appPreviews.map((preview, index) => (
                      <button
                        key={preview.title}
                        type="button"
                        onClick={() => setPreviewIndex(index)}
                        style={{
                          border: `1px solid ${previewIndex === index ? C.sage : 'rgba(92,122,94,0.18)'}`,
                          borderRadius: 999,
                          padding: '9px 13px',
                          background: previewIndex === index ? 'rgba(92,122,94,0.12)' : '#fff',
                          color: previewIndex === index ? C.sageDk : C.mid,
                          fontSize: 13,
                          fontWeight: 900,
                          cursor: 'pointer',
                        }}
                      >
                        {preview.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 문제 섹션 ── */}
        <section style={{ padding: '120px 32px' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto' }}>
            <div style={{ marginBottom: 64 }}>
              <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: C.sage, textTransform: 'uppercase', marginBottom: 20, padding: '5px 14px', borderRadius: 99, background: 'rgba(163,177,138,0.12)' }}>
                기록의 어려움
              </div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.25, margin: 0, color: C.text }}>
                기록하기 어려운 하루,<br/>그 사이의 공백
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
                사용 흐름
              </div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.25, margin: 0, color: '#fff' }}>
                네 단계로 작동합니다
              </h2>
            </div>

            <div className="flow-arrow-wrap">
              {flowSteps.map((step, i) => (
                <div key={i} className="flow-step-item">
                  <div className="flow-step-card">
                    <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.58)', marginBottom: 18 }}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div style={{ fontSize: 23, fontWeight: 850, color: '#fff', marginBottom: 14, lineHeight: 1.35, letterSpacing: '-0.6px' }}>{step.title}</div>
                    <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.74)', lineHeight: 1.7 }}>{step.desc}</div>
                  </div>
                  {i < flowSteps.length - 1 && (
                    <div className="flow-arrow" aria-hidden="true">
                      <span />
                    </div>
                  )}
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
                4축 자기돌봄
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

        {/* ── 왜 CareFlow ── */}
        <section style={{ padding: '120px 32px', background: C.text }}>
          <div style={{ maxWidth: 1160, margin: '0 auto' }}>
            <div style={{ marginBottom: 64 }}>
              <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: C.sage, textTransform: 'uppercase', marginBottom: 20, padding: '5px 14px', borderRadius: 99, border: `1px solid ${C.sage}40` }}>
                만든 이유
              </div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.25, margin: 0, color: '#fff' }}>
                이 문제를 해결하고 싶어서<br/>간호학과에 왔습니다
              </h2>
            </div>

            <div style={{ maxWidth: 760 }}>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.9, marginBottom: 20 }}>
                이명과 어지러움을 만성으로 겪는 실제 환자를 곁에서 지켜보며 문제를 발견했습니다. <strong style={{ color: '#fff' }}>돌봄을 기술로 일상에 끌어올 수 있다는 확신</strong>이 있었고, 실제 사용자의 하루를 보았기에 공감이 추상적이지 않았습니다.
              </p>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.9, marginBottom: 20 }}>
                기록을 권유했을 때 돌아온 답은 <strong style={{ color: '#fff' }}>"해봐야 뭐가 달라져?"</strong>였습니다. 귀찮음이 아니라 불신이었습니다. 이 차이가 CareFlow 설계의 출발점입니다.
              </p>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.9, marginBottom: 0 }}>
                간호학적 전인 돌봄의 관점 — 신체 증상이 정신건강으로 이어지는 악순환 — 이 자기돌봄 도구의 설계 원리가 됩니다. <strong style={{ color: '#fff' }}>의료와 일상 사이의 공백을 메우는 것</strong>이 CareFlow의 역할입니다.
              </p>
            </div>
          </div>
        </section>

        {/* ── 면책 ── */}
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 32px 40px', fontSize: 13, color: C.light, lineHeight: 1.9, textAlign: 'center' }}>
          본 서비스는 의료 기기가 아닙니다. 제공되는 기록과 시각화 데이터는 자기돌봄과 대화 준비를 돕는 참고 자료이며, 진단이나 치료를 대체하지 않습니다.
        </div>

        {/* ── 푸터 ── */}
        <footer style={{ borderTop: '1px solid rgba(163,177,138,0.12)', padding: '28px 32px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ width: 132, height: 54, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
            <BrandImage width={132} height={108} style={{ marginTop: -20 }} />
          </div>
          <span style={{ fontSize: 13, color: C.light }}>© 2026 CareFlow. 진료실 밖 일상을 연결합니다.</span>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link href="/privacy"      style={{ fontSize: 13, color: C.light, textDecoration: 'none' }}>개인정보</Link>
            <Link href="/terms"        style={{ fontSize: 13, color: C.light, textDecoration: 'none' }}>약관</Link>
          </div>
        </footer>

      </div>
      <style jsx>{`
        .flow-arrow-wrap {
          display: flex;
          align-items: stretch;
          gap: 0;
        }

        .flow-step-item {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 0;
        }

        .flow-step-card {
          min-height: 250px;
          width: 100%;
          padding: 38px 30px;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.10);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .flow-arrow {
          width: 48px;
          min-width: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .flow-arrow::before {
          content: '';
          position: absolute;
          left: 4px;
          right: 4px;
          height: 2px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.38);
        }

        .flow-arrow span {
          width: 14px;
          height: 14px;
          border-top: 2px solid rgba(255, 255, 255, 0.72);
          border-right: 2px solid rgba(255, 255, 255, 0.72);
          transform: rotate(45deg);
          background: transparent;
        }

        @media (max-width: 860px) {
          .flow-arrow-wrap {
            flex-direction: column;
          }

          .flow-step-item {
            flex-direction: column;
          }

          .flow-step-card {
            min-height: 0;
            padding: 30px 26px;
          }

          .flow-arrow {
            width: 100%;
            min-width: 0;
            height: 42px;
          }

          .flow-arrow::before {
            left: 50%;
            right: auto;
            top: 6px;
            bottom: 6px;
            width: 2px;
            height: auto;
            transform: translateX(-50%);
          }

          .flow-arrow span {
            transform: rotate(135deg);
          }
        }
      `}</style>
    </>
  )
}
