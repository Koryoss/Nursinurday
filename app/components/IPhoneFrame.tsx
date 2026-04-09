'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

const TABS = [
  { icon: '📋', label: '기록',     href: '/explore'      },
  { icon: '🔔', label: '알림',     href: '/notification'  },
  { icon: '💬', label: '채팅',     href: '/chat'          },
  { icon: '📊', label: '대시보드', href: '/dashboard'     },
]

export default function IPhoneFrame({ children, title, sub }: { children: ReactNode; title?: string; sub?: string }) {
  const path = usePathname()

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(145deg,#EDE0CC,#E8D8C0)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px 16px',
      fontFamily: "-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif",
    }}>
      <div style={{
        width: 390, height: 844,
        borderRadius: 54,
        background: '#FFFBF3',
        border: '2px solid #D4C4A0',
        boxShadow: '0 40px 100px rgba(0,0,0,0.22),inset 0 1px 0 rgba(255,255,255,0.8)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', position: 'relative',
        userSelect: 'none',
      }}>

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
        {(title || sub) && (
          <div style={{ padding:'0 22px 14px', flexShrink:0, borderBottom:'1px solid rgba(61,43,31,0.08)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#5BA88A', animation:'cfPulse 2s infinite' }} />
              <span style={{ fontSize:20, fontWeight:800, color:'#3D2B1F' }}>CareFlow</span>
            </div>
            {sub && <div style={{ fontSize:11, color:'#A08866', marginTop:3 }}>{sub}</div>}
          </div>
        )}

        {/* 콘텐츠 */}
        <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
          {children}
        </div>

        {/* 탭 바 */}
        <div style={{ flexShrink:0, padding:'10px 0 30px', borderTop:'1px solid rgba(61,43,31,0.08)', display:'grid', gridTemplateColumns:'repeat(4,1fr)', background:'rgba(255,251,243,0.96)' }}>
          {TABS.map(tab => {
            const active = path === tab.href
            return (
              <Link key={tab.label} href={tab.href} style={{ textDecoration:'none', display:'flex', flexDirection:'column', alignItems:'center', gap:3, opacity:active ? 1 : 0.4 }}>
                <span style={{ fontSize:22 }}>{tab.icon}</span>
                <span style={{ fontSize:10, fontWeight:active ? 700 : 500, color:active ? '#5BA88A' : '#A08866' }}>{tab.label}</span>
                {active && <div style={{ width:4, height:4, borderRadius:2, background:'#5BA88A' }} />}
              </Link>
            )
          })}
        </div>

        <style>{`@keyframes cfPulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
      </div>
    </div>
  )
}
