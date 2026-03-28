'use client'

import { useState } from 'react'

const PREVIEW_TABS = [
  { id: 'dashboard', label: '📊 대시보드', src: '/careflow_dashboard_mockup.html' },
  { id: 'calendar',  label: '📅 캘린더',   src: '/careflow_calendar.html' },
  { id: 'chat',      label: '💬 채팅 상태', src: '/careflow_chat_states.html' },
]

const features = [
  { icon: '⌚', title: 'Apple Watch 실시간 감지',  desc: '자이로스코프·심박수·가속도계로 어지럼증 발생을 자동 감지하고 기록해요.' },
  { icon: '🔊', title: '이명 스트레스 완화',       desc: '음성 데시벨을 모니터링해 무의식적으로 큰 목소리가 나올 때 햅틱으로 알려줘요.' },
  { icon: '📊', title: '증상 패턴 분석',           desc: '기상 직후·취침 전 등 고위험 시간대와 투약 여부를 함께 기록해 패턴을 파악해요.' },
  { icon: '📱', title: 'iPhone 통계 연동',         desc: 'Watch에서 수집한 데이터를 iPhone으로 전송해 주간·월간 통계를 한눈에 확인해요.' },
]

export default function PreviewPage() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#FFFBF3',
      fontFamily: "-apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
      color: '#3D2B1F',
    }}>

      {/* 상단 바 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 24px',
        borderBottom: '1px solid rgba(61,43,31,0.1)',
        flexShrink: 0,
        background: '#FFFBF3',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href="/" style={{ fontSize: '20px', fontWeight: 700, color: '#3D2B1F', textDecoration: 'none', letterSpacing: '-0.5px' }}>
            Care<span style={{ color: '#5BA88A' }}>Flow</span>
          </a>
          <span style={{ color: 'rgba(61,43,31,0.25)', fontSize: '16px' }}>|</span>
          <span style={{ fontSize: '14px', color: '#6B5344', fontWeight: 500 }}>앱 미리보기</span>
        </div>
        <a
          href="/"
          style={{
            fontSize: '13px',
            color: '#9B7D6A',
            textDecoration: 'none',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(61,43,31,0.15)',
          }}
        >
          ← 홈으로
        </a>
      </div>

      {/* 대표 기능 카드 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '10px',
        padding: '14px 24px',
        flexShrink: 0,
      }}>
        {features.map((f, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(61,43,31,0.08)',
            borderRadius: '12px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{ fontSize: '24px', flexShrink: 0 }}>{f.icon}</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '2px' }}>{f.title}</div>
              <div style={{ fontSize: '11px', color: '#6B5344', lineHeight: 1.4 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 탭 바 */}
      <div style={{
        display: 'flex',
        gap: '6px',
        padding: '0 24px',
        borderBottom: '2px solid rgba(61,43,31,0.1)',
        flexShrink: 0,
      }}>
        {PREVIEW_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'all 0.15s',
              background: activeTab === tab.id ? '#3D2B1F' : 'rgba(61,43,31,0.06)',
              color: activeTab === tab.id ? '#fff' : '#6B5344',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* iframe — 나머지 공간 전부 차지 */}
      <iframe
        key={activeTab}
        src={PREVIEW_TABS.find(t => t.id === activeTab)?.src}
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
          background: '#fff',
        }}
      />
    </div>
  )
}
