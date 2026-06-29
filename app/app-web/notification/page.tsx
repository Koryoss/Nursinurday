import Link from 'next/link'
import { CARE_COLORS, CARE_FONT, CARE_GRADIENTS, CARE_RADIUS, CARE_SHADOW } from '@/lib/designTokens'

const SAGE = CARE_COLORS.primary
const SAGE_DARK = CARE_COLORS.primaryDark
const TEXT = CARE_COLORS.text
const TEXT_MID = CARE_COLORS.mid
const TEXT_LIGHT = CARE_COLORS.light
const BORDER = CARE_COLORS.border
const CARD = CARE_COLORS.card

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: CARE_RADIUS.lg, padding: 16 }}>
      <h2 style={{ margin: '0 0 16px', color: TEXT_MID, fontSize: 16, fontWeight: 900 }}>{title}</h2>
      {children}
    </section>
  )
}

function ReminderRow({ label, time }: { label: string; time: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, minHeight: 48, borderBottom: `1px dashed ${BORDER}` }}>
      <span style={{ color: TEXT, fontSize: 18, fontWeight: 800 }}>{label}</span>
      <strong style={{ color: SAGE_DARK, fontSize: 18 }}>{time}</strong>
    </div>
  )
}

export default function AppWebNotificationPage() {
  return (
    <main style={{ minHeight: '100dvh', background: CARE_GRADIENTS.app, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px', fontFamily: CARE_FONT }}>
      <div style={{ width: 390, height: 844, borderRadius: CARE_RADIUS.shell, background: CARE_GRADIENTS.shell, border: '1.5px solid rgba(255,255,255,0.9)', boxShadow: CARE_SHADOW.shell, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: '30px 22px 14px', borderBottom: `1px solid ${BORDER}`, margin: '0 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
            <Link href="/app-web" style={{ color: SAGE_DARK, fontSize: 17, fontWeight: 900, textDecoration: 'none' }}>홈</Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: SAGE }} />
              <span style={{ fontSize: 21, fontWeight: 900, color: SAGE_DARK }}>CareFlow</span>
            </div>
            <span style={{ width: 34 }} />
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 16px 22px', display: 'grid', gap: 16, scrollbarWidth: 'none' }}>
          <Card title="알림 시간">
            <div style={{ color: SAGE_DARK, fontSize: 64, lineHeight: 1.1, fontWeight: 400, textAlign: 'center', padding: '18px 0 22px' }}>08:00</div>
          </Card>

          <Card title="복약 시간">
            <div style={{ display: 'grid', gap: 10 }}>
              <ReminderRow label="아침" time="08:00" />
              <ReminderRow label="점심" time="12:30" />
              <ReminderRow label="저녁" time="19:00" />
            </div>
          </Card>

          <Card title="수면 연동">
            <div style={{ display: 'grid', gap: 10 }}>
              <ReminderRow label="기상 직후" time="07:00" />
              <ReminderRow label="취침 전" time="22:30" />
            </div>
          </Card>

          <button type="button" style={{ minHeight: 56, borderRadius: 18, border: `1px solid ${BORDER}`, background: CARD, color: SAGE_DARK, fontSize: 18, fontWeight: 900 }}>
            휴대폰 알람 연동
          </button>
        </div>
      </div>
    </main>
  )
}
