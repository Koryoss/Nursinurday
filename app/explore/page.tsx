'use client'

import { useState, useRef, useCallback } from 'react'

/* ── 4축 데이터 ─────────────────────────────── */
const AXES = [
  {
    key: 'body',
    label: '몸',
    sub: '신체 증상 · 에너지',
    color: '#F5A87C',
    textColor: '#7A3A0A',
    bg: 'rgba(245,168,124,0.13)',
    zone: [0, 0, 0.5, 0.5] as [number, number, number, number],
    discoveries: [
      '귀에서 가는 고음이 맴돌았어요',
      '어지러움이 잠깐 찾아왔어요',
      '오늘 피로감이 조금 있었어요',
      '두통이 오후에 살짝 느껴졌어요',
      '몸이 무겁게 느껴진 하루예요',
      '귀울림이 밤에 더 심해졌어요',
      '걸을 때 약간 흔들리는 느낌이 있었어요',
      '소리에 더 예민하게 반응했어요',
    ],
  },
  {
    key: 'emotion',
    label: '감정',
    sub: '불안 · 긴장 · 감정 기복',
    color: '#EE9FB8',
    textColor: '#7A1A40',
    bg: 'rgba(238,159,184,0.13)',
    zone: [0.5, 0, 1, 0.5] as [number, number, number, number],
    discoveries: [
      '이유 없이 불안한 순간이 있었어요',
      '작은 일에 예민하게 반응했어요',
      '기분이 자주 바뀐 하루였어요',
      '긴장감이 쉽게 풀리지 않았어요',
      '두려운 생각이 스쳐 지나갔어요',
      '감정 기복이 조금 있었어요',
      '마음이 차분히 가라앉은 순간도 있었어요',
    ],
  },
  {
    key: 'relation',
    label: '관계',
    sub: '연결 · 고립 · 사회 참여',
    color: '#B8A8D4',
    textColor: '#3D2878',
    bg: 'rgba(184,168,212,0.13)',
    zone: [0, 0.5, 0.5, 1] as [number, number, number, number],
    discoveries: [
      '혼자 있고 싶은 마음이 들었어요',
      '대화가 조금 힘들게 느껴졌어요',
      '사람들 속에서도 외로웠어요',
      '가족과 함께한 시간이 위로가 됐어요',
      '연락을 피하고 싶었어요',
      '소통이 잘 안 되는 것 같아 답답했어요',
    ],
  },
  {
    key: 'meaning',
    label: '의미',
    sub: '방향 · 성취 · 삶의 질',
    color: '#E8C86E',
    textColor: '#6B4A00',
    bg: 'rgba(232,200,110,0.13)',
    zone: [0.5, 0.5, 1, 1] as [number, number, number, number],
    discoveries: [
      '오늘 계획한 일을 해냈어요',
      '작은 성취감을 느낀 순간이 있었어요',
      '하루가 의미 있게 느껴졌어요',
      '무언가를 이루고 싶은 마음이 생겼어요',
      '기록하는 것만으로도 충분해요',
      '내일의 나를 위해 오늘을 남겨요',
    ],
  },
]

/* ── 타입 ─────────────────────────────────── */
interface Discovery {
  id: string
  text: string
  x: number
  y: number
  axis: typeof AXES[0]
  removing: boolean
}

interface Ripple {
  id: string
  x: number
  y: number
  color: string
}

/* ── 헬퍼 ────────────────────────────────── */
function getAxis(rx: number, ry: number) {
  return AXES.find(a => rx >= a.zone[0] && rx < a.zone[2] && ry >= a.zone[1] && ry < a.zone[3]) ?? AXES[0]
}

function pickRandom<T>(arr: T[], excludeLast?: T): T {
  const filtered = arr.filter(i => i !== excludeLast)
  return filtered[Math.floor(Math.random() * filtered.length)]
}

const TODAY = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })

/* ── 메인 컴포넌트 ────────────────────────── */
export default function ExplorePage() {
  const [discoveries, setDiscoveries] = useState<Discovery[]>([])
  const [ripples, setRipples] = useState<Ripple[]>([])
  const [recorded, setRecorded] = useState<{ axis: typeof AXES[0]; text: string }[]>([])
  const [hint, setHint] = useState(true)
  const lastTextRef = useRef<Record<string, string>>({})
  const fieldRef = useRef<HTMLDivElement>(null)
  const cooldownRef = useRef(false)

  const handleTap = useCallback((clientX: number, clientY: number) => {
    if (cooldownRef.current) return
    const rect = fieldRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = clientX - rect.left
    const y = clientY - rect.top
    const rx = x / rect.width
    const ry = y / rect.height
    const axis = getAxis(rx, ry)

    // 400ms 쿨다운
    cooldownRef.current = true
    setTimeout(() => { cooldownRef.current = false }, 400)

    setHint(false)

    // 리플
    const rippleId = Date.now().toString()
    setRipples(r => [...r, { id: rippleId, x, y, color: axis.color }])
    setTimeout(() => setRipples(r => r.filter(p => p.id !== rippleId)), 900)

    // 랜덤 텍스트 (직전 텍스트 제외)
    const text = pickRandom(axis.discoveries, lastTextRef.current[axis.key])
    lastTextRef.current[axis.key] = text

    const id = `${Date.now()}-${Math.random()}`
    const disc: Discovery = { id, text, x, y, axis, removing: false }

    setDiscoveries(prev => [...prev.slice(-4), disc])
    setRecorded(prev => [...prev, { axis, text }])

    // 4초 후 페이드아웃
    setTimeout(() => {
      setDiscoveries(prev => prev.map(d => d.id === id ? { ...d, removing: true } : d))
      setTimeout(() => setDiscoveries(prev => prev.filter(d => d.id !== id)), 700)
    }, 3500)
  }, [])

  const onMouseDown = useCallback((e: React.MouseEvent) => handleTap(e.clientX, e.clientY), [handleTap])
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    handleTap(e.touches[0].clientX, e.touches[0].clientY)
  }, [handleTap])

  const recordedByAxis = AXES.map(a => ({
    axis: a,
    items: recorded.filter(r => r.axis.key === a.key),
  })).filter(g => g.items.length > 0)

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(145deg, #EDE0CC 0%, #E8D8C0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 16px',
      fontFamily: "-apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
    }}>

      {/* ── 아이폰 프레임 ─────────────────── */}
      <div style={{
        width: 390,
        height: 844,
        borderRadius: 54,
        background: '#FFFBF3',
        border: '2px solid #D4C4A0',
        boxShadow: '0 40px 100px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.8)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
      }}>

        {/* Dynamic Island */}
        <div style={{
          position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
          width: 120, height: 36, background: '#1C1C1E', borderRadius: 18, zIndex: 20,
        }} />

        {/* 상태바 */}
        <div style={{ height: 56, flexShrink: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 28px 8px', zIndex: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#3D2B1F' }}>9:41</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {/* 신호 */}
            <svg width="17" height="12" viewBox="0 0 17 12" fill="#3D2B1F">
              <rect x="0" y="4" width="3" height="8" rx="1" opacity="0.4"/><rect x="4.5" y="2.5" width="3" height="9.5" rx="1" opacity="0.6"/>
              <rect x="9" y="1" width="3" height="11" rx="1"/><rect x="13.5" y="0" width="3" height="12" rx="1"/>
            </svg>
            {/* 배터리 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <div style={{ width: 24, height: 12, border: '1.5px solid rgba(61,43,31,0.5)', borderRadius: 3, padding: '2px', display: 'flex', alignItems: 'center' }}>
                <div style={{ height: '100%', width: '75%', background: '#3D2B1F', borderRadius: 1 }} />
              </div>
              <div style={{ width: 2, height: 6, background: 'rgba(61,43,31,0.4)', borderRadius: '0 1px 1px 0' }} />
            </div>
          </div>
        </div>

        {/* 헤더 */}
        <div style={{ padding: '0 22px 14px', flexShrink: 0, borderBottom: '1px solid rgba(61,43,31,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#5BA88A', animation: 'cfPulse 2s infinite' }} />
                <span style={{ fontSize: 20, fontWeight: 800, color: '#3D2B1F' }}>CareFlow</span>
              </div>
              <div style={{ fontSize: 11, color: '#A08866', marginTop: 3 }}>{TODAY} · 화면을 눌러 오늘을 탐색해보세요</div>
            </div>
            {/* 기록된 축 인디케이터 */}
            <div style={{ display: 'flex', gap: 4 }}>
              {AXES.map(a => {
                const done = recorded.some(r => r.axis.key === a.key)
                return (
                  <div key={a.key} style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: done ? a.color : 'rgba(61,43,31,0.1)',
                    transition: 'background 0.4s',
                  }} />
                )
              })}
            </div>
          </div>
        </div>

        {/* 4축 존 레이블 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '8px 20px 0', flexShrink: 0 }}>
          {AXES.map((a, i) => (
            <div key={a.key} style={{ display: 'flex', alignItems: 'center', gap: 5, paddingBottom: 4, justifyContent: i % 2 === 1 ? 'flex-end' : 'flex-start' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: a.color }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: a.textColor, opacity: 0.7 }}>{a.label}</span>
            </div>
          ))}
        </div>

        {/* ── 인터랙티브 필드 ────────────────── */}
        <div
          ref={fieldRef}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          style={{ flex: 1, position: 'relative', margin: '6px 14px', borderRadius: 20, border: '1px solid rgba(61,43,31,0.07)', overflow: 'hidden', cursor: 'crosshair' }}
        >
          {/* 존 배경 그라디언트 */}
          <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', borderRadius: 20, overflow: 'hidden' }}>
            {AXES.map(a => (
              <div key={a.key} style={{ background: a.bg }} />
            ))}
          </div>

          {/* 구분선 */}
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(61,43,31,0.05)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(61,43,31,0.05)', pointerEvents: 'none' }} />

          {/* 떠다니는 오브 */}
          <AmbientOrbs />

          {/* 힌트 */}
          {hint && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🌿</div>
              <div style={{ fontSize: 12, color: 'rgba(61,43,31,0.38)', fontWeight: 500, textAlign: 'center', lineHeight: 1.8 }}>
                화면을 눌러<br />오늘을 탐색해보세요
              </div>
            </div>
          )}

          {/* 리플 */}
          {ripples.map(r => (
            <div key={r.id} style={{
              position: 'absolute', left: r.x, top: r.y,
              transform: 'translate(-50%,-50%)',
              width: 56, height: 56, borderRadius: '50%',
              border: `2px solid ${r.color}`,
              animation: 'cfRipple 0.9s ease-out forwards',
              pointerEvents: 'none',
            }} />
          ))}

          {/* 발견 텍스트 */}
          {discoveries.map(d => <FloatingDisc key={d.id} d={d} />)}
        </div>

        {/* ── 기록 카운트 ───────────────────── */}
        <div style={{
          margin: '6px 14px 0',
          padding: '10px 14px',
          background: recorded.length > 0 ? 'rgba(91,168,138,0.08)' : 'rgba(61,43,31,0.03)',
          borderRadius: 14,
          border: `1px solid ${recorded.length > 0 ? 'rgba(91,168,138,0.2)' : 'rgba(61,43,31,0.07)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0, transition: 'all 0.4s',
          minHeight: 42,
        }}>
          {recorded.length === 0 ? (
            <span style={{ fontSize: 11, color: '#C4B09A' }}>탐색하면 기록이 쌓여요</span>
          ) : (
            <>
              <span style={{ fontSize: 11, color: '#5BA88A', fontWeight: 700 }}>✅ {recorded.length}개 항목 기록됨</span>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {AXES.map(a => {
                  const cnt = recorded.filter(r => r.axis.key === a.key).length
                  if (!cnt) return null
                  return (
                    <span key={a.key} style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: `${a.color}28`, color: a.textColor }}>
                      {a.label} {cnt}
                    </span>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* ── 하단 탭 바 ───────────────────── */}
        <div style={{
          flexShrink: 0,
          marginTop: 8,
          padding: '10px 0 30px',
          borderTop: '1px solid rgba(61,43,31,0.08)',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          background: 'rgba(255,251,243,0.96)',
        }}>
          {[
            { icon: '📋', label: '기록', active: true },
            { icon: '🔔', label: '알림', active: false },
            { icon: '💬', label: '채팅', active: false },
            { icon: '📊', label: '대시보드', active: false },
          ].map(tab => (
            <div key={tab.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, opacity: tab.active ? 1 : 0.4 }}>
              <span style={{ fontSize: 22 }}>{tab.icon}</span>
              <span style={{ fontSize: 10, fontWeight: tab.active ? 700 : 500, color: tab.active ? '#5BA88A' : '#A08866' }}>{tab.label}</span>
              {tab.active && <div style={{ width: 4, height: 4, borderRadius: 2, background: '#5BA88A' }} />}
            </div>
          ))}
        </div>

      </div>

      <style>{`
        @keyframes cfPulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes cfRipple { 0%{opacity:.8;transform:translate(-50%,-50%) scale(0)} 100%{opacity:0;transform:translate(-50%,-50%) scale(2.8)} }
        @keyframes cfFloat { 0%{opacity:0;transform:translateY(8px)} 12%{opacity:1;transform:translateY(0)} 78%{opacity:1;transform:translateY(-28px)} 100%{opacity:0;transform:translateY(-48px)} }
        @keyframes cfFloatOut { 0%{opacity:1;transform:translateY(-28px)} 100%{opacity:0;transform:translateY(-56px)} }
        @keyframes orbA { 0%,100%{transform:translate(0,0)} 50%{transform:translate(14px,-18px)} }
        @keyframes orbB { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-12px,16px)} }
        @keyframes orbC { 0%,100%{transform:translate(0,0)} 50%{transform:translate(10px,20px)} }
        @keyframes orbD { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-16px,-12px)} }
      `}</style>
    </div>
  )
}

/* ── 플로팅 발견 텍스트 ──────────────────── */
function FloatingDisc({ d }: { d: Discovery }) {
  return (
    <div style={{
      position: 'absolute',
      left: d.x, top: d.y,
      transform: 'translateX(-50%)',
      pointerEvents: 'none',
      zIndex: 20,
      animation: d.removing ? 'cfFloatOut 0.7s ease-out forwards' : 'cfFloat 4.2s ease-out forwards',
    }}>
      <div style={{
        background: '#FFFBF3',
        border: `1.5px solid ${d.axis.color}`,
        borderRadius: 14,
        padding: '8px 12px',
        boxShadow: `0 6px 24px rgba(0,0,0,0.1), 0 0 0 4px ${d.axis.color}18`,
        maxWidth: 200,
        whiteSpace: 'normal',
      }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: d.axis.textColor, opacity: 0.65, marginBottom: 3 }}>
          {d.axis.label} · {d.axis.sub}
        </div>
        <div style={{ fontSize: 11.5, color: '#3D2B1F', fontWeight: 600, lineHeight: 1.5 }}>{d.text}</div>
      </div>
      {/* 말풍선 꼬리 */}
      <div style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: `6px solid ${d.axis.color}`, margin: '0 auto' }} />
    </div>
  )
}

/* ── 떠다니는 배경 오브 ──────────────────── */
function AmbientOrbs() {
  const orbs = [
    { style: { top: '18%', left: '20%', width: 80, height: 80 }, color: 'rgba(245,168,124,0.2)', anim: 'orbA 8s ease-in-out infinite' },
    { style: { top: '22%', right: '18%', width: 70, height: 70 }, color: 'rgba(238,159,184,0.2)', anim: 'orbB 10s ease-in-out infinite' },
    { style: { bottom: '24%', left: '18%', width: 75, height: 75 }, color: 'rgba(184,168,212,0.2)', anim: 'orbC 9s ease-in-out infinite' },
    { style: { bottom: '20%', right: '20%', width: 68, height: 68 }, color: 'rgba(232,200,110,0.2)', anim: 'orbD 11s ease-in-out infinite' },
  ]
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 20 }}>
      {orbs.map((o, i) => (
        <div key={i} style={{
          position: 'absolute', borderRadius: '50%',
          background: `radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
          animation: o.anim,
          ...o.style,
        }} />
      ))}
    </div>
  )
}
