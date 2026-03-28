'use client'

import { useState, useEffect } from 'react'

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

const whyNeeded = [
  { icon: '🔄', title: '예측 불가능한 반복',  desc: '어지럼증과 이명은 언제 발생할지 모르기 때문에 일상적인 기록이 치료의 핵심이에요.' },
  { icon: '🏥', title: '진료실 밖의 시간',    desc: '증상은 대부분 일상에서 발생해요. 의사를 만나는 짧은 시간에 6개월치 패턴을 기억하긴 어렵죠.' },
  { icon: '📈', title: '기록이 치료를 바꾼다', desc: '어떤 상황에서 증상이 심해지는지 데이터로 파악하면 생활 습관 조정과 치료 방향 결정에 도움이 돼요.' },
]

export default function HomePage() {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  // 모달 열릴 때 배경 스크롤 막기
  useEffect(() => {
    if (previewOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [previewOpen])

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

        <button
          onClick={() => setPreviewOpen(true)}
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
          앱 미리보기 ▸
        </button>
      </section>

      {/* 왜 이 서비스가 필요한가 */}
      <section style={{
        background: 'rgba(61,43,31,0.04)',
        padding: '60px 24px',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 800, textAlign: 'center', marginBottom: '8px' }}>
            왜 CareFlow가 필요한가요?
          </h2>
          <p style={{ textAlign: 'center', color: '#6B5344', fontSize: '15px', marginBottom: '40px' }}>
            메니에르병은 치료보다 <strong>일상 관리</strong>가 중요한 만성 질환이에요
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
          }}>
            {whyNeeded.map((w, i) => (
              <div key={i} style={{
                background: '#fff',
                borderRadius: '20px',
                padding: '28px',
                border: '1px solid rgba(61,43,31,0.08)',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>{w.icon}</div>
                <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>{w.title}</div>
                <div style={{ fontSize: '14px', color: '#6B5344', lineHeight: 1.6 }}>{w.desc}</div>
              </div>
            ))}
          </div>
        </div>
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

      {/* ── 앱 미리보기 모달 ── */}
      {previewOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setPreviewOpen(false) }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(30, 18, 10, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div style={{
            background: '#FFFBF3',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '960px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 32px 80px rgba(30,18,10,0.3)',
          }}>

            {/* 모달 헤더 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px 0',
              flexShrink: 0,
            }}>
              <div>
                <div style={{ fontSize: '17px', fontWeight: 700 }}>앱 미리보기</div>
                <div style={{ fontSize: '13px', color: '#9B7D6A', marginTop: '2px' }}>대표 기능을 화면으로 확인하세요</div>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                style={{
                  background: 'rgba(61,43,31,0.08)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#3D2B1F',
                  flexShrink: 0,
                }}
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            {/* 대표 기능 카드 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '10px',
              padding: '16px 24px',
              flexShrink: 0,
            }}>
              {features.map((f, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.9)',
                  border: '1px solid rgba(61,43,31,0.08)',
                  borderRadius: '12px',
                  padding: '14px',
                }}>
                  <div style={{ fontSize: '22px', marginBottom: '6px' }}>{f.icon}</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '3px' }}>{f.title}</div>
                  <div style={{ fontSize: '11px', color: '#6B5344', lineHeight: 1.4 }}>{f.desc}</div>
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
                    padding: '10px 18px',
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

            {/* iframe */}
            <iframe
              key={activeTab}
              src={PREVIEW_TABS.find(t => t.id === activeTab)?.src}
              style={{
                flex: 1,
                width: '100%',
                border: 'none',
                background: '#fff',
                minHeight: '0',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
