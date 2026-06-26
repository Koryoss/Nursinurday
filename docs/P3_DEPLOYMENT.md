# CareFlow P3 배포 체크리스트

## Vercel 환경변수
Vercel 프로젝트 Settings → Environment Variables에 아래 값을 등록한다.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

값은 로컬 `.env.local`의 공개 Supabase 값과 동일하게 맞춘다. 비밀키나 service role key는 프론트엔드 환경변수로 등록하지 않는다.

## Supabase Auth URL
Vercel 배포 후 생성된 도메인을 Supabase Dashboard → Authentication → URL Configuration에 등록한다.

- Site URL: `https://<vercel-domain>`
- Redirect URLs:
  - `https://<vercel-domain>/auth/callback`
  - 로컬 확인용이 필요하면 `http://localhost:3000/auth/callback`

## 배포 후 확인
- `/`에서 베타 소개와 시작하기 CTA 확인
- `/login`에서 Magic Link 발송 확인
- 이메일 링크가 `/auth/callback`을 거쳐 동의 완료 사용자는 `/explore`, 동의 전 사용자는 `/onboarding`으로 이동하는지 확인
- `/privacy`, `/terms` 접근 확인
- 로그인 후 우하단 `의견` 버튼으로 feedback 저장 확인
