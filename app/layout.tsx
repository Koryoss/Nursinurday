// =====================================================
// 루트 레이아웃 — 모든 페이지에 공통 적용
// =====================================================
import type { Metadata } from 'next'
import type { Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import FeedbackButton from './components/FeedbackButton'
import './globals.css'

export const metadata: Metadata = {
  title: 'CareFlow — 기록 기반 자기돌봄 도구',
  description: 'CareFlow는 진단이나 치료를 대체하지 않는 일상 자기돌봄 도구입니다.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
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
        <FeedbackButton />
        <Analytics />
      </body>
    </html>
  )
}
