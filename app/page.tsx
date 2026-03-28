import Link from 'next/link'

const whyNeeded = [
  { icon: '🔄', title: '예측 불가능한 반복',  desc: '어지럼증과 이명은 언제 발생할지 모르기 때문에 일상적인 기록이 치료의 핵심이에요.' },
  { icon: '🏥', title: '진료실 밖의 시간',    desc: '증상은 대부분 일상에서 발생해요. 의사를 만나는 짧은 시간에 6개월치 패턴을 기억하긴 어렵죠.' },
  { icon: '📈', title: '기록이 치료를 바꾼다', desc: '어떤 상황에서 증상이 심해지는지 데이터로 파악하면 생활 습관 조정과 치료 방향 결정에 도움이 돼요.' },
]

export default function HomePage() {
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

        <Link
          href="/preview"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            background: '#3D2B1F',
            color: '#fff',
            padding: '14px 28px',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          앱 미리보기 ▸
        </Link>
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
    </div>
  )
}
