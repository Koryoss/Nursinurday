'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface Discovery {
  id: string
  text: string
  x: number
  y: number
  axis: string
  color: string
  textColor: string
  removing: boolean
}

interface Ripple {
  id: string
  x: number
  y: number
  color: string
}

const AXES = [
  { key: 'body',     label: '몸',  color: '#F5A87C', textColor: '#7A3A0A', zone: [0, 0, 0.5, 0.5] },
  { key: 'emotion',  label: '감정', color: '#EE9FB8', textColor: '#7A1A40', zone: [0.5, 0, 1, 0.5] },
  { key: 'relation', label: '관계', color: '#B8A8D4', textColor: '#3D2878', zone: [0, 0.5, 0.5, 1] },
  { key: 'meaning',  label: '의미', color: '#E8C86E', textColor: '#6B4A00', zone: [0.5, 0.5, 1, 1] },
]

const TODAY = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
const HINT = '화면을 터치해서 오늘을 탐색해보세요'

function getAxis(rx: number, ry: number) {
  return AXES.find(a => rx >= a.zone[0] && rx < a.zone[2] && ry >= a.zone[1] && ry < a.zone[3]) ?? AXES[0]
}

export default function ExplorePage() {
  const [discoveries, setDiscoveries] = useState<Discovery[]>([])
  const [ripples, setRipples] = useState<Ripple[]>([])
  const [loading, setLoading] = useState(false)
  const [hint, setHint] = useState(true)
  const [recorded, setRecorded] = useState<string[]>([])
  const fieldRef = useRef<HTMLDivElement>(null)

  const handleTap = useCallback(async (clientX: number, clientY: number) => {
    if (loading) return
    const rect = fieldRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = clientX - rect.left
    const y = clientY - rect.top
    const rx = x / rect.width
    const ry = y / rect.height
    const axis = getAxis(rx, ry)

    setHint(false)
    setLoading(true)

    const rippleId = Date.now().toString()
    setRipples(r => [...r, { id: rippleId, x, y, color: axis.color }])
    setTimeout(() => setRipples(r => r.filter(p => p.id !== rippleId)), 800)

    try {
      const res = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ axis: axis.key }),
      })
      const data = await res.json()
      const id = Date.now().toString()
      const disc: Discovery = { id, text: data.text, x, y, axis: axis.label, color: axis.color, textColor: axis.textColor, removing: false }
      setDiscoveries(prev => [...prev, disc])
      setRecorded(prev => [...prev, axis.key])

      setTimeout(() => {
        setDiscoveries(prev => prev.map(d => d.id === id ? { ...d, removing: true } : d))
        setTimeout(() => setDiscoveries(prev => prev.filter(d => d.id !== id)), 700)
      }, 3800)
    } catch {
      // silently skip on error
    } finally {
      setLoading(false)
    }
  }, [loading])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    handleTap(e.clientX, e.clientY)
  }, [handleTap])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    handleTap(e.touches[0].clientX, e.touches[0].clientY)
  }, [handleTap])

  const uniqueAxes = [...new Set(recorded)]

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(135deg, #EDE0CC 0%, #F5E8D0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "-apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
    }}>
      {/* iPhone frame */}
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

        {/* Dynamic island */}
        <div style={{
          position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
          width: 120, height: 36, background: '#1C1C1E', borderRadius: 18, zIndex: 20,
        }} />

        {/* Status bar */}
        <div style={{
          height: 56, flexShrink: 0, display: 'flex', alignItems: 'flex-end',
          justifyContent: 'space-between', padding: '0 28px 8px', zIndex: 10,
        }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#3D2B1F' }}>9:41</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <svg width="17" height="12" viewBox="0 0 17 12" fill="#3D2B1F">
              <rect x="0" y="3" width="3" height="9" rx="1" opacity="0.4"/>
              <rect x="4.5" y="2" width="3" height="10" rx="1" opacity="0.6"/>
              <rect x="9" y="0.5" width="3" height="11.5" rx="1"/>
              <rect x="13.5" y="0" width="3" height="12" rx="1"/>
            </svg>
            <svg width="16" height="12" viewBox="0 0 16 12" fill="#3D2B1F">
              <path d="M8 2.5C9.8 2.5 11.4 3.2 12.6 4.4L14 3C12.4 1.5 10.3 0.5 8 0.5C5.7 0.5 3.6 1.5 2 3L3.4 4.4C4.6 3.2 6.2 2.5 8 2.5Z"/>
              <path d="M8 5.5C9.1 5.5 10.1 5.9 10.8 6.7L12.2 5.3C11.1 4.3 9.6 3.5 8 3.5C6.4 3.5 4.9 4.1 3.8 5.3L5.2 6.7C5.9 5.9 6.9 5.5 8 5.5Z"/>
              <circle cx="8" cy="10" r="1.5"/>
            </svg>
            <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <div style={{ width: 25, height: 12, border: '1.5px solid #3D2B1F', borderRadius: 3, padding: '1.5px 2px', display: 'flex', alignItems: 'center' }}>
                <div style={{ height: '100%', width: '80%', background: '#3D2B1F', borderRadius: 1 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div style={{
          padding: '0 24px 14px', flexShrink: 0,
          borderBottom: '1px solid rgba(61,43,31,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#5BA88A', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 20, fontWeight: 800, color: '#3D2B1F' }}>CareFlow</span>
              </div>
              <div style={{ fontSize: 12, color: '#A08866', marginTop: 2 }}>{TODAY} · 오늘을 탐색해보세요</div>
            </div>
            {uniqueAxes.length > 0 && (
              <div style={{ display: 'flex', gap: 4 }}>
                {AXES.filter(a => uniqueAxes.includes(a.key)).map(a => (
                  <div key={a.key} style={{ width: 9, height: 9, borderRadius: '50%', background: a.color }} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 4-axis zone labels */}
        <div style={{ position: 'relative', flexShrink: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '10px 20px 0', gap: '0 0', zIndex: 5 }}>
          {AXES.map(a => (
            <div key={a.key} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 0 6px 0', justifyContent: a.key === 'emotion' || a.key === 'meaning' ? 'flex-end' : 'flex-start' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: a.color, flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: a.textColor, opacity: 0.7 }}>{a.label}</span>
            </div>
          ))}
        </div>

        {/* Interactive field */}
        <div
          ref={fieldRef}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          style={{
            flex: 1,
            position: 'relative',
            cursor: loading ? 'wait' : 'crosshair',
            overflow: 'hidden',
            margin: '6px 14px',
            borderRadius: 20,
            border: '1px solid rgba(61,43,31,0.08)',
          }}
        >
          {/* Zone backgrounds */}
          <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ background: 'radial-gradient(ellipse at 40% 40%, rgba(245,168,124,0.18) 0%, transparent 70%)' }} />
            <div style={{ background: 'radial-gradient(ellipse at 60% 40%, rgba(238,159,184,0.18) 0%, transparent 70%)' }} />
            <div style={{ background: 'radial-gradient(ellipse at 40% 60%, rgba(184,168,212,0.18) 0%, transparent 70%)' }} />
            <div style={{ background: 'radial-gradient(ellipse at 60% 60%, rgba(232,200,110,0.18) 0%, transparent 70%)' }} />
          </div>

          {/* Floating orbs (ambient) */}
          <Orbs />

          {/* Center divider lines (faint) */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(61,43,31,0.05)' }} />
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(61,43,31,0.05)' }} />
          </div>

          {/* Hint text */}
          {hint && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
            }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>🌿</div>
              <div style={{ fontSize: 12, color: 'rgba(61,43,31,0.4)', fontWeight: 500, textAlign: 'center', lineHeight: 1.7 }}>
                {HINT}
              </div>
            </div>
          )}

          {/* Loading pulse */}
          {loading && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                border: '2.5px solid rgba(91,168,138,0.3)',
                borderTopColor: '#5BA88A',
                animation: 'spin 0.8s linear infinite',
              }} />
            </div>
          )}

          {/* Ripples */}
          {ripples.map(r => (
            <div key={r.id} style={{
              position: 'absolute',
              left: r.x, top: r.y,
              transform: 'translate(-50%, -50%)',
              width: 60, height: 60,
              borderRadius: '50%',
              border: `2px solid ${r.color}`,
              animation: 'ripple 0.8s ease-out forwards',
              pointerEvents: 'none',
            }} />
          ))}

          {/* Floating discoveries */}
          {discoveries.map(d => (
            <FloatingText key={d.id} discovery={d} />
          ))}
        </div>

        {/* Recorded count bar */}
        {recorded.length > 0 && (
          <div style={{
            margin: '6px 14px 0',
            padding: '10px 14px',
            background: 'rgba(91,168,138,0.08)',
            borderRadius: 12,
            border: '1px solid rgba(91,168,138,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 11, color: '#5BA88A', fontWeight: 700 }}>
              ✅ {recorded.length}개 항목 기록됨
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {AXES.map(a => {
                const count = recorded.filter(r => r === a.key).length
                if (count === 0) return null
                return (
                  <span key={a.key} style={{
                    fontSize: 10, fontWeight: 700,
                    padding: '2px 7px', borderRadius: 99,
                    background: `${a.color}30`, color: a.textColor,
                  }}>{a.label} {count}</span>
                )
              })}
            </div>
          </div>
        )}

        {/* Bottom tab bar */}
        <div style={{
          flexShrink: 0,
          padding: '10px 0 28px',
          borderTop: '1px solid rgba(61,43,31,0.08)',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          background: 'rgba(255,251,243,0.95)',
          backdropFilter: 'blur(10px)',
          marginTop: 8,
        }}>
          {[
            { icon: '📋', label: '기록' },
            { icon: '🔔', label: '알림' },
            { icon: '💬', label: '채팅' },
            { icon: '📊', label: '대시보드' },
          ].map((tab, i) => (
            <div key={tab.label} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              opacity: i === 0 ? 1 : 0.45,
            }}>
              <span style={{ fontSize: 22 }}>{tab.icon}</span>
              <span style={{
                fontSize: 10, fontWeight: i === 0 ? 700 : 500,
                color: i === 0 ? '#5BA88A' : '#A08866',
              }}>{tab.label}</span>
              {i === 0 && <div style={{ width: 4, height: 4, borderRadius: 2, background: '#5BA88A' }} />}
            </div>
          ))}
        </div>

      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes ripple { 0%{opacity:0.8;transform:translate(-50%,-50%) scale(0)} 100%{opacity:0;transform:translate(-50%,-50%) scale(2.5)} }
        @keyframes floatUp { 0%{opacity:0;transform:translateY(10px)} 15%{opacity:1;transform:translateY(0)} 75%{opacity:1;transform:translateY(-30px)} 100%{opacity:0;transform:translateY(-50px)} }
        @keyframes floatOut { 0%{opacity:1;transform:translateY(-30px)} 100%{opacity:0;transform:translateY(-60px)} }
        @keyframes orbFloat1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(12px,-16px)} }
        @keyframes orbFloat2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-10px,14px)} }
        @keyframes orbFloat3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(8px,18px)} }
        @keyframes orbFloat4 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-14px,-10px)} }
      `}</style>
    </div>
  )
}

function FloatingText({ discovery }: { discovery: Discovery }) {
  return (
    <div style={{
      position: 'absolute',
      left: discovery.x,
      top: discovery.y,
      transform: 'translateX(-50%)',
      pointerEvents: 'none',
      animation: discovery.removing
        ? 'floatOut 0.7s ease-out forwards'
        : 'floatUp 4.5s ease-out forwards',
      zIndex: 20,
      whiteSpace: 'nowrap',
      maxWidth: 220,
    }}>
      <div style={{
        background: '#FFFBF3',
        border: `1.5px solid ${discovery.color}`,
        borderRadius: 12,
        padding: '7px 12px',
        boxShadow: `0 4px 20px rgba(0,0,0,0.1), 0 0 0 3px ${discovery.color}20`,
      }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: discovery.textColor, marginBottom: 2, opacity: 0.7 }}>{discovery.axis}</div>
        <div style={{ fontSize: 11, color: '#3D2B1F', fontWeight: 500, whiteSpace: 'normal', lineHeight: 1.5 }}>{discovery.text}</div>
      </div>
      <div style={{
        width: 0, height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: `6px solid ${discovery.color}`,
        margin: '0 auto',
      }} />
    </div>
  )
}

function Orbs() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 20 }}>
      <div style={{ position: 'absolute', width: 80, height: 80, top: '15%', left: '18%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,168,124,0.22) 0%, transparent 70%)', animation: 'orbFloat1 7s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: 70, height: 70, top: '20%', right: '16%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(238,159,184,0.22) 0%, transparent 70%)', animation: 'orbFloat2 9s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: 75, height: 75, bottom: '22%', left: '15%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(184,168,212,0.22) 0%, transparent 70%)', animation: 'orbFloat3 8s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: 65, height: 65, bottom: '18%', right: '18%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,200,110,0.22) 0%, transparent 70%)', animation: 'orbFloat4 10s ease-in-out infinite' }} />
    </div>
  )
}
