import Link from 'next/link'

const whyNeeded = [
  { icon: '🔄', title: '예측 불가능한 반복',  desc: '어지럼증과 이명은 언제 발생할지 모르기 때문에 일상적인 기록을 통해 자신의 패턴을 파악하고 더 나은 자기 관리를 할 수 있어요.' },
  { icon: '🏥', title: '진료실 밖의 시간',    desc: '증상은 대부분 일상에서 발생해요. 의사를 만나는 짧은 시간에 6개월치 패턴을 기억하긴 어렵죠.' },
  { icon: '📈', title: '기록이 패턴을 보여준다', desc: '어떤 상황에서 증상이 심해지는지 데이터로 파악하면 생활 습관 조정에 도움이 돼요.' },
]

const axes = [
  {
    color: '#F5A87C', bg: 'rgba(245,168,124,0.12)', label: '몸', sub: '신체 증상 · 에너지',
    items: ['이명이 있었나요?', '어지러움이 있었나요?', '피로감을 느꼈나요?', '두통이 있었나요?'],
    maxPts: 4,
  },
  {
    color: '#EE9FB8', bg: 'rgba(238,159,184,0.12)', label: '감정', sub: '불안 · 긴장 · 감정 기복',
    items: ['불안감을 느꼈나요?', '예민하거나 짜증이 났나요?', '두려움이 있었나요?', '기분 변화가 심했나요?'],
    maxPts: 4,
  },
  {
    color: '#B8A8D4', bg: 'rgba(184,168,212,0.12)', label: '관계', sub: '연결 · 고립 · 사회 참여',
    items: ['사람들과 함께했나요?', '고립감을 느꼈나요?', '소통이 힘들었나요?'],
    maxPts: 3,
  },
  {
    color: '#E8C86E', bg: 'rgba(232,200,110,0.12)', label: '의미', sub: '방향 · 성취 · 삶의 질',
    items: ['성취감을 느꼈나요?', '하루가 의미 있었나요?', '계획한 일을 했나요?'],
    maxPts: 3,
  },
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
          🌿 일상 기록 솔루션
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 6vw, 56px)',
          fontWeight: 800,
          lineHeight: 1.2,
          marginBottom: '20px',
          letterSpacing: '-1px',
        }}>
          어지럼증과 이명,<br />매일 함께 기록하세요
        </h1>

        <p style={{
          fontSize: 'clamp(16px, 2.5vw, 20px)',
          color: '#6B5344',
          lineHeight: 1.7,
          maxWidth: '560px',
          margin: '0 auto 40px',
        }}>
          나의 어지럼증과 이명, 손목 위에서 바로 기록하세요.<br />
          iPhone으로 모아진 데이터가 당신의 하루를 더 선명하게 보여줍니다.
        </p>

        <Link
          href="/preview"
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
            갑작스러운 증상에 당황하지 않도록, 일상의 모든 변화를 꼼꼼히 기록하는 든든한 조력자가 되어 드릴게요.
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

      {/* 4축 섹션 */}
      <section style={{ padding: '60px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 800, textAlign: 'center', marginBottom: '8px' }}>
            4축으로 나를 관찰해요
          </h2>
          <p style={{ textAlign: 'center', color: '#6B5344', fontSize: '15px', marginBottom: '40px' }}>
            증상뿐 아니라 <strong>몸·감정·관계·의미</strong> 전체를 함께 들여다봐요
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}>
            {axes.map((axis, i) => (
              <div key={i} style={{
                background: axis.bg,
                borderRadius: '20px',
                padding: '24px',
                border: `1px solid ${axis.color}40`,
                display: 'flex',
                flexDirection: 'column',
                gap: '0',
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: axis.color, marginBottom: '12px',
                }} />
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#3D2B1F', marginBottom: '3px' }}>{axis.label}</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: axis.color, marginBottom: '14px' }}>{axis.sub}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '16px' }}>
                  {axis.items.map((item, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#6B5344' }}>
                      <div style={{
                        width: '16px', height: '16px', borderRadius: '5px', flexShrink: 0,
                        background: `${axis.color}30`, border: `1.5px solid ${axis.color}80`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '9px', color: axis.color, fontWeight: 700,
                      }}>✓</div>
                      {item}
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: 'auto',
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: `${axis.color}20`, borderRadius: '8px',
                  padding: '5px 10px', alignSelf: 'flex-start',
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: axis.color }}>최대 {axis.maxPts}점 / 일</span>
                </div>
              </div>
            ))}
          </div>

          {/* 점수 안내 */}
          <div style={{
            marginTop: '24px',
            background: 'rgba(61,43,31,0.04)',
            borderRadius: '16px',
            padding: '18px 22px',
            fontSize: '13px',
            color: '#6B5344',
            lineHeight: 1.7,
          }}>
            <strong style={{ color: '#3D2B1F' }}>📊 주간 · 월간 통계</strong>는 일일 점수의 단순 평균으로 계산돼요.
            예를 들어 주간 몸 점수 = 7일 점수 합 ÷ 기록한 날 수. 기록이 쌓일수록 나만의 패턴이 선명하게 보여요.
          </div>
        </div>
      </section>

      {/* 면책 문구 */}
      <div style={{
        maxWidth: '760px',
        margin: '0 auto',
        padding: '0 24px 32px',
        fontSize: '12px',
        color: '#A08866',
        lineHeight: 1.7,
        textAlign: 'center',
      }}>
        본 서비스는 의료 기기가 아닙니다. 제공되는 기록과 시각화 데이터는 사용자의 자기 관리 및 진료 시 참고를 돕기 위한 정보일 뿐이며, 어떠한 의학적 진단이나 치료 결정도 대신하지 않습니다.
      </div>

      {/* 푸터 */}
      <footer style={{
        textAlign: 'center',
        padding: '24px 32px 32px',
        fontSize: '13px',
        color: '#9B7D6A',
        borderTop: '1px solid rgba(61,43,31,0.08)',
      }}>
        © 2026 CareFlow
      </footer>
    </div>
  )
}
