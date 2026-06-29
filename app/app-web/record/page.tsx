import Link from 'next/link'
import { CARE_COLORS, CARE_FONT, CARE_GRADIENTS, CARE_RADIUS, CARE_SHADOW } from '@/lib/designTokens'

const SAGE = CARE_COLORS.primary
const SAGE_DARK = CARE_COLORS.primaryDark
const TEXT = CARE_COLORS.text
const TEXT_MID = CARE_COLORS.mid
const TEXT_LIGHT = CARE_COLORS.light
const BORDER = CARE_COLORS.border
const CARD = CARE_COLORS.card

function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: CARE_RADIUS.lg, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <h2 style={{ margin: 0, color: TEXT, fontSize: 18, fontWeight: 900 }}>{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

function ScaleRow({ label, helper }: { label: string; helper: string }) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <strong style={{ color: TEXT, fontSize: 15 }}>{label}</strong>
          <p style={{ margin: '3px 0 0', color: TEXT_LIGHT, fontSize: 12, fontWeight: 700 }}>{helper}</p>
        </div>
        <strong style={{ color: SAGE_DARK, fontSize: 16 }}>0</strong>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: '#ECF1EC' }} />
    </div>
  )
}

export default function AppWebRecordPage() {
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

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 16px 22px', display: 'grid', gap: 14, scrollbarWidth: 'none' }}>
          <Section title="기록 날짜">
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: '13px 14px', color: TEXT, background: '#fff', fontSize: 15, fontWeight: 900 }}>2026-06-29</div>
          </Section>

          <Section title="기록 시점">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {['아침', '오후', '저녁', '잠들기 전'].map((item, index) => (
                <button key={item} type="button" style={{ border: `1px solid ${index === 0 ? SAGE : BORDER}`, borderRadius: 14, padding: '12px 8px', background: index === 0 ? 'rgba(163,177,138,0.18)' : '#fff', color: index === 0 ? SAGE_DARK : TEXT_MID, fontSize: 13, fontWeight: 900 }}>{item}</button>
              ))}
            </div>
          </Section>

          <Link href="/chat" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '14px 16px', background: 'rgba(255,255,255,0.82)', color: TEXT, textDecoration: 'none' }}>
            <div>
              <div style={{ color: TEXT, fontSize: 16, fontWeight: 900 }}>음성으로 기록해 보세요</div>
              <div style={{ marginTop: 4, color: TEXT_LIGHT, fontSize: 12, lineHeight: 1.5, fontWeight: 700 }}>말로 남기고, 확인한 뒤 저장해요.</div>
            </div>
            <span style={{ color: SAGE_DARK, fontSize: 13, fontWeight: 900 }}>시작</span>
          </Link>

          <Section title="일일기록">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
              {['몸', '감정', '관계', '환경'].map((item, index) => (
                <button key={item} type="button" style={{ border: `1px solid ${index === 0 ? SAGE : BORDER}`, borderRadius: 14, padding: '12px 4px', background: index === 0 ? 'rgba(163,177,138,0.18)' : '#fff', color: index === 0 ? SAGE_DARK : TEXT_MID, fontSize: 13, fontWeight: 900 }}>{item}</button>
              ))}
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              <ScaleRow label="어지럼" helper="심할수록 10에 가깝게" />
              <ScaleRow label="걷기불안" helper="심할수록 10에 가깝게" />
            </div>
          </Section>

          <button type="button" style={{ border: 'none', borderRadius: 16, padding: '15px 16px', background: SAGE, color: '#fff', fontSize: 15, fontWeight: 900 }}>기록 저장</button>

          <Section title="수면" aside={<span style={{ color: TEXT_LIGHT, fontSize: 11, fontWeight: 800 }}>아침 30초</span>}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: '12px', background: '#fff', color: TEXT_MID, fontWeight: 800 }}>취침 --:--</div>
              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: '12px', background: '#fff', color: TEXT_MID, fontWeight: 800 }}>기상 --:--</div>
            </div>
            <button type="button" style={{ width: '100%', border: 'none', borderRadius: 14, padding: '13px 14px', background: SAGE_DARK, color: '#fff', fontSize: 13, fontWeight: 900 }}>수면 저장</button>
          </Section>
        </div>
      </div>
    </main>
  )
}
