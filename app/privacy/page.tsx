import Link from 'next/link'
import { CARE_COLORS, CARE_FONT, CARE_GRADIENTS, CARE_RADIUS, CARE_SHADOW } from '@/lib/ui/designTokens'

const sections = [
  {
    title: '수집하는 정보',
    body: '이메일 로그인 정보, 온보딩 동의 시각, 말투 설정, 일일 기록(몸·감정·관계·수면·환경 태그), 주간 체크인, 서비스 피드백을 수집할 수 있습니다. 건강과 관련될 수 있는 기록은 사용자가 직접 입력한 자기관찰 정보입니다.',
  },
  {
    title: '이용 목적',
    body: '기록 저장, 본인 기록 조회, 개인 기준선 대비 band 표시, 추세 확인, 피드백 반영, 서비스 안정성 개선에 사용합니다. 진단, 예후 예측, 치료나 재활 처방 목적으로 사용하지 않습니다.',
  },
  {
    title: '보관과 파기',
    body: '계정이 유지되는 동안 기록을 보관합니다. 사용자가 삭제한 기록은 연결된 세부 기록과 함께 삭제되도록 설계합니다. 계정 삭제나 별도 삭제 요청이 확인되면 관련 데이터를 파기하거나 식별이 어려운 형태로 처리합니다.',
  },
  {
    title: '접근과 보호',
    body: 'Supabase Auth와 Postgres RLS를 사용해 원칙적으로 본인 행만 접근할 수 있게 제한합니다. 외부 공유는 사용자의 명시적 선택이 있을 때만 진행하는 것을 원칙으로 합니다.',
  },
  {
    title: '선택과 철회',
    body: '필수 동의가 없으면 개인 기록 기능을 사용할 수 없습니다. 피드백 제출은 선택 사항이며, 기록 삭제와 동의 철회가 필요하면 운영자에게 요청할 수 있습니다.',
  },
]

export default function PrivacyPage() {
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
        <h1 style={{ margin: '18px 0 10px', color: CARE_COLORS.text, fontSize: 30, lineHeight: 1.25 }}>개인정보처리방침</h1>
        <p style={{ margin: '0 0 26px', color: CARE_COLORS.mid, fontSize: 14, lineHeight: 1.8 }}>
          CareFlow는 사용자의 자기관찰 기록을 사용자가 다시 확인할 수 있도록 보관합니다. 본 문서는 베타 서비스 기준이며, 정식 운영 전 법률 검토와 운영 정보 보완이 필요합니다.
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
          문의: 운영자가 지정하는 공식 연락 채널을 통해 개인정보 열람·정정·삭제 요청을 접수합니다.
        </p>
      </article>
    </main>
  )
}
