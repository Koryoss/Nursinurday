import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // CareFlow 브랜드 컬러 — 수국 버터크림 팔레트 (밝은 베이지)
      colors: {
        primary: {
          DEFAULT: '#F0E2C0',   // 따뜻한 베이지 (카드/섹션)
          dark: '#FFFBF3',      // 밝은 크림 (페이지 배경)
          light: '#FFFEF9',     // 거의 화이트인 크림
        },
        accent: '#28C840',       // macOS green (포인트 버튼·강조)
        surface: '#FFF8EC',      // 연한 버터 (카드 배경)
        mocha: {
          DEFAULT: '#3D2B1F',   // 텍스트 메인
          light: '#8B6F57',     // 텍스트 보조
          deep: '#2C1C10',      // 텍스트 강조
        },
        honey: {
          DEFAULT: '#D4A843',   // 골든 허니
          light: '#F0CF82',     // 연한 허니
          dark: '#B8860B',      // 진한 허니
        },
        beige: {
          DEFAULT: '#EAD9BA',   // 보더
          light: '#F5EDD8',     // 연한 보더
        },
      },
      // 폰트
      fontFamily: {
        sans: ['var(--font-inter)', 'Noto Sans KR', 'sans-serif'],
      },
      // 모바일 우선 breakpoint (기본 Tailwind와 동일)
      // sm: 640px, md: 768px, lg: 1024px, xl: 1280px
    },
  },
  plugins: [],
}
export default config
