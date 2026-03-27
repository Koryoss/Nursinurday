// =====================================================
// 랜딩 페이지 (홈) — 수국 버터크림 v3
// 소비자 향 — 진단명 나열 없음, 일기장 포지셔닝
// =====================================================
import Link from 'next/link'

export default function HomePage() {
  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #FFFBF3 0%, #FFF5E0 60%, #F8EDD4 100%)' }}
    >

      {/* ── 헤더 ── */}
      <header
        className="flex items-center justify-between px-6 py-4 md:px-12"
        style={{ borderBottom: '1px solid #EAD9BA' }}
      >
        <span style={{ color: '#28C840' }} className="font-bold text-xl tracking-tight">
          🌼 CareFlow
        </span>
        <nav className="hidden md:flex gap-6 text-sm" style={{ color: '#8B6F57' }}>
          <a href="#about" className="hover:opacity-70 transition-opacity">소개</a>
          <a href="#how" className="hover:opacity-70 transition-colors">이용 방법</a>
        </nav>
      </header>

      {/* ── 히어로 섹션 ── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 md:py-24">

        {/* 배지 */}
        <span
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-6"
          style={{ background: '#C8F0D0', color: '#1A7030' }}
        >
          오늘의 나를 위해
        </span>

        {/* 메인 타이틀 */}
        <h1
          className="text-3xl md:text-5xl font-bold leading-tight mb-5 max-w-2xl"
          style={{ color: '#2C1C10' }}
        >
          나를 들여다보는<br />
          <span style={{ color: '#28C840' }}>일기장</span>
        </h1>

        {/* 서브타이틀 — 질환명 나열 없이 포용적 표현 */}
        <p
          className="text-base md:text-lg max-w-md mb-10 leading-loose"
          style={{ color: '#7A5A3C' }}
        >
          일상 속에서 함께 살아가야 하는 어려움이 있는<br />
          모든 분들을 위한 공간이에요<br />
          고치려는 게 아니라 오늘의 내가 어땠는지를<br />
          함께 들여다봐요
        </p>

        {/* CTA 버튼 */}
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 font-semibold px-8 py-4 rounded-2xl text-base transition-all duration-200 hover:-translate-y-0.5"
          style={{
            background: '#28C840',
            color: '#FFFBF3',
            boxShadow: '0 4px 20px rgba(40, 200, 64, 0.3)',
          }}
        >
          오늘 기록 시작하기 →
        </Link>

        <p className="mt-4 text-xs" style={{ color: '#B89A6A' }}>
          무료로 사용할 수 있어요 · 의료 진단을 대체하지 않습니다
        </p>

        {/* 모드 선택 힌트 */}
        <div
          className="mt-6 flex items-center gap-2 text-xs rounded-full px-4 py-2"
          style={{ background: '#E8F8EC', color: '#1A7030' }}
        >
          <span>💬</span>
          <span>시작할 때 <strong>친근 모드</strong> 또는 <strong>엄격 모드</strong> 중 편한 말투를 고를 수 있어요</span>
        </div>
      </section>

      {/* ── 특징 섹션 ── */}
      <section
        id="about"
        className="px-6 py-12 md:px-12"
        style={{ background: '#FFF8EC', borderTop: '1px solid #EAD9BA' }}
      >
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-xl font-bold text-center mb-10"
            style={{ color: '#2C1C10' }}
          >
            🌼 일기장처럼 쉽게, 하지만 더 깊이
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 text-left"
                style={{ background: '#FFFBF3', border: '1px solid #EAD9BA' }}
              >
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold mb-2 text-base" style={{ color: '#2C1C10' }}>
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8B6F57' }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 이런 날 열어보세요 ── */}
      <section className="px-6 py-12 md:px-12">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-center mb-8" style={{ color: '#2C1C10' }}>
            이런 날 열어보세요
          </h2>
          <div className="space-y-3">
            {situations.map((s, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
                style={{ background: '#FFF8EC', color: '#5C3D1E' }}
              >
                <span className="text-base flex-shrink-0">{s.icon}</span>
                <span>{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 이용 방법 ── */}
      <section
        id="how"
        className="px-6 py-12 md:px-12"
        style={{ background: '#FFF8EC', borderTop: '1px solid #EAD9BA' }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-bold mb-8" style={{ color: '#2C1C10' }}>
            이용 방법
          </h2>
          <div className="space-y-4">
            {steps.map((s, i) => (
              <div key={i} className="flex items-start gap-4 text-left">
                <span
                  className="flex-shrink-0 w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center"
                  style={{ background: '#28C840', color: '#FFFBF3' }}
                >
                  {i + 1}
                </span>
                <p className="text-sm pt-0.5" style={{ color: '#5C3D1E' }}>{s}</p>
              </div>
            ))}
          </div>

          <Link
            href="/onboarding"
            className="mt-10 inline-block font-semibold px-6 py-3 rounded-xl transition-opacity hover:opacity-80"
            style={{ background: '#28C840', color: '#FFFBF3' }}
          >
            바로 시작하기
          </Link>
        </div>
      </section>

      {/* ── 푸터 ── */}
      <footer
        className="px-6 py-6 text-center text-xs"
        style={{ borderTop: '1px solid #EAD9BA', color: '#B89A6A' }}
      >
        CareFlow v0.1 · 의료 진단·처방을 대체하지 않습니다 · 약물 문의: 의약품안전나라 karp.drugsafe.or.kr
      </footer>
    </main>
  )
}

// ─ 데이터 ─
const features = [
  {
    icon: '🌼',
    title: '오늘을 기록하는 일기장',
    desc: '진단하거나 고치려는 게 아니에요. 오늘의 내가 어땠는지를 함께 들여다보고 기록해요',
  },
  {
    icon: '🪞',
    title: '내 상태를 보는 거울',
    desc: '오늘 몸은 어떤 신호를 보냈는지, 어떤 감정이 왔는지 — 질문에 답하다 보면 내가 보여요',
  },
  {
    icon: '🌱',
    title: '5분짜리 작은 행동',
    desc: '거창한 해결책 대신 지금 당장 5분 안에 해볼 수 있는 것 하나만 같이 찾아봐요',
  },
]

const situations = [
  { icon: '🔊', text: '갑작스러운 소리 때문에 오늘 하루가 힘들었던 날' },
  { icon: '🌀', text: '컨디션이 어떤지 모르겠어서 그냥 정리하고 싶은 날' },
  { icon: '😤', text: '이유 모를 짜증이 나서 주변 사람들한테 미안한 날' },
  { icon: '👁️', text: '집중이 잘 안 되고 뭔가 자꾸 신경 쓰이는 날' },
  { icon: '😶', text: '딱히 무슨 일이 있었던 건 아닌데 그냥 무거운 날' },
]

const steps = [
  '말투 선택 — 친근 모드(반말)와 엄격 모드(존댓말) 중 편한 걸 고르세요',
  '오늘 어땠는지 자유롭게 이야기해요. 형식 없이 생각나는 대로요',
  '몸·감정·관계 어디서 신호가 왔는지 같이 들여다봐요',
  '지금 할 수 있는 작은 것 하나를 같이 찾아요',
]
