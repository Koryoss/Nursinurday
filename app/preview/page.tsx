'use client'

import { useState } from 'react'

const PREVIEW_TABS = [
  { id: 'measurement',  label: '📝 기록',    src: '/careflow_measurement.html' },
  { id: 'notification', label: '🔔 알림',    src: '/careflow_notification.html' },
  { id: 'chat',         label: '💬 채팅',    src: '/careflow_chat_states.html' },
  { id: 'dashboard',    label: '📊 대시보드', src: '/careflow_dashboard_mockup.html' },
]

const features = [
  { icon: '⌚', title: 'Apple Watch: 움직임 기록',      desc: '어지러움이 느껴질 때의 움직임을 담으세요. 가속도계와 자이로스코프 데이터를 통해 당시의 보행 상태와 심박수 변화를 있는 그대로 기록합니다.' },
  { icon: '🔊', title: '목소리 에티켓: 햅틱 알림',      desc: '편안한 대화를 위한 목소리 톤 가이드. 주변 소음을 모니터링하여 목소리가 평소보다 커질 때 부드러운 진동으로 알려드려요. 이명 중에도 차분한 대화를 이어갈 수 있도록 돕습니다.' },
  { icon: '💊', title: '복약 및 일상 루틴: 체크리스트', desc: '잊기 쉬운 복약과 수면, 꼼꼼하게 챙기세요. 정해진 시간에 복약 여부를 확인하고, 수면 데이터와 연동해 기상·취침 전후의 컨디션을 기록하도록 안내합니다.' },
  { icon: '📊', title: '데이터 시각화: 일상 추이 리포트', desc: '기록이 모여 나의 일상 지도가 됩니다. 복약 기록, 수면 시간, 4축 일기를 하나의 그래프로 보여주어, 나의 하루가 어떤 흐름으로 흘러가는지 한눈에 살펴보세요.' },
  { icon: '📱', title: 'iPhone: 통합 기록 보관함',      desc: 'Watch의 기록을 iPhone에서 더 넓게 보세요. 손목 위에서 남긴 짧은 순간들을 iPhone으로 모아 주간·월간 단위의 상세한 기록 일지로 확인합니다.' },
]

export default function PreviewPage() {
  const [activeTab, setActiveTab] = useState('measurement')

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
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
            <div style={{ fontSize: '22px', flexShrink: 0 }}>{f.icon}</div>
            <div style={{ fontSize: '13px', fontWeight: 700 }}>{f.title}</div>
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
