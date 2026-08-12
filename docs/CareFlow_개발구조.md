# CareFlow 전체 개발 구조

## 0. 한눈에
- 제품(환자용): 웹 + 모바일 앱 — 비의료기기 자기돌봄 기록·지표
- 근거 인프라(창업자용): 학습 노트 + RAG + 근거 레지스트리 + 경계 검수
- 두 축을 잇는 단일 ID: **근거태깅 레지스트리 #번호**

```
[환자용 제품]                         [근거 인프라]
careflow (웹·Next.js) ─┐              논문 읽기/notes (LinkNote 노트)
careflow-app (RN·Expo) ┘─ Supabase    /study (UI) → LinkNote FastAPI(RAG·ChromaDB)
                          (기록·지표)        └ /claim → 근거태깅 레지스트리
                                             └ /audit → 경계 카피 검수
```

## 1. 환자용 제품
- **careflow/** — 웹앱(Next.js App Router·TS·Tailwind), 배포 Vercel(careflow-delta)
  - 화면: 홈(대시보드)·기록·알림·추세·온보딩·로그인·/privacy·/terms
  - 지표: 개인 7일 기준선 대비 band(낮음/보통/높음) — 임상 컷오프 없음
- **careflow-app/** — 모바일(Expo RN), 같은 Supabase 공유, OTP 로그인, 음성→기록 초안
- **공유 로직:** socialReturnIndicators(band 계산), 디자인 토큰(SPEC §4.1)

## 2. 데이터 (Supabase / Postgres+RLS)
- 마이그레이션: 0001_init(기록·지표·RLS) / 0002_feedback / 0003_affect_scores / 0004_study_rag
- 핵심 테이블: profiles · daily_logs(+symptom/affect/social/context) · sleep_logs · weekly_checkins · baselines · social_return_indicators · feedback · meaning_notes
- RLS: 본인 행만 접근

## 3. 근거 인프라
- **논문 읽기/** — 원문 PDF (메니에르·전정·자율신경 등)
- **논문 읽기/notes/** — linknote 형식 개념 노트(마크다운·[[위키링크]]·#태그·레지스트리 #)
- **/study (CareFlow 내, 로그인)** — UI 3종: 질문 채팅 · /claim(주장 근거화) · /audit(경계 린터)
- **LinkNote (study-rag-api)** — FastAPI + ChromaDB RAG **백엔드(공용)**. /study가 호출(v0.3 통합)
- **지원/CareFlow_근거태깅_레지스트리.md** — 주장→출처→근거강도→적용위치→안전도 단일 기준(17행)

## 4. 배포 / 실행
- 웹: Vercel (careflow-delta.vercel.app)
- 모바일: Expo Go / dev build
- LinkNote RAG: 로컬 `uvicorn api_server:app --port 8000` → 베타 시 Render (DEPLOY_RENDER.md)

## 5. 환경변수
- careflow/.env.local: NEXT_PUBLIC_SUPABASE_URL·ANON_KEY, (v0.3) LINKNOTE_API_URL
- careflow-app/.env: EXPO_PUBLIC_SUPABASE_URL·ANON_KEY
- study-rag-api/.env: OPENAI_API_KEY (임베딩·답변은 LinkNote가 담당 → 키는 여기 한 곳)

## 6. 규칙 / 경계 (비의료기기)
- AGENTS.md + docs/SPEC.md = 모든 도구·코드의 단일 기준
- 금지: 진단·예후·중증도 판정·치료/재활 처방·임상 컷오프
- 허용: 상태 인식 + 생활 설계 보조. 문구 "관찰·함께 볼까요". 위험 시 외부자원 연계
- 근거 '주의/약' 항목은 표현 제한(레지스트리 규칙)

## 7. 현재 상태 · 남은 일
- ✅ P0~P3 구현·웹 배포 / P4a 모바일 패리티 / 근거 레지스트리 / notes 3개 / /study RAG
- 🔧 진행: /study pdf-parse 수정(1.1.1), v0.3 LinkNote 백엔드 통합, 0004·OPENAI 키 적용
- ⏭ 다음: 웹↔모바일 parity, 교수 면담 발송, IRB·개인정보(베타 전), 음성 STT(고도화)
- 협업: 사람(제품·임상·검수) · Claude/Gemini/Cline(구현) · AGENTS.md로 규칙 고정
