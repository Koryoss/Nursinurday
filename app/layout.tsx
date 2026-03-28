// =====================================================
// 루트 레이아웃 — 모든 페이지에 공통 적용
// =====================================================
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CareFlow — 일상 간호',
  description: '간호학 기반 AI가 당신의 일상 스트레스를 함께 돌봐드립니다.',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="bg-surface min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
