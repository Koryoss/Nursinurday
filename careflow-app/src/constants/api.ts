// 웹(Next.js, careflow-web)에 배포된 API를 모바일 앱에서 호출하기 위한 베이스 URL.
// EXPO_PUBLIC_API_URL이 없으면 운영 배포 URL로 폴백한다 (README 기준: careflow-delta.vercel.app).
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://careflow-delta.vercel.app'
