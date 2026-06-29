import Link from 'next/link'
import { CARE_COLORS, CARE_FONT, CARE_GRADIENTS, CARE_RADIUS, CARE_SHADOW } from '@/lib/designTokens'

const SAGE = CARE_COLORS.primary
const SAGE_DARK = CARE_COLORS.primaryDark
const TEXT = CARE_COLORS.text
const TEXT_MID = CARE_COLORS.mid
const TEXT_LIGHT = CARE_COLORS.light
const BORDER = CARE_COLORS.border
const CARD = CARE_COLORS.card

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ minHeight: '100dvh', background: CARE_GRADIENTS.app, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px', fontFamily: CARE_FONT }}>
      <div style={{ width: 390, height: 844, borderRadius: CARE_RADIUS.shell, background: CARE_GRADIENTS.shell, border: '1.5px solid rgba(255,255,255,0.9)', boxShadow: CARE_SHADOW.shell, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: '30px 22px 14px', borderBottom: `1px solid ${BORDER}`, margin: '0 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: SAGE }} />
              <span style={{ fontSize: 21, fontWeight: 900, color: SAGE_DARK }}>CareFlow</span>
            </div>
            <span style={{ color: TEXT_LIGHT, fontSize: 17, fontWeight: 800 }}>새로고침</span>
          </div>
        </header>
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 16px 22px', display: 'grid', gap: 14, scrollbarWidth: 'none' }}>
          {children}
        </div>
      </div>
    </main>
  )
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: CARE_RADIUS.lg, padding: 16 }}>
      {title ? <h2 style={{ margin: '0 0 12px', color: TEXT, fontSize: 18, fontWeight: 900 }}>{title}</h2> : null}
      {children}
    </section>
  )
}

function Band({ title, label, muted }: { title: string; label: string; muted?: boolean }) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <strong style={{ color: TEXT, fontSize: 20 }}>{title}</strong>
        <span style={{ borderRadius: 999, padding: '6px 13px', color: '#fff', background: muted ? '#7E9AA0' : SAGE, fontSize: 15, fontWeight: 900 }}>{label}</span>
      </div>
      <div style={{ position: 'relative', height: 14 }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 4, height: 10, borderRadius: 999, background: '#ECF1EC' }} />
        <div style={{ position: 'absolute', left: label === '낮음' ? '28%' : '55%', top: -2, width: 5, height: 24, borderRadius: 999, background: TEXT }} />
      </div>
    </div>
  )
}

export default function AppWebHomePage() {
  return (
    <Shell>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Link href="/app-web/record" style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '13px 14px', color: SAGE_DARK, fontSize: 15, fontWeight: 900, textAlign: 'center', textDecoration: 'none' }}>기록하기</Link>
        <Link href="/app-web/notification" style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '13px 14px', color: SAGE_DARK, fontSize: 15, fontWeight: 900, textAlign: 'center', textDecoration: 'none' }}>알림설정</Link>
      </div>

      <Card title="오늘의 지표">
        <p style={{ margin: '0 0 12px', color: TEXT_LIGHT, fontSize: 13, fontWeight: 800 }}>기준일 2026-06-22</p>
        <div style={{ display: 'grid', gap: 14 }}>
          <Band title="오늘의 여유" label="보통" />
          <Band title="걸음 안정도" label="낮음" muted />
          <Band title="활동 범위" label="보통" />
        </div>
      </Card>

      <Card title="오늘 저장된 기록">
        <p style={{ margin: 0, color: TEXT_MID, fontSize: 16, lineHeight: 1.65, fontWeight: 700 }}>
          아침 · 몸 신호 2개<br />
          수면 · 23:00 ~ 07:00
        </p>
      </Card>

      <Card title="누적 기록 그래프">
        <div style={{ height: 96, display: 'flex', alignItems: 'flex-end', gap: 10, margin: '6px 4px 8px' }}>
          {[42, 55, 50, 68].map((height, index) => <span key={index} style={{ flex: 1, height: `${height}%`, minHeight: 28, borderRadius: '6px 6px 0 0', background: '#D6E2D6' }} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, color: TEXT_LIGHT, fontSize: 13, fontWeight: 800, textAlign: 'center' }}>
          <span>1주</span><span>2주</span><span>3주</span><span>4주</span>
        </div>
      </Card>

      <Card title="관찰된 연관">
        <p style={{ margin: 0, color: TEXT_MID, fontSize: 16, lineHeight: 1.65, fontWeight: 700 }}>
          걷기 불안과 두통이 <strong style={{ color: TEXT }}>함께 오르내리는 흐름</strong>이 관찰돼요.
        </p>
      </Card>
    </Shell>
  )
}
