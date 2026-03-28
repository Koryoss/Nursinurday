'use client'

import { useState } from 'react'

export default function HomePage() {
  const [previewOpen, setPreviewOpen] = useState(false)

  return (
    <div style={{
      background: 'linear-gradient(160deg, #FFFBF3 0%, #FFF5E0 60%, #F8EDD4 100%)',
      minHeight: '100vh',
      fontFamily: "-apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
      color: '#3D2B1F',
    }}>

      {/* 헤더 */}
      <header style={{ padding: '24px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '22px', fontWeight: 700, color: '#3D2B1F', letterSpacing: '-0.5px' }}>
          Care<span style={{ color: '#5BA88A' }}>Flow</span>
        </div>
      </header>

      {/* 히어로 */}
      <section style={{ textAlign: 'center', padding: '80px 24px 60px' }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(91, 168, 138, 0.15)',
          border: '1px solid rgba(91, 168, 138, 0.4)',
          color: '#3D8A70',
          fontSize: '13px',
          fontWeight: 600,
          padding: '6px 16px',
          borderRadius: '20px',
          marginBottom: '24px',
          letterSpacing: '0.3px',
        }}>
          🌿 메니에르병 일상 관리 솔루션
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 6vw, 56px)',
          fontWeight: 800,
          lineHeight: 1.2,
          marginBottom: '20px',
          letterSpacing: '-1px',
        }}>
          어지럼증과 이명,<br />매일 함께 관리하세요
        </h1>

        <p style={{
          fontSize: 'clamp(16px, 2.5vw, 20px)',
          color: '#6B5344',
          lineHeight: 1.7,
          maxWidth: '560px',
          margin: '0 auto 40px',
        }}>
          Apple Watch로 실시간 증상을 기록하고,<br />
          iPhone에서 패턴을 파악해 더 나은 일상을 만드세요.
        </p>

        {/* CTA */}
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setPreviewOpen(v => !v)}
            style={{
              background: '#3D2B1F',
              color: '#fff',
              padding: '14px 28px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            앱 미리보기 {previewOpen ? '▴' : '▾'}
          </button>
        </div>

        {/* 미리보기 패널 */}
        {previewOpen && (
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '24px' }}>
            <a href="careflow_dashboard_mockup.html" style={previewLinkStyle}>📊 대시보드</a>
            <a href="careflow_calendar.html" style={previewLinkStyle}>📅 캘린더</a>
            <a href="careflow_chat_states.html" style={previewLinkStyle}>💬 채팅 상태</a>
          </div>
        )}
      </section>

      {/* 기능 카드 */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '20px',
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '0 24px 80px',
      }}>
        {features.map((f, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(61,43,31,0.08)',
            borderRadius: '20px',
            padding: '28px',
          }}>
            <div style={{ fontSize: '36px', marginBottom: '14px' }}>{f.icon}</div>
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{f.title}</div>
            <div style={{ fontSize: '14px', color: '#6B5344', lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </section>

      {/* 통계 */}
      <section style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '60px',
        padding: '60px 24px',
        flexWrap: 'wrap',
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        {stats.map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '40px', fontWeight: 800, color: '#5BA88A' }}>{s.num}</div>
            <div style={{ fontSize: '14px', color: '#6B5344', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* 푸터 */}
      <footer style={{
        textAlign: 'center',
        padding: '32px',
        fontSize: '13px',
        color: '#9B7D6A',
        borderTop: '1px solid rgba(61,43,31,0.08)',
      }}>
        © 2026 CareFlow · 메니에르병 환자를 위한 일상 관리 앱
      </footer>
    </div>
  )
}

const previewLinkStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid rgba(61,43,31,0.12)',
  color: '#3D2B1F',
  padding: '12px 22px',
  borderRadius: '10px',
  fontSize: '14px',
  fontWeight: 600,
  textDecoration: 'none',
}

const features = [
  { icon: '⌚', title: 'Apple Watch 실시간 감지', desc: '자이로스코프·심박수·가속도계로 어지럼증 발생을 자동 감지하고 기록해요.' },
  { icon: '🔊', title: '이명 스트레스 완화', desc: '음성 데시벨을 모니터링해 무의식적으로 큰 목소리가 나올 때 햅틱으로 알려줘요.' },
  { icon: '📊', title: '증상 패턴 분석', desc: '기상 직후·취침 전 등 고위험 시간대와 투약 여부를 함께 기록해 패턴을 파악해요.' },
  { icon: '📱', title: 'iPhone 통계 연동', desc: 'Watch에서 수집한 데이터를 iPhone으로 전송해 주간·월간 통계를 한눈에 확인해요.' },
]

const stats = [
  { num: '46만', label: '국내 메니에르 환자' },
  { num: '4.5배', label: '최근 10년간 증가율' },
  { num: '72%', label: '증상 기록 환자 개선율' },
]
