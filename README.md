# CareFlow

CareFlow는 어지럼, 이명, 수면, 감정, 관계 기록을 바탕으로 일상 회복 흐름을 함께 관찰하는 웹/앱 프로토타입입니다.

이 저장소는 CareFlow의 웹, 앱 미러 웹, 스터디 워크스페이스, Expo 앱을 함께 관리하는 통합 저장소입니다.

## 현재 구조

### 1. 기존 웹

배포된 웹사이트 버전입니다.

- 운영/배포 기준 URL: https://careflow-delta.vercel.app/
- 주요 라우트:
  - `/`
  - `/dashboard`
  - `/explore`
  - `/notification`
  - `/chat`
  - `/history`
  - `/login`
  - `/onboarding`

기존 웹은 Vercel 배포 화면과 연결되는 트랙입니다. 앱 화면을 그대로 따라가는 작업은 이 라우트에 바로 섞지 않습니다.

### 2. Expo 앱

실제 앱 화면과 기능을 구현하는 React Native/Expo 프로젝트입니다.

- 위치: `careflow-app/`
- 주요 화면:
  - `careflow-app/src/screens/DashboardScreen.tsx`
  - `careflow-app/src/screens/RecordScreen.tsx`
  - `careflow-app/src/screens/NotificationScreen.tsx`
  - `careflow-app/src/screens/ChatScreen.tsx`
- 공통 컴포넌트:
  - `careflow-app/src/components/AppHeader.tsx`
  - `careflow-app/src/components/BottomNav.tsx`
- 지표 로직:
  - `careflow-app/src/lib/socialReturnIndicators.ts`

앱 화면이 CareFlow의 기준 화면입니다.

### 3. 앱 미러 웹

Expo 앱 화면과 같은 내용을 웹에서 확인하기 위한 별도 트랙입니다.

- 주요 라우트:
  - `/app-web`
  - `/app-web/record`
  - `/app-web/notification`

작업 원칙:

1. 앱 화면을 먼저 수정합니다.
2. 앱 변경사항을 확인합니다.
3. 같은 내용을 `/app-web/*`에 반영합니다.
4. 기존 웹 라우트와 `/study` 라우트는 별도로 유지합니다.

### 4. 스터디 워크스페이스

연구계획서, 근거 문헌, claim/audit 흐름을 다루는 별도 화면입니다.

- 주요 라우트:
  - `/study`
  - `/study/claim`
  - `/study/audit`
- 주요 API:
  - `/api/study/query`
  - `/api/study/claim`
  - `/api/study/claim/save`
  - `/api/study/audit`
  - `/api/study/docs`
  - `/api/study/ingest`
- 근거 레지스트리:
  - `lib/evidenceRegistry.ts`

스터디 화면은 CareFlow 앱/웹 UI와 별개로 동작합니다.

## 프로젝트 디렉터리

```txt
careflow/
├── app/
│   ├── page.tsx
│   ├── dashboard/
│   ├── explore/
│   ├── notification/
│   ├── app-web/
│   │   ├── page.tsx
│   │   ├── record/
│   │   └── notification/
│   ├── study/
│   │   ├── page.tsx
│   │   ├── claim/
│   │   └── audit/
│   └── api/
│       ├── chat/
│       ├── indicators/
│       ├── weekly-checkins/
│       └── study/
├── careflow-app/
│   ├── App.tsx
│   ├── app.json
│   ├── assets/
│   ├── src/
│   │   ├── components/
│   │   ├── constants/
│   │   ├── lib/
│   │   ├── screens/
│   │   └── types/
│   ├── package.json
│   └── tsconfig.json
├── lib/
│   ├── designTokens.ts
│   ├── socialReturnIndicators.ts
│   └── evidenceRegistry.ts
└── README.md
```

## 그래프 표시 원칙

누적 기록 그래프는 실제 기록된 데이터만 사용합니다.

- 빈 주차를 임의로 만들지 않습니다.
- 실제 값이 없는 지표는 중간값으로 보정해 표시하지 않습니다.
- `시작 ~ 최근` 같은 모호한 문구 대신 실제 기록 날짜 또는 실제 기록 주 범위를 기준으로 표시합니다.
- 기록이 없으면 fallback 그래프가 아니라 “아직 그래프로 볼 기록이 없어요.” 문구를 표시합니다.

## 의료/안전 원칙

CareFlow는 의료기기가 아니며 의학적 진단을 제공하지 않습니다.

- 질병명 진단, 정상/비정상 판정, 약물 처방을 하지 않습니다.
- 사용자의 기록과 흐름을 자기관찰 목적으로 보여줍니다.
- 증상이나 불안이 큰 경우 의료진 또는 외부 자원 연결을 우선 안내합니다.

## 개발 명령어

웹:

```bash
npm install
npm run dev
npm run build
```

로컬 개발 서버 기본 주소:

```txt
http://localhost:3001
```

필요 시 포트를 지정해 실행합니다.

```bash
npm run dev -- --hostname 127.0.0.1 --port 3001
```

앱:

```bash
cd careflow-app
npm install
npx expo start
npx tsc --noEmit
```

## GitHub 업로드 기준

변경사항은 가능하면 다음 단위로 분리해 커밋합니다.

1. 기존 웹 변경
2. Expo 앱 변경
3. 앱 미러 웹 변경
4. 스터디 워크스페이스 변경
5. README/문서 변경

현재 원격 저장소:

```txt
https://github.com/Koryoss/Nursinurday.git
```

이전 별도 앱 저장소인 `Koryoss/careflow-app`은 더 이상 기준 저장소로 사용하지 않습니다.
