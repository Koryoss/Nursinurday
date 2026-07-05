'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const T = {
  bg: '#F3F6F1',
  card: 'rgba(255,255,255,0.82)',
  body: '#26312A',
  sub: '#5F6D64',
  dim: '#8D9A91',
  primary: '#5C7A5E',
  border: '#e5ebe5',
  font: "Pretendard, -apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
}

const NAV = [
  { href: '/study',       label: '논문 질문' },
  { href: '/study/claim', label: '주장 근거화' },
  { href: '/study/audit', label: '경계 검사' },
  { href: '/study/linknote', label: 'LinkNote 연동' },
]

export default function StudyLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()

  return (
    <div style={{ minHeight: '100svh', background: T.bg, color: T.body, fontFamily: T.font }}>
      <header style={{
        background: T.card,
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${T.border}`,
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        height: 52,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.primary }} />
          <span style={{ fontWeight: 600, fontSize: 15 }}>CareFlow Study Workspace</span>
        </div>

        {/* Tab nav */}
        <nav style={{ display: 'flex', gap: 2 }}>
          {NAV.map(({ href, label }) => {
            const active = path === href
            return (
              <Link key={href} href={href} style={{
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: active ? T.primary : T.sub,
                background: active ? '#EEF4EE' : 'transparent',
                padding: '5px 12px',
                borderRadius: 8,
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}>
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Badge */}
        <span style={{
          marginLeft: 'auto',
          fontSize: 11,
          color: T.dim,
          background: T.bg,
          padding: '3px 10px',
          borderRadius: 999,
          border: `1px solid ${T.border}`,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          관리자 전용 · 논문 근거 인용 · 비의료 자문
        </span>
      </header>

      {children}
    </div>
  )
}
