'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

const TABS = [
  { label: '기록',     href: '/explore' },
  { label: '알림',     href: '/notification' },
  { label: '채팅',     href: '/chat' },
  { label: '대시보드', href: '/dashboard' },
]

function TabIcon({ label, active }: { label: string; active: boolean }) {
  const color = active ? '#A3B18A' : '#B2BEC3'
  const strokeW = 1.8

  if (label === '기록') return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3" width="14" height="18" rx="2"/>
      <line x1="9" y1="8" x2="15" y2="8"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
      <line x1="9" y1="16" x2="12" y2="16"/>
    </svg>
  )
  if (label === '알림') return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
  if (label === '채팅') return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
  if (label === '대시보드') return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  )
  return null
}

export default function IPhoneFrame({ children, title, sub }: { children: ReactNode; title?: string; sub?: string }) {
  const path = usePathname()

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #E8EDE4 0%, #F0F4EE 50%, #EAF0E8 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px 16px',
      fontFamily: "-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif",
    }}>
      <div style={{
        width: 390, height: 844,
        borderRadius: 54,
        background: 'linear-gradient(160deg, #F0F4EE 0%, #F8F9FA 100%)',
        border: '1.5px solid rgba(255,255,255,0.9)',
        boxShadow: '0 40px 100px rgba(0,0,0,0.14), 0 8px 32px rgba(163,177,138,0.12), inset 0 1px 0 rgba(255,255,255,0.95)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', position: 'relative',
        userSelect: 'none',
      }}>

        {/* Dynamic Island */}
        <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', width: 120, height: 36, background: '#1C1C1E', borderRadius: 18, zIndex: 20 }} />

        {/* Status Bar */}
        <div style={{ height: 56, flexShrink: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 28px 8px', zIndex: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#2D3436' }}>9:41</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <svg width="17" height="12" viewBox="0 0 17 12" fill="#2D3436">
              <rect x="0" y="4" width="3" height="8" rx="1" opacity="0.35"/>
              <rect x="4.5" y="2.5" width="3" height="9.5" rx="1" opacity="0.55"/>
              <rect x="9" y="1" width="3" height="11" rx="1"/>
              <rect x="13.5" y="0" width="3" height="12" rx="1"/>
            </svg>
            <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <div style={{ width: 24, height: 12, border: '1.5px solid rgba(45,52,54,0.5)', borderRadius: 3, padding: '2px', display: 'flex', alignItems: 'center' }}>
                <div style={{ height: '100%', width: '75%', background: '#2D3436', borderRadius: 1 }} />
              </div>
              <div style={{ width: 2, height: 6, background: 'rgba(45,52,54,0.35)', borderRadius: '0 1px 1px 0' }} />
            </div>
          </div>
        </div>

        {/* Header */}
        {(title || sub) && (
          <div style={{ padding: '0 22px 14px', flexShrink: 0, borderBottom: '1px solid rgba(163,177,138,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#A3B18A', animation: 'cfPulse 2s infinite' }} />
              <span style={{ fontSize: 20, fontWeight: 800, color: '#2D3436' }}>CareFlow</span>
            </div>
            {sub && <div style={{ fontSize: 11, color: '#636E72', marginTop: 3 }}>{sub}</div>}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>

        {/* Tab Bar */}
        <div style={{
          flexShrink: 0,
          padding: '10px 0 30px',
          borderTop: '1px solid rgba(163,177,138,0.15)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}>
          {TABS.map(tab => {
            const active = path === tab.href
            return (
              <Link key={tab.label} href={tab.href} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, paddingTop: 2 }}>
                <TabIcon label={tab.label} active={active} />
                <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? '#A3B18A' : '#B2BEC3' }}>{tab.label}</span>
                {active && <div style={{ width: 4, height: 4, borderRadius: 2, background: '#A3B18A' }} />}
              </Link>
            )
          })}
        </div>

        <style>{`@keyframes cfPulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
      </div>
    </div>
  )
}
