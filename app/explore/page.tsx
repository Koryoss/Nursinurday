'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'

/* ── 4축 아이템 (이모지 + 핵심어 + 전체 질문) ── */
const AXES = [
  {
    key: 'body', label: '몸', sub: '신체 증상 · 에너지',
    color: '#F5A87C', textColor: '#7A3A0A', bg: 'rgba(245,168,124,0.12)',
    items: [
      { emoji: '👂', word: '이명',    question: '이명이 있었나요?' },
      { emoji: '🌀', word: '어지러움', question: '어지러움이 있었나요?' },
      { emoji: '😴', word: '피로',    question: '피로감을 느꼈나요?' },
      { emoji: '🤕', word: '두통',    question: '두통이 있었나요?' },
    ],
  },
  {
    key: 'emotion', label: '감정', sub: '불안 · 긴장 · 감정 기복',
    color: '#EE9FB8', textColor: '#7A1A40', bg: 'rgba(238,159,184,0.12)',
    items: [
      { emoji: '😰', word: '불안',     question: '불안감을 느꼈나요?' },
      { emoji: '😤', word: '예민·짜증', question: '예민하거나 짜증이 났나요?' },
      { emoji: '😨', word: '두려움',   question: '두려움이 있었나요?' },
      { emoji: '🎭', word: '기분 기복', question: '기분 변화가 심했나요?' },
    ],
  },
  {
    key: 'relation', label: '관계', sub: '연결 · 고립 · 사회 참여',
    color: '#B8A8D4', textColor: '#3D2878', bg: 'rgba(184,168,212,0.12)',
    items: [
      { emoji: '🤝', word: '함께함',    question: '사람들과 함께했나요?' },
      { emoji: '🏝️', word: '고립감',    question: '고립감을 느꼈나요?' },
      { emoji: '💭', word: '소통 어려움', question: '소통이 힘들었나요?' },
    ],
  },
  {
    key: 'meaning', label: '의미', sub: '방향 · 성취 · 삶의 질',
    color: '#E8C86E', textColor: '#6B4A00', bg: 'rgba(232,200,110,0.12)',
    items: [
      { emoji: '⭐', word: '성취감',   question: '성취감을 느꼈나요?' },
      { emoji: '✨', word: '의미 있음', question: '하루가 의미 있었나요?' },
      { emoji: '📌', word: '계획 실행', question: '계획한 일을 했나요?' },
    ],
  },
]

const TOTAL = AXES.reduce((s, a) => s + a.items.length, 0)

interface Bubble { id: string; text: string; x: number; y: number; color: string; textColor: string; removing: boolean }
interface Ripple  { id: string; x: number; y: number; color: string }

const TODAY = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })

export default function ExplorePage() {
  const [checked, setChecked] = useState<Record<string, boolean[]>>(
    Object.fromEntries(AXES.map(a => [a.key, Array(a.items.length).fill(false)]))
  )
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [ripples, setRipples] = useState<Ripple[]>([])
  const [allDone, setAllDone] = useState(false)
  const phoneRef = useRef<HTMLDivElement>(null)
  const cooldown = useRef(false)

  const totalChecked = Object.values(checked).reduce((s, arr) => s + arr.filter(Boolean).length, 0)

  const handleItem = useCallback((axisKey: string, idx: number, e: React.MouseEvent) => {
    if (cooldown.current) return
    const isChecked = checked[axisKey][idx]
    if (isChecked) return // 이미 체크된 항목은 무시

    cooldown.current = true
    setTimeout(() => { cooldown.current = false }, 350)

    // 버튼 위치 → 폰 프레임 기준 좌표
    const phoneRect = phoneRef.current?.getBoundingClientRect()
    const btnRect   = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = btnRect.left + btnRect.width / 2  - (phoneRect?.left ?? 0)
    const y = btnRect.top  + btnRect.height / 2 - (phoneRect?.top  ?? 0)

    const axis = AXES.find(a => a.key === axisKey)!

    // 리플
    const rid = Date.now().toString()
    setRipples(r => [...r, { id: rid, x, y, color: axis.color }])
    setTimeout(() => setRipples(r => r.filter(p => p.id !== rid)), 900)

    // 체크 업데이트
    const newChecked = {
      ...checked,
      [axisKey]: checked[axisKey].map((v, i) => i === idx ? true : v),
    }
    setChecked(newChecked)

    const newTotal = Object.values(newChecked).reduce((s, arr) => s + arr.filter(Boolean).length, 0)
    if (newTotal >= TOTAL) setTimeout(() => setAllDone(true), 600)

    // 플로팅 버블
    const id = `${Date.now()}-${Math.random()}`
    setBubbles(prev => [...prev.slice(-4), { id, text: axis.items[idx].question, x, y, color: axis.color, textColor: axis.textColor, removing: false }])
    setTimeout(() => {
      setBubbles(prev => prev.map(b => b.id === id ? { ...b, removing: true } : b))
      setTimeout(() => setBubbles(prev => prev.filter(b => b.id !== id)), 700)
    }, 3200)
  }, [checked])

  return (
    <div style={{ minHeight:'100dvh', background:'linear-gradient(145deg,#EDE0CC,#E8D8C0)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px 16px', fontFamily:"-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif" }}>

      {/* ── 아이폰 프레임 ── */}
      <div ref={phoneRef} style={{ width:390, height:844, borderRadius:54, background:'#FFFBF3', border:'2px solid #D4C4A0', boxShadow:'0 40px 100px rgba(0,0,0,0.22),inset 0 1px 0 rgba(255,255,255,0.8)', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column', userSelect:'none' }}>

        {/* Dynamic Island */}
        <div style={{ position:'absolute', top:14, left:'50%', transform:'translateX(-50%)', width:120, height:36, background:'#1C1C1E', borderRadius:18, zIndex:20, pointerEvents:'none' }} />

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
                {TODAY} · {allDone ? '오늘 기록 완료 🎉' : `${totalChecked} / ${TOTAL} 항목 기록됨`}
              </div>
            </div>
            {/* 축별 도트 */}
            <div style={{ display:'flex', gap:5 }}>
              {AXES.map(a => {
                const cnt  = checked[a.key].filter(Boolean).length
                const done = cnt === a.items.length
                return (
                  <div key={a.key} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                    <div style={{ width:9, height:9, borderRadius:'50%', background: done ? a.color : cnt > 0 ? `${a.color}80` : 'rgba(61,43,31,0.1)', transition:'all 0.4s', boxShadow: done ? `0 0 6px ${a.color}` : 'none' }} />
                    <span style={{ fontSize:8, color: done ? a.textColor : '#C4B09A', fontWeight:700 }}>{a.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
          {/* 진행 바 */}
          <div style={{ marginTop:10, height:4, background:'rgba(61,43,31,0.08)', borderRadius:2, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${(totalChecked/TOTAL)*100}%`, background:'linear-gradient(90deg,#5BA88A,#7CC4A8)', borderRadius:2, transition:'width 0.5s ease' }} />
          </div>
        </div>

        {/* ── 체크리스트 스크롤 영역 ── */}
        <div style={{ flex:1, overflowY:'auto', padding:'12px 16px', display:'flex', flexDirection:'column', gap:10, scrollbarWidth:'none' }}>
          {AXES.map(a => {
            const cnt  = checked[a.key].filter(Boolean).length
            const done = cnt === a.items.length
            return (
              <div key={a.key} style={{ background:'#FFF8EC', borderRadius:16, border:'1px solid #EAD9BA', borderLeft:`3px solid ${a.color}`, overflow:'hidden', transition:'box-shadow 0.3s', boxShadow: done ? `0 0 0 1.5px ${a.color}60` : 'none' }}>
                {/* 축 헤더 */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px 8px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:13, fontWeight:800, color:a.textColor }}>{a.label}</span>
                    <span style={{ fontSize:10, color:'#A08866' }}>{a.sub}</span>
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99, background:`${a.color}28`, color:a.textColor }}>
                    {done ? '✓ 완료' : `${cnt}/${a.items.length}`}
                  </span>
                </div>

                {/* 항목 리스트 */}
                <div style={{ borderTop:'1px solid rgba(61,43,31,0.06)' }}>
                  {a.items.map((item, i) => {
                    const isChecked = checked[a.key][i]
                    return (
                      <div
                        key={i}
                        onClick={e => handleItem(a.key, i, e)}
                        style={{
                          display:'flex', alignItems:'center', gap:10,
                          padding:'10px 14px',
                          borderBottom: i < a.items.length-1 ? '1px solid rgba(61,43,31,0.05)' : 'none',
                          cursor: isChecked ? 'default' : 'pointer',
                          background: isChecked ? `${a.color}10` : 'transparent',
                          transition:'background 0.3s',
                        }}
                      >
                        {/* 체크 아이콘 */}
                        <span style={{ fontSize:14, fontWeight:800, color: isChecked ? a.color : '#D4C4A8', width:16, textAlign:'center', transition:'color 0.3s', flexShrink:0 }}>
                          {isChecked ? '✓' : '○'}
                        </span>
                        {/* 이모지 */}
                        <span style={{ fontSize:18, flexShrink:0, opacity: isChecked ? 1 : 0.45, transition:'opacity 0.3s' }}>
                          {item.emoji}
                        </span>
                        {/* 핵심어 */}
                        <span style={{ fontSize:13, fontWeight: isChecked ? 700 : 500, color: isChecked ? '#3D2B1F' : '#A08866', transition:'all 0.3s', flex:1 }}>
                          {item.word}
                        </span>
                        {/* 미체크시 탭 힌트 */}
                        {!isChecked && (
                          <span style={{ fontSize:9, color:'#C4B09A', fontWeight:500 }}>탭해서 기록</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* 전체 완료 메시지 */}
          {allDone && (
            <div style={{ background:'rgba(91,168,138,0.1)', border:'1.5px solid rgba(91,168,138,0.3)', borderRadius:16, padding:'16px', textAlign:'center' }}>
              <div style={{ fontSize:28, marginBottom:6 }}>🎉</div>
              <div style={{ fontSize:14, fontWeight:800, color:'#3D2B1F', marginBottom:4 }}>오늘 기록 완료!</div>
              <div style={{ fontSize:11, color:'#A08866', lineHeight:1.7, marginBottom:12 }}>14개 항목이 모두 기록됐어요.<br />대시보드에서 오늘을 확인해보세요.</div>
              <Link href="/dashboard" style={{ background:'#5BA88A', color:'#fff', fontSize:12, fontWeight:700, padding:'8px 20px', borderRadius:99, textDecoration:'none', display:'inline-block' }}>
                대시보드 보기 →
              </Link>
            </div>
          )}

          <div style={{ height:8 }} />
        </div>

        {/* ── 플로팅 버블 (폰 프레임 기준 절대 위치) ── */}
        {bubbles.map(b => (
          <div key={b.id} style={{
            position:'absolute', left:b.x, top:b.y,
            transform:'translateX(-50%)',
            pointerEvents:'none', zIndex:30,
            animation: b.removing ? 'cfOut 0.7s ease-out forwards' : 'cfFloat 3.9s ease-out forwards',
          }}>
            <div style={{ background:'#FFFBF3', border:`1.5px solid ${b.color}`, borderRadius:14, padding:'8px 13px', boxShadow:`0 6px 24px rgba(0,0,0,0.12),0 0 0 4px ${b.color}18`, maxWidth:210, whiteSpace:'normal' }}>
              <div style={{ fontSize:10, fontWeight:700, color:b.textColor, opacity:0.6, marginBottom:3 }}>기록됨</div>
              <div style={{ fontSize:12.5, color:'#3D2B1F', fontWeight:700, lineHeight:1.5 }}>✓ {b.text}</div>
            </div>
            <div style={{ width:0, height:0, borderLeft:'6px solid transparent', borderRight:'6px solid transparent', borderTop:`6px solid ${b.color}`, margin:'0 auto' }} />
          </div>
        ))}

        {/* ── 리플 ── */}
        {ripples.map(r => (
          <div key={r.id} style={{ position:'absolute', left:r.x, top:r.y, transform:'translate(-50%,-50%)', width:56, height:56, borderRadius:'50%', border:`2px solid ${r.color}`, animation:'cfRipple 0.9s ease-out forwards', pointerEvents:'none', zIndex:25 }} />
        ))}

        {/* ── 하단 탭 바 ── */}
        <div style={{ flexShrink:0, padding:'10px 0 30px', borderTop:'1px solid rgba(61,43,31,0.08)', display:'grid', gridTemplateColumns:'repeat(4,1fr)', background:'rgba(255,251,243,0.97)' }}>
          {[
            { icon:'📋', label:'기록',     href:'/explore',      active:true  },
            { icon:'🔔', label:'알림',     href:'/notification', active:false },
            { icon:'💬', label:'채팅',     href:'/chat',         active:false },
            { icon:'📊', label:'대시보드', href:'/dashboard',    active:false },
          ].map(tab => (
            <Link key={tab.label} href={tab.href} style={{ textDecoration:'none', display:'flex', flexDirection:'column', alignItems:'center', gap:3, opacity:tab.active ? 1 : 0.4 }}>
              <span style={{ fontSize:22 }}>{tab.icon}</span>
              <span style={{ fontSize:10, fontWeight:tab.active ? 700 : 500, color:tab.active ? '#5BA88A' : '#A08866' }}>{tab.label}</span>
              {tab.active && <div style={{ width:4, height:4, borderRadius:2, background:'#5BA88A' }} />}
            </Link>
          ))}
        </div>

        <style>{`
          @keyframes cfPulse  { 0%,100%{opacity:1} 50%{opacity:.3} }
          @keyframes cfRipple { 0%{opacity:.8;transform:translate(-50%,-50%) scale(0)} 100%{opacity:0;transform:translate(-50%,-50%) scale(3)} }
          @keyframes cfFloat  { 0%{opacity:0;transform:translateX(-50%) translateY(6px)} 12%{opacity:1;transform:translateX(-50%) translateY(0)} 78%{opacity:1;transform:translateX(-50%) translateY(-28px)} 100%{opacity:0;transform:translateX(-50%) translateY(-48px)} }
          @keyframes cfOut    { 0%{opacity:1;transform:translateX(-50%) translateY(-28px)} 100%{opacity:0;transform:translateX(-50%) translateY(-54px)} }
          div::-webkit-scrollbar { display:none; }
        `}</style>
      </div>
    </div>
  )
}
