import Link from 'next/link'
import { CARE_COLORS, CARE_FONT, CARE_GRADIENTS, CARE_RADIUS, CARE_SHADOW } from '@/lib/designTokens'

const sections = [
  {
    title: '서비스 성격',
    body: 'CareFlow는 비의료기기 자기관찰 도구입니다. 사용자가 입력한 기록을 정리하고 개인 기준선 대비 흐름을 함께 볼 수 있도록 돕습니다.',
  },
  {
    title: '의료 면책',
    body: 'CareFlow는 진단, 중증도 판정, 예후 예측, 치료·재활 처방을 제공하지 않습니다. 증상이 갑자기 악화되거나 응급 상황이 의심될 때는 서비스 대신 의료진이나 지역 응급 자원과 함께 확인해 주세요.',
  },
  {
    title: '사용자 책임',
    body: '입력한 기록의 정확성은 사용자의 상황에 따라 달라질 수 있습니다. CareFlow의 화면과 문구는 생활 설계와 자기 이해를 돕는 참고 자료로만 사용해 주세요.',
  },
  {
    title: '베타 운영',
    body: '베타 기간에는 화면, 기능, 데이터 구조가 변경될 수 있습니다. 서비스 안정성 개선을 위해 오류와 피드백을 확인할 수 있습니다.',
  },
  {
    title: '계정과 데이터',
    body: '로그인한 사용자는 본인 기록을 저장하고 조회할 수 있습니다. 데이터 처리 기준은 개인정보처리방침을 따릅니다.',
  },
]

export default function TermsPage() {
  return (
    <main style={{ minHeight: '100dvh', background: CARE_GRADIENTS.app, fontFamily: CARE_FONT, padding: '36px 18px' }}>
      <article
        style={{
          maxWidth: 820,
          margin: '0 auto',
          background: CARE_COLORS.card,
          border: `1px solid ${CARE_COLORS.border}`,
          borderRadius: CARE_RADIUS.lg,
          boxShadow: CARE_SHADOW.card,
          padding: '30px 24px',
        }}
      >
        <Link href="/" style={{ color: CARE_COLORS.primaryDark, fontSize: 13, fontWeight: 900, textDecoration: 'none' }}>
          CareFlow
        </Link>
        <h1 style={{ margin: '18px 0 10px', color: CARE_COLORS.text, fontSize: 30, lineHeight: 1.25 }}>이용약관 및 면책</h1>
        <p style={{ margin: '0 0 26px', color: CARE_COLORS.mid, fontSize: 14, lineHeight: 1.8 }}>
          본 약관은 CareFlow 베타 서비스 이용 기준을 설명합니다.
        </p>

        <div style={{ display: 'grid', gap: 16 }}>
          {sections.map(section => (
            <section key={section.title} style={{ borderTop: `1px solid ${CARE_COLORS.border}`, paddingTop: 16 }}>
              <h2 style={{ margin: '0 0 8px', color: CARE_COLORS.text, fontSize: 17 }}>{section.title}</h2>
              <p style={{ margin: 0, color: CARE_COLORS.mid, fontSize: 14, lineHeight: 1.85 }}>{section.body}</p>
            </section>
          ))}
        </div>

        <p style={{ margin: '28px 0 0', color: CARE_COLORS.light, fontSize: 12, lineHeight: 1.7 }}>
          개인정보 처리 기준은 <Link href="/privacy" style={{ color: CARE_COLORS.primaryDark, fontWeight: 900 }}>개인정보처리방침</Link>에서 함께 확인할 수 있습니다.
        </p>
      </article>
    </main>
  )
}
