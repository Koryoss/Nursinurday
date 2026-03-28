# CareFlow 🌿
**일상 간호 플랫폼**

> MVP v0.1 — API 키 없이 바로 테스트 가능

---

## 📁 프로젝트 구조

```
careflow/
├── app/
│   ├── layout.tsx          ← 전체 레이아웃 (폰트, 메타데이터)
│   ├── page.tsx            ← 랜딩 페이지 (서비스 소개)
│   ├── globals.css         ← 전역 스타일
│   ├── chat/
│   │   └── page.tsx        ← 💬 채팅 화면 (핵심 기능)
│   └── api/
│       └── chat/
│           └── route.ts    ← 🔌 AI API 라우트 (서버)
├── components/
│   ├── MessageBubble.tsx   ← 채팅 말풍선
│   └── TypingIndicator.tsx ← AI 타이핑 애니메이션
├── lib/
│   ├── nursingLogic.ts     ← 🧠 NANDA-I 간호 로직 (핵심 IP)
│   └── mockResponses.ts    ← 📝 모의 응답 데이터베이스
├── .env.example            ← 환경 변수 템플릿
├── .gitignore
├── package.json
└── tailwind.config.ts
```

---

## 🚀 VS Code에서 시작하기

### Step 1 — 필수 프로그램 설치 (처음 한 번만)

| 프로그램 | 다운로드 링크 | 설명 |
|---------|------------|------|
| Node.js | https://nodejs.org (LTS 버전) | JavaScript 실행 환경 |
| VS Code | https://code.visualstudio.com | 코드 에디터 |
| Git | https://git-scm.com | 버전 관리 |

### Step 2 — 프로젝트 열기

1. VS Code 실행
2. `파일 → 폴더 열기` → `careflow` 폴더 선택
3. VS Code 상단 메뉴 `터미널 → 새 터미널` 클릭

### Step 3 — 의존성 설치 (딱 한 번만)

```bash
npm install
```
> ☕ 1-2분 정도 걸려요. `node_modules` 폴더가 생기면 완료!

### Step 4 — 환경 변수 설정

```bash
# .env.example 파일을 복사해서 .env.local 만들기
cp .env.example .env.local
```
지금은 API 키가 없으니 그냥 두면 돼요. 자동으로 **모의 응답 모드**로 실행됩니다.

### Step 5 — 로컬 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 열기 🎉

---

## 📱 반응형 테스트 방법

VS Code에서 Chrome DevTools를 사용하면 모바일/데스크톱을 동시에 확인할 수 있어요.

1. Chrome에서 http://localhost:3000 열기
2. `F12` (개발자 도구 열기)
3. `Ctrl+Shift+M` (기기 에뮬레이션 토글)
4. 상단에서 기기 선택 (iPhone, Galaxy, iPad 등)

---

## 🔑 나중에 API 키를 얻었을 때

`.env.local` 파일을 열고:

```env
# OpenAI 사용 시
OPENAI_API_KEY=sk-...여기에_키_입력...
AI_MODE=openai

# 또는 Claude 사용 시
ANTHROPIC_API_KEY=sk-ant-...여기에_키_입력...
AI_MODE=claude
```

저장 후 서버 재시작:
```bash
# 터미널에서 Ctrl+C로 서버 종료 후
npm run dev
```

---

## 📤 GitHub에 올리기

### 처음 GitHub 저장소 만들기

1. https://github.com 로그인
2. 오른쪽 위 `+` → `New repository`
3. 이름: `careflow`, Public/Private 선택 → `Create repository`

### 코드 업로드

```bash
# 터미널에서 순서대로 실행
git init
git add .
git commit -m "feat: CareFlow MVP 초기 설정"
git branch -M main
git remote add origin https://github.com/[내_아이디]/careflow.git
git push -u origin main
```

### Vercel로 무료 배포 (선택)

1. https://vercel.com 에서 GitHub 계정으로 로그인
2. `New Project` → GitHub 저장소 선택
3. `Deploy` 클릭 → 자동으로 https://careflow-xxx.vercel.app 생성!

코드를 push할 때마다 자동으로 배포됩니다 🚀

---

## 🧠 핵심 파일 설명 (개발 공부용)

### `lib/nursingLogic.ts` — 이게 CareFlow의 핵심 IP
```
사용자 메시지
    ↓
assessMessage()   ← 키워드 분석 → NANDA-I 진단 분류
    ↓
buildSystemPrompt() ← AI에게 간호사 역할 지침 전달
```

### `app/api/chat/route.ts` — 서버와 AI의 연결 다리
```
브라우저 → POST /api/chat → AI 호출 → 응답 반환
```

### `app/chat/page.tsx` — 사용자가 보는 채팅 화면
```
useState로 메시지 목록 관리
fetch()로 /api/chat 호출
결과를 화면에 표시
```

---

## 📅 액션 플랜 연계

| 주차 | 개발 목표 | 관련 파일 |
|-----|---------|---------|
| 1주차 | 로컬 실행 + 모의 테스트 | 전체 셋업 |
| 2주차 | `nursingLogic.ts` 수정 → 나만의 간호 로직 고도화 | `lib/` |
| 3주차 | 5명 테스트 → Vercel 배포 | 배포 설정 |
| 4주차+ | API 키 연결 → 진짜 AI로 전환 | `.env.local` |

---

## ❓ 자주 묻는 질문

**Q: `npm install` 에러가 나요**
→ Node.js가 설치되어 있는지 확인: `node --version`

**Q: 포트 3000이 이미 사용 중이에요**
→ `npm run dev -- -p 3001` 로 다른 포트 사용

**Q: API 응답이 이상해요**
→ `app/api/chat/route.ts` 파일에 `console.log` 추가해서 디버깅

---

---

## ⚠️ 중요 알림: CareFlow v4.1 🚦 신호등 × "Related To" 프레임워크

**CareFlow는 의학적 진단을 하지 않습니다.**
주관적(S) + 객관적(O) 자료를 통합하여 질병과 관련된 심리적/신체적 현상을 파악하고,
자기돌봄을 지원하는 간호학적 도구입니다. 의료와 협력하여 건강 리터러시를 증진합니다.

### 🚦 신호등 × NANDA 분류

| 🚦 | NANDA 표현 | 의미 | CareFlow 응답 |
|----|-----------|------|--------------|
| 🟢 | Readiness for enhanced ~~ | 건강, 향상 의지 | 자기돌봄 강화 |
| 🟡 | Risk for ~~ | 위험 신호 감지 | 예방 모니터링 |
| 🟠 | Actual ~~ Related To | 현상 발생 | 현상 기반 지원 |
| 🔴 | Potential Complication of ~~ | 의료 필수 | 즉시 의료 연결 |

### v4.1 접근 방식 (Related To + 신호등)

**v4.0 표현 (❌ 진단처럼 들림)**
```
CareFlow: "이건 우울증입니다"
```

**v4.1 표현 (✅ 신호등 + 현상 파악)**
```
S(주관): "2주간 아무것도 안 하고 싶어요"
O(객관): 활동량 70% 감소, 수면 증가

🔴 협력문제 감지: PC: Major depression → 정신과 연결
🟠 현상 파악: "무력감과 관련된 활동 감소를 경험하고 계신 거군요"

CareFlow: "정신과 상담이 필요할 것 같아요.
동시에 🟠 자기돌봄을 함께 시작해 봐요."
```

**그 질병에 대한 인간의 반응(심리적 영향, 불안감, 생활 제약)에만 집중합니다.**

**신체 증상과 정신 증상을 동등하게 취급합니다:**

신체 증상 영역:
- ❌ 이명, 비문증, 어지럼증 진단
- ❌ 메니에르병, 편두통 진단

정신건강 영역:
- ❌ 우울증, 불안장애, 공황장애 진단
- ❌ 공황장애, PTSD 진단
- ❌ 정신증상(환청, 환각) 진단

공통 금지 사항:
- ❌ 약물 처방 또는 의학적 조언
- ❌ 의료 진단명 제시

허용되는 CareFlow 역할:
- ✅ 증상으로 인한 심리적 어려움을 함께 관찰
- ✅ 일상에서의 자기돌봄 방법 제시
- ✅ 신체/정신 건강 전문가 상담 권유

**심각한 정신건강 문제나 신체 증상이 있으시면 반드시 전문의와 상담하세요.**
- 🆘 자살 위험: 1393 (자살예방상담전화)
- 🆘 정신건강 위기: 1577-0199 (정신건강위기상담전화)
