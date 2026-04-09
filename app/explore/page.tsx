'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'

/* ── 4축 체크리스트 (DashboardScreen과 동일) ─── */
const AXES = [
  {
    key: 'body',
    label: '몸',
    sub: '신체 증상 · 에너지',
    color: '#F5A87C',
    textColor: '#7A3A0A',
    bg: 'rgba(245,168,124,0.13)',
    bgDone: 'rgba(245,168,124,0.28)',
    zone: [0, 0, 0.5, 0.5] as [number,number,number,number],
    items: [
      '이명이 있었나요?',
      '어지러움이 있었나요?',
      '피로감을 느꼈나요?',
      '두통이 있었나요?',
    ],
  },
  {
    key: 'emotion',
    label: '감정',
    sub: '불안 · 긴장 · 감정 기복',
    color: '#EE9FB8',
    textColor: '#7A1A40',
    bg: 'rgba(238,159,184,0.13)',
    bgDone: 'rgba(238,159,184,0.28)',
    zone: [0.5, 0, 1, 0.5] as [number,number,number,number],
    items: [
      '불안감을 느꼈나요?',
      '예민하거나 짜증이 났나요?',
      '두려움이 있었나요?',
      '기분 변화가 심했나요?',
    ],
  },
  {
    key: 'relation',
    label: '관계',
    sub: '연결 · 고립 · 사회 참여',
    color: '#B8A8D4',
    textColor: '#3D2878',
    bg: 'rgba(184,168,212,0.13)',
    bgDone: 'rgba(184,168,212,0.28)',
    zone: [0, 0.5, 0.5, 1] as [number,number,number,number],
    items: [
      '사람들과 함께했나요?',
      '고립감을 느꼈나요?',
      '소통이 힘들었나요?',
    ],
  },
  {
    key: 'meaning',
    label: '의미',
    sub: '방향 · 성취 · 삶의 질',
    color: '#E8C86E',
    textColor: '#6B4A00',
    bg: 'rgba(232,200,110,0.13)',
    bgDone: 'rgba(232,200,110,0.28)',
    zone: [0.5, 0.5, 1, 1] as [number,number,number,number],
    items: [
      '성취감을 느꼈나요?',
      '하루가 의미 있었나요?',
      '계획한 일을 했나요?',
    ],
  },
]

const TOTAL = AXES.reduce((s, a) => s + a.items.length, 0) // 14

interface Bubble { id: string; text: string; x: number; y: number; axis: typeof AXES[0]; removing: boolean }
interface Ripple  { id: string; x: number; y: number; color: string }

const TODAY = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })

function getAxis(rx: number, ry: number) {
  return AXES.find(a => rx >= a.zone[0] && rx < a.zone[2] && ry >= a.zone[1] && ry < a.zone[3]) ?? AXES[0]
}

/* ═══════════════════════════════════════════════ */
export default function ExplorePage() {
  // 각 축의 몇 번째 항목까지 발견했는지
  const [progress, setProgress] = useState<Record<string, number>>(
    Object.fromEntries(AXES.map(a => [a.key, 0]))
  )
  const [bubbles, setBubbles]     = useState<Bubble[]>([])
  const [ripples, setRipples]     = useState<Ripple[]>([])
  const [allDone, setAllDone]     = useState(false)
  const [hint, setHint]           = useState(true)
  const fieldRef                  = useRef<HTMLDivElement>(null)
  const cooldown                  = useRef(false)

  const totalFound = Object.values(progress).reduce((s, v) => s + v, 0)

  const handleTap = useCallback((clientX: number, clientY: number) => {
    if (cooldown.current || allDone) return
    const rect = fieldRef.current?.getBoundingClientRect()
    if (!rect) return

    const x  = clientX - rect.left
    const y  = clientY - rect.top
    const rx = x / rect.width
    const ry = y / rect.height
    const axis = getAxis(rx, ry)

    const cur = progress[axis.key]
    if (cur >= axis.items.length) {
      // 이 존은 이미 완료 → 살짝 리플만
      const rid = Date.now().toString()
      setRipples(r => [...r, { id: rid, x, y, color: axis.color }])
      setTimeout(() => setRipples(r => r.filter(p => p.id !== rid)), 900)
      return
    }

    cooldown.current = true
    setTimeout(() => { cooldown.current = false }, 500)

    setHint(false)

    // 리플
    const rid = Date.now().toString()
    setRipples(r => [...r, { id: rid, x, y, color: axis.color }])
    setTimeout(() => setRipples(r => r.filter(p => p.id !== rid)), 900)

    // 다음 항목 발견
    const text = axis.items[cur]
    const newProg = { ...progress, [axis.key]: cur + 1 }
    setProgress(newProg)

    const newTotal = Object.values(newProg).reduce((s, v) => s + v, 0)
    if (newTotal >= TOTAL) setAllDone(true)

    const id = `${Date.now()}-${Math.random()}`
    const bubble: Bubble = { id, text, x, y, axis, removing: false }
    setBubbles(prev => [...prev.slice(-4), bubble])

    setTimeout(() => {
      setBubbles(prev => prev.map(b => b.id === id ? { ...b, removing: true } : b))
      setTimeout(() => setBubbles(prev => prev.filter(b => b.id !== id)), 700)
    }, 3500)
  }, [progress, allDone])

  const onMouse = useCallback((e: React.MouseEvent) => handleTap(e.clientX, e.clientY), [handleTap])
  const onTouch = useCallback((e: React.TouchEvent) => { e.preventDefault(); handleTap(e.touches[0].clientX, e.touches[0].clientY) }, [handleTap])

  return (
    <div style={{ minHeight:'100dvh', background:'linear-gradient(145deg,#EDE0CC,#E8D8C0)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px 16px', fontFamily:"-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif" }}>

      {/* ── 아이폰 프레임 ────────────────────── */}
      <div style={{ width:390, height:844, borderRadius:54, background:'#FFFBF3', border:'2px solid #D4C4A0', boxShadow:'0 40px 100px rgba(0,0,0,0.22),inset 0 1px 0 rgba(255,255,255,0.8)', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column', userSelect:'none' }}>

        {/* Dynamic Island */}
        <div style={{ position:'absolute', top:14, left:'50%', transform:'translateX(-50%)', width:120, height:36, background:'#1C1C1E', borderRadius:18, zIndex:20 }} />

        {/* 상태바 */}
        <div style={{ height:56, flexShrink:0, display:'flex', alignItems:'flex-end', justifyContent:'space-between', padding:'0 28px 8px', zIndex:10 }}>
          <span style={{ fontSize:15, fontWeight:600, color:'#3D2B1F' }}>9:41</span>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            <svg width="17" height="12" viewBox="0 0 17 12" fill="#3D2B1F">
              <rect x="0" y="4" width="3" height="8" rx="1" opacity="0.4"/>
              <rect x="4.5" y="2.5" width="3" height="9.5" rx="1" opacity="0.6"/>
              <rect x="9" y="1" width="3" height="11" rx="1"/>
              <rect x="13.5" y="0" width="3" height="12" rx="1"/>
            </svg>
            <div style={{ display:'flex', alignItems:'center', gap:1 }}>
              <div style={{ width:24, height:12, border:'1.5px solid rgba(61,43,31,0.5)', borderRadius:3, padding:'2px', display:'flex', alignItems:'center' }}>
                <div style={{ height:'100%', width:'75%', background:'#3D2B1F', borderRadius:1 }} />
              </div>
              <div style={{ width:2, height:6, background:'rgba(61,43,31,0.4)', borderRadius:'0 1px 1px 0' }} />
            </div>
          </div>
        </div>

        {/* 헤더 */}
        <div style={{ padding:'0 22px 12px', flexShrink:0, borderBottom:'1px solid rgba(61,43,31,0.08)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:'#5BA88A', animation:'cfPulse 2s infinite' }} />
                <span style={{ fontSize:20, fontWeight:800, color:'#3D2B1F' }}>CareFlow</span>
              </div>
              <div style={{ fontSize:11, color:'#A08866', marginTop:3 }}>
                {TODAY} · {allDone ? '오늘 기록 완료 🎉' : `${totalFound} / ${TOTAL} 항목 발견`}
              </div>
            </div>
            {/* 축별 진행 도트 */}
            <div style={{ display:'flex', gap:5 }}>
              {AXES.map(a => {
                const done = progress[a.key] >= a.items.length
                const started = progress[a.key] > 0
                return (
                  <div key={a.key} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                    <div style={{ width:9, height:9, borderRadius:'50%', background: done ? a.color : started ? `${a.color}80` : 'rgba(61,43,31,0.1)', transition:'all 0.4s', boxShadow: done ? `0 0 6px ${a.color}` : 'none' }} />
                    <span style={{ fontSize:8, color: done ? a.textColor : '#C4B09A', fontWeight:700 }}>{a.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 진행 바 */}
          <div style={{ marginTop:10, height:4, background:'rgba(61,43,31,0.08)', borderRadius:2, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${(totalFound/TOTAL)*100}%`, background:'linear-gradient(90deg,#5BA88A,#7CC4A8)', borderRadius:2, transition:'width 0.5s ease' }} />
          </div>
        </div>

        {/* ── 인터랙티브 필드 ─────────────────── */}
        <div
          ref={fieldRef}
          onMouseDown={onMouse}
          onTouchStart={onTouch}
          style={{ flex:1, position:'relative', margin:'8px 14px 6px', borderRadius:20, border:'1px solid rgba(61,43,31,0.07)', overflow:'hidden', cursor: allDone ? 'default' : 'crosshair' }}
        >
          {/* 4존 배경 (완료 존은 더 진하게) */}
          <div style={{ position:'absolute', inset:0, display:'grid', gridTemplateColumns:'1fr 1fr', gridTemplateRows:'1fr 1fr', borderRadius:20, overflow:'hidden' }}>
            {AXES.map(a => {
              const done = progress[a.key] >= a.items.length
              return <div key={a.key} style={{ background: done ? a.bgDone : a.bg, transition:'background 0.5s' }} />
            })}
          </div>

          {/* 존 구분선 */}
          <div style={{ position:'absolute', top:'50%', left:0, right:0, height:1, background:'rgba(61,43,31,0.06)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', left:'50%', top:0, bottom:0, width:1, background:'rgba(61,43,31,0.06)', pointerEvents:'none' }} />

          {/* 존 레이블 + 완료 뱃지 */}
          {AXES.map((a, i) => {
            const done = progress[a.key] >= a.items.length
            const cnt  = progress[a.key]
            const isRight = i === 1 || i === 3
            const isBottom = i === 2 || i === 3
            return (
              <div key={a.key} style={{
                position:'absolute',
                top: isBottom ? undefined : 10,
                bottom: isBottom ? 10 : undefined,
                left: isRight ? undefined : 10,
                right: isRight ? undefined : undefined,
                ...(isRight ? { right:10 } : {}),
                pointerEvents:'none',
                display:'flex', alignItems:'center', gap:5,
              }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:a.color, boxShadow: done ? `0 0 8px ${a.color}` : 'none' }} />
                <span style={{ fontSize:10, fontWeight:800, color:a.textColor, opacity:0.8 }}>{a.label}</span>
                <span style={{ fontSize:9, color:a.textColor, opacity:0.55 }}>{cnt}/{a.items.length}</span>
                {done && <span style={{ fontSize:10 }}>✓</span>}
              </div>
            )
          })}

          {/* 떠다니는 오브 */}
          <AmbientOrbs />

          {/* 힌트 */}
          {hint && !allDone && (
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
              <div style={{ fontSize:30, marginBottom:10 }}>🌿</div>
              <div style={{ fontSize:12, color:'rgba(61,43,31,0.38)', fontWeight:500, textAlign:'center', lineHeight:1.8 }}>
                각 영역을 눌러<br />오늘의 기록을 채워보세요
              </div>
            </div>
          )}

          {/* 완료 오버레이 */}
          {allDone && (
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(255,251,243,0.85)', backdropFilter:'blur(4px)', pointerEvents:'none' }}>
              <div style={{ fontSize:36, marginBottom:8 }}>🎉</div>
              <div style={{ fontSize:15, fontWeight:800, color:'#3D2B1F', marginBottom:4 }}>오늘 기록 완료!</div>
              <div style={{ fontSize:11, color:'#A08866', textAlign:'center', lineHeight:1.7 }}>
                {TOTAL}개 항목이 모두 기록됐어요.<br />대시보드에서 오늘을 확인해보세요.
              </div>
              <Link href="/history" style={{ marginTop:14, background:'#5BA88A', color:'#fff', fontSize:12, fontWeight:700, padding:'8px 20px', borderRadius:99, textDecoration:'none' }}>
                대시보드 보기 →
              </Link>
            </div>
          )}

          {/* 리플 */}
          {ripples.map(r => (
            <div key={r.id} style={{ position:'absolute', left:r.x, top:r.y, transform:'translate(-50%,-50%)', width:56, height:56, borderRadius:'50%', border:`2px solid ${r.color}`, animation:'cfRipple 0.9s ease-out forwards', pointerEvents:'none' }} />
          ))}

          {/* 떠오르는 말풍선 */}
          {bubbles.map(b => <Bubble key={b.id} b={b} />)}
        </div>

        {/* ── 기록된 항목 리스트 ──────────────── */}
        <div style={{ margin:'0 14px', maxHeight:88, overflowY:'auto', display:'flex', flexDirection:'column', gap:4, flexShrink:0 }}>
          {AXES.map(a => {
            const found = a.items.slice(0, progress[a.key])
            if (!found.length) return null
            return (
              <div key={a.key} style={{ display:'flex', alignItems:'flex-start', gap:7, padding:'6px 10px', background:'#FFF8EC', borderRadius:10, border:'1px solid rgba(61,43,31,0.07)', borderLeft:`3px solid ${a.color}` }}>
                <span style={{ fontSize:10, fontWeight:800, color:a.textColor, minWidth:22, paddingTop:1 }}>{a.label}</span>
                <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                  {found.map((item, i) => (
                    <span key={i} style={{ fontSize:10, color:'#3D2B1F', background:`${a.color}22`, padding:'2px 7px', borderRadius:99, fontWeight:500 }}>
                      ✓ {item}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
          {totalFound === 0 && (
            <div style={{ padding:'8px 10px', fontSize:11, color:'#C4B09A', textAlign:'center' }}>
              영역을 탐색하면 기록이 여기에 쌓여요
            </div>
          )}
        </div>

        {/* ── 하단 탭 바 ──────────────────────── */}
        <div style={{ flexShrink:0, marginTop:8, padding:'10px 0 30px', borderTop:'1px solid rgba(61,43,31,0.08)', display:'grid', gridTemplateColumns:'repeat(4,1fr)', background:'rgba(255,251,243,0.96)' }}>
          {[
            { icon:'📋', label:'기록',     href:'/explore',  active:true  },
            { icon:'🔔', label:'알림',     href:'/preview',  active:false },
            { icon:'💬', label:'채팅',     href:'/chat',     active:false },
            { icon:'📊', label:'대시보드', href:'/history',  active:false },
          ].map(tab => (
            <Link key={tab.label} href={tab.href} style={{ textDecoration:'none', display:'flex', flexDirection:'column', alignItems:'center', gap:3, opacity:tab.active ? 1 : 0.45 }}>
              <span style={{ fontSize:22 }}>{tab.icon}</span>
              <span style={{ fontSize:10, fontWeight:tab.active ? 700 : 500, color:tab.active ? '#5BA88A' : '#A08866' }}>{tab.label}</span>
              {tab.active && <div style={{ width:4, height:4, borderRadius:2, background:'#5BA88A' }} />}
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes cfPulse  { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes cfRipple { 0%{opacity:.8;transform:translate(-50%,-50%) scale(0)} 100%{opacity:0;transform:translate(-50%,-50%) scale(2.8)} }
        @keyframes cfFloat  { 0%{opacity:0;transform:translateY(8px)} 12%{opacity:1;transform:translateY(0)} 78%{opacity:1;transform:translateY(-26px)} 100%{opacity:0;transform:translateY(-46px)} }
        @keyframes cfOut    { 0%{opacity:1;transform:translateY(-26px)} 100%{opacity:0;transform:translateY(-52px)} }
        @keyframes orbA { 0%,100%{transform:translate(0,0)} 50%{transform:translate(14px,-18px)} }
        @keyframes orbB { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-12px,16px)} }
        @keyframes orbC { 0%,100%{transform:translate(0,0)} 50%{transform:translate(10px,20px)} }
        @keyframes orbD { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-16px,-12px)} }
      `}</style>
    </div>
  )
}

/* ── 말풍선 ────────────────────────────────── */
function Bubble({ b }: { b: { text:string; x:number; y:number; axis:typeof AXES[0]; removing:boolean } }) {
  return (
    <div style={{ position:'absolute', left:b.x, top:b.y, transform:'translateX(-50%)', pointerEvents:'none', zIndex:20, animation: b.removing ? 'cfOut 0.7s ease-out forwards' : 'cfFloat 4.2s ease-out forwards' }}>
      <div style={{ background:'#FFFBF3', border:`1.5px solid ${b.axis.color}`, borderRadius:14, padding:'8px 12px', boxShadow:`0 6px 24px rgba(0,0,0,0.1),0 0 0 4px ${b.axis.color}18`, maxWidth:200 }}>
        <div style={{ fontSize:9, fontWeight:700, color:b.axis.textColor, opacity:0.6, marginBottom:3 }}>{b.axis.label} · {b.axis.sub}</div>
        <div style={{ fontSize:12, color:'#3D2B1F', fontWeight:600, lineHeight:1.5 }}>✓ {b.text}</div>
      </div>
      <div style={{ width:0, height:0, borderLeft:'6px solid transparent', borderRight:'6px solid transparent', borderTop:`6px solid ${b.axis.color}`, margin:'0 auto' }} />
    </div>
  )
}

/* ── 배경 오브 ─────────────────────────────── */
function AmbientOrbs() {
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden', borderRadius:20 }}>
      {[
        { s:{ top:'18%', left:'20%', width:80, height:80 }, c:'rgba(245,168,124,0.18)', a:'orbA 8s ease-in-out infinite' },
        { s:{ top:'22%', right:'18%', width:70, height:70 }, c:'rgba(238,159,184,0.18)', a:'orbB 10s ease-in-out infinite' },
        { s:{ bottom:'24%', left:'18%', width:75, height:75 }, c:'rgba(184,168,212,0.18)', a:'orbC 9s ease-in-out infinite' },
        { s:{ bottom:'20%', right:'20%', width:68, height:68 }, c:'rgba(232,200,110,0.18)', a:'orbD 11s ease-in-out infinite' },
      ].map((o, i) => (
        <div key={i} style={{ position:'absolute', borderRadius:'50%', background:`radial-gradient(circle,${o.c} 0%,transparent 70%)`, animation:o.a, ...o.s }} />
      ))}
    </div>
  )
}
