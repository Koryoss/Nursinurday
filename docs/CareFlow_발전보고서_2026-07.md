# CareFlow 프로젝트 발전 보고서

**기간:** 2026년 4월 ~ 7월 초
**작성일:** 2026-07-02 (개정 2판)
**작성자:** 정유진

---

## 1. 프로젝트 개요

### 1.1 목표

CareFlow는 이명·어지럼(메니에르병, PPPD 등 전정계 질환) 환자가 증상을 안고도 일상과 사회로 복귀하도록 돕는 **개인 기준선(Personal Baseline) 기반 디지털 헬스케어 플랫폼(비의료기기)** 이다. 사용자가 자신의 상태를 스스로 이해하고, 오늘 할 수 있는 행동을 선택하도록 지원하는 것을 목표로 한다.

### 1.2 핵심 설계 원칙 (비의료기기 경계)

- **금지:** 진단, 중증도 판정, 예후 예측, 치료·재활(VRT 등) 처방, 임상 컷오프 적용
- **허용:** 상태 인식(self-awareness) + 생활 설계(lifestyle planning) 보조
- **비교 기준:** 일반 인구 평균이 아닌 **"평소의 나"(개인 7일 기준선)** 대비 상대값
- **안전망:** 위기 신호(급성 악화, 정서 위기 등) 감지 시 지표 제시 대신 의료진·외부자원(1393, 1577-0199 등) 연계 우선

이 원칙은 `docs/SPEC.md`와 `AGENTS.md`에 단일 기준(Single Source of Truth)으로 명문화되어 있으며, 모든 코드·카피·DB 스키마가 이를 따른다. `/study/audit`(경계 린터)로 서비스 문구가 경계를 벗어나지 않는지 자체 검수하는 체계까지 구축했다.

### 1.3 발전 방향 요약

최근 3개월간 CareFlow는 단순 기록 앱에서 다음의 5단계 흐름을 갖춘 시스템으로 발전했다.

```
Observation (기록)
      ↓
Structuring (구조화)
      ↓
Personal Baseline (개인 기준선)
      ↓
Self-awareness (자가 상태 인식)
      ↓
Lifestyle Planning (생활 설계)
```

초기의 "기록 → 저장" 수준에서, 기록이 분석 가능한 데이터로 구조화되고, 개인 기준선과 비교되어 상태 인식으로 이어지며, 궁극적으로 생활 설계를 지원하는 파이프라인으로 확장되었다.

---

## 2. 단계별 발전 내용

### 2.1 기록 시스템 구축 — Observation

**문제 정의:** 꾸준한 기록 없이는 이후의 분석과 자기관리가 불가능하다. 특히 주 사용자층(50–60대)의 기록 부담을 최소화해야 한다.

**구현 내용 (구현 완료):**

- **4축 + 안전 레이어 기록 구조:** 몸(어지럼·걷기 불안·이명·두통·비문증, 0–10) / 감정(불안·긴장 + 선택 감정 신호, 0–10) / 관계(이해받음 Y/N) / 의미(주 1회 메모) + 수면(취침·기상 + PSQI 3문항) + 환경 태그(소음·기온차·붐빔)
- **기록 시점 설계:** 하루 4구간(아침/오후/저녁/취침 전) + 급성 악화 시 즉시 기록
- **주 1회 체크인:** DHI·THI·HADS·VSS-SF 표준 척도 — 추세 확인용이며 판정에 사용하지 않음
- **음성 기반 기록 초안:** 자연어 발화("오늘 아침에 어지럼이 심했어")를 증상·감정·맥락으로 파싱하는 규칙 기반 엔진 구현 (`lib/voice/voiceDraft.ts` + 동의어 사전 `voiceDraftSynonyms.ts`). 불확실 항목은 `needsConfirmation`으로 사용자 확인을 거치도록 설계
- **이모지+핵심어 탭 UI:** 체크리스트형 입력을 탭형 UI로 전환해 기록 부담을 낮춤
- **접근성 기준:** 본문 15–16px 이상, 터치 영역 44px 이상 등 50–60대 기준 접근성 규격을 SPEC에 고정

**의미:** 프로젝트의 시작점인 관찰(Observation)을 디지털화하고, 기록 부담을 낮추는 UX(음성·탭 입력)까지 실제 코드로 구현했다.

### 2.2 데이터 구조화 — Structuring

**문제 정의:** 기록을 저장만 해서는 사용자가 자신의 상태를 이해할 수 없다. 분석 가능한 데이터 모델이 필요하다.

**구현 내용 (구현 완료):**

- **정규화된 관계형 스키마 (Supabase/PostgreSQL):** 기록을 단일 텍스트가 아닌 도메인별 테이블로 분해
  - `daily_logs` (기록 세션) → `symptom_scores`(몸), `affect_logs`·`affect_scores`(감정), `social_logs`(관계), `context_tags`(환경), `sleep_logs`(수면), `meaning_notes`(의미), `weekly_checkins`(임상척도 추세)
- **자기보고 스키마 타입 정의:** 이명(소리 유형·강도·주기·트리거)·비문증(가시성·조명 조건) 등 센서로 감지 불가능한 증상의 자기보고 구조를 TypeScript 타입으로 명세 (`lib/domain/selfReportSchema.ts`, ICD-10/KCD 코드 참조)
- **Row Level Security(RLS):** 모든 테이블에 본인 행만 접근 가능한 정책 적용 — 민감정보 최소 수집 원칙과 함께 데이터 보호 기반 마련
- **마이그레이션 체계:** `0001_init` → `0005_evidence_claims`까지 버전 관리되는 스키마 진화

**의미:** 단순 메모가 아니라 개인 기준선 분석이 가능한 데이터 기반을 마련했다.

### 2.3 개인 기준선 중심 전환 — Personal Baseline

**문제 정의:** 기존 헬스케어 서비스는 일반 평균과 비교하지만, CareFlow는 "평소의 나와 비교"를 목표로 한다.

**구현 내용 (핵심 로직 구현 완료, 분석 고도화 진행 중):**

- **7일 롤링 기준선 엔진 (`lib/domain/socialReturnIndicators.ts`):** 지표별 7일 이동 평균·표준편차(`rolling7_mean`, `rolling7_sd`)를 산출하고, 오늘 값을 기준선 대비 3단계 밴드(낮음/보통/높음)로 분류. 절대 임상 컷오프를 사용하지 않음
- **사회복귀 지표 4종 설계:** 오늘의 여유(HRV 예정) · 걸음 안정도(IMU 예정) · 활동 범위(융합) · 환경 민감도 — 모두 본인 기준선 대비 상대값
- **증상 간 상관 분석 구조:** 증상 쌍의 동행/역행 방향(`together`/`opposite`)과 표본 수를 함께 제시하는 `CorrelationItem` 타입 구현 — "상관 ≠ 인과" 원칙에 따라 방향성만 관찰 언어로 표현
- **데이터 저장:** `baselines`, `social_return_indicators` 테이블 및 `/api/indicators` API 라우트

**의미:** 평균 기반 관리에서 개인 기준 관리로의 방향 전환을 개념 수준이 아니라 계산 로직과 DB 스키마 수준에서 확정했다.

### 2.4 자가 상태 인식 — Self-awareness

**문제 정의:** AI가 상태를 판단하는 것이 아니라, 사용자가 스스로 이해하도록 돕는 것이 목표다.

**구현 내용 (구현 완료):**

- **대시보드(홈):** 4축 상태를 개인 기준 대비로 보여주는 화면. iOS 17 디자인 시스템(Sage Green·Glassmorphism) 기반으로 고도화
- **추세 시각화:** 날짜별 기록 조회 + 회복 추세 그래프 (`TrendPoint` 기반)
- **AI 대화 (`/api/chat`):** 응답 구조를 "관찰 문장 + 기록으로 이어지는 질문"으로 고정. 진단명·예후·처방 표현을 응답 구조에서 배제하고, 관찰 영역(Sleep, EmotionFlow, Tension, Relationship 등 10개 도메인)으로 분류
- **위기 감지 안전 레이어:** 대화 최우선 순위로 위기 수준을 4단계(critical/urgent/monitor/none) 평가, critical 시 자살예방상담전화(1393) 즉시 안내 (`lib/domain/nursingLogic.ts`)
- **AI 모드 추상화:** mock(키 불필요, MVP) / OpenAI GPT-4o / Anthropic Claude 3중 백엔드 전환 구조

**의미:** 비의료기기로서 '해석·판정'이 아니라 '상태 인식'을 지원하는 방향을 화면과 대화 설계 양쪽에서 구체화했다.

### 2.5 생활 설계 지원 — Lifestyle Planning

**문제 정의:** 상태를 아는 것에서 끝나지 않고, 사용자가 스스로 생활을 조정하도록 돕는다.

**진행 내용 (설계 및 초기 구현):**

- **센서 수집 API 선행 구현:** `/api/sensors/healthkit`(HRV 등), `/api/sensors/dizziness` 라우트 구축
- **watchOS 프로토타입 (CareFlowWatch, Swift/SwiftUI):** `MotionSensorManager`(IMU), `WatchDizzinessDetector`(어지럼 감지), `VoiceDecibelMonitor`(환경 소음), `LocationTracker` 등 센서 모듈 초기 구현 — 걸음 안정도·환경 민감도 지표의 데이터 소스
- **향후 설계 확정:** HRV 활용(오늘의 여유), IMU 활용(걸음 안정도), 일정 연동, 활동 가능 범위 제안
- **표현 원칙:** AI가 결정을 대신하지 않고 "고려해보세요 / 함께 볼까요" 형태의 제안형 언어만 사용

**의미:** AI가 결정을 대신하는 것이 아니라 사용자의 생활 설계를 지원하는 Wellness 플랫폼으로 방향을 확정하고, 이를 위한 센서 인프라를 선행 구축했다.

### 2.5b 베타 배포 준비 (7월 초)

연구계획서의 3대 가설(① 지속 기록 가능한가 ② 개인 기준선 시각화가 상태 인식을 돕는가 ③ 정보가 생활 조정에 도움이 되는가)을 실제 사용자로 검증하기 위해, 모바일 앱(Expo)의 **Closed Beta 배포 준비**를 진행했다.

- **EAS 빌드 설정:** Expo Go 개발 환경을 배포 가능한 APK로 전환. `eas.json`(preview/production 프로필, 내부 배포용 APK), `app.json`에 android package·versionCode·EAS projectId 추가
- **사용성 로깅 인프라:** H1(지속 기록 가능성) 검증을 위한 사용성 이벤트 수집. `usage_events` 테이블 마이그레이션(0006, RLS 적용)과 fire-and-forget 로깅 모듈(`usageLog.ts`)로 화면 진입·기록 시작/저장/이탈·소요 시간을 수집. 앱 흐름을 막지 않도록 실패 시 조용히 무시
- **버전·브랜치 체계:** v0.8 Prototype → v0.9 Closed Beta → v1.0 Pilot 로드맵과 `beta/v0.9`·`feature/*` 브랜치 구조 정리

**의미:** "설계와 로드맵"에 머물던 검증 가설을 실제 사용자 데이터로 확인할 수 있는 배포·측정 기반을 마련했다.

### 2.6 LinkNote — 지식 연결 엔진 구축

**문제 정의:** 프로젝트를 진행하며 기록 데이터 외에 논문·PDF·학습 자료·메모를 함께 활용할 필요가 생겼다. 이에 CareFlow에서 Knowledge Layer를 분리해 **LinkNote**를 독립 프로젝트로 구축했다.

**구현 내용:**

- **PDF 기반 RAG 파이프라인:** PDF 업로드 → 텍스트 추출(pdf-parse) → 청크 분할 → 임베딩(OpenAI `text-embedding`, 1536차원) → 벡터 저장 → 유사도 검색
- **이중 벡터 저장소:** LinkNote 백엔드(FastAPI + ChromaDB, 로컬/Render 배포)와 CareFlow 내장형(Supabase pgvector, `study_docs`·`study_chunks` + IVFFlat 인덱스 + `match_study_chunks` 코사인 유사도 함수)
- **검색과 AI 응답 분리 UX:** Search-only 모드(근거 청크만 반환)와 AI 응답 모드를 분리 — 근거 없는 생성 응답을 방지
- **근거태깅 레지스트리 (`evidence_claims`):** 주장 → 출처(문서·페이지) → 유사도 → 근거강도(강/중/약/출처 미확인) → 적용위치 → 안전 노트를 단일 ID로 관리. `/study/claim`에서 주장을 근거화하고 본인 확인 후 수동 저장
- **경계 검수 도구 (`/study/audit`):** 서비스 문구가 비의료기기 경계(진단·처방 표현 금지)를 위반하는지 검수하는 린터
- **Concept 연결 노트:** `논문 읽기/notes/`에 [[위키링크]]·#태그·레지스트리 번호로 연결되는 개념 노트(내림프수종, 자율신경_HRV, 전정계_VOR 등) 축적

**의미:** 제품(환자용)과 근거 인프라(창업자용)를 분리하되 **레지스트리 번호**라는 단일 ID로 연결하는 이중 구조를 완성했다. 향후 CareFlow에서 사용자 기록과 관련 근거 정보를 연결하는 기반 기술로 확장 가능하다.

### 2.7 LinkNote 심화 — RAG에서 학습 전략 엔진으로 (7월 초)

지식 연결 엔진 LinkNote가 "검색·정리 도구"를 넘어 **간격 반복(spaced repetition) 기반 학습 시스템**으로 발전했다. 이는 CareFlow의 "기록 → 상태 인식 → 생활 설계" 철학과 같은 구조를 학습 영역에 적용한 것이다.

**구현 완료:**

- **개인 학습 상태 모델:** 개념마다 학습 상태(NEW/LEARNING/REVIEW/MASTERED)와 복습 우선순위(review_priority)를 마지막 설명 경과일·미연결 개념(missing links) 기반으로 산출. CareFlow의 "개인 기준선"과 동일한 발상 — 일반 정답률이 아니라 **본인의 학습 이력 대비** 지금 무엇을 복습할지 판단
- **학습 큐 중심 UI 전환:** 개념 그래프(Full Knowledge Map)를 "지도 먼저"에서 **"오늘의 학습 큐 먼저"**로 재설계. 우선순위 상위 개념을 순위 리스트로 보여주고, 각 항목에 상태 배지와 "왜 지금 복습해야 하는지" 근거를 한 줄로 표시. 지도는 과목별 색 구분 탐색 도구로 역할 재정의
- **학습 세션 흐름:** 개념을 하나씩 "설명해보기"로 진행하는 세션 API(`/learning-session/*`)
- **SM-2 간격 반복:** "다시/애매/알아요" 응답을 SM-2 알고리즘으로 처리해 다음 복습일(due date)을 계산하는 스케줄 엔진(`/review/grade`, `/review/due`). 기존 휴리스틱과 하위호환 유지
- **Learning Memory·My Page 정리:** 흩어져 있던 복습 제안·필터·AI 요약을 통합하고, 개발자용 내부 지표를 숨겨 학습자 중심 화면으로 정돈

**협업 구조:** 화면·표현 레이어(학습 큐, 카드, 색 구분)와 문서는 Claude가, 학습 상태 계산·세션·간격 반복 로직은 Codex가 담당하는 역할 분담(`TEAM_ROLES.md`)으로 진행했다. 방향 설계(스펙 문서 `COPILOT_PROMPT_learning_sessions.md`) → 화면 선행 구현 → 엔진 구현의 순서로 이어졌다.

**의미:** LinkNote가 CareFlow의 방법론(개인 기준선·상태 인식·다음 행동 제안)을 학습 도메인에서 독립적으로 검증하는 자매 프로젝트가 되었다.

---

## 3. 개발 구조 (Technical Architecture)

### 3.1 전체 아키텍처

```
┌──────────────── 환자용 제품 ────────────────┐  ┌──────────── 근거 인프라 ────────────┐
│                                              │  │                                      │
│  careflow/        careflow-app/  CareFlow-   │  │  논문 읽기/         LinkNote         │
│  (웹, Next.js 14) (모바일, Expo  Watch/      │  │  ├ 원문 PDF        (study-rag-api)   │
│  App Router·TS    RN 0.81·TS)   (watchOS,    │  │  └ notes/ 개념노트  FastAPI+ChromaDB │
│  Tailwind         OTP 로그인    Swift/SwiftUI│  │    [[위키링크]]·#태그     │          │
│       │                │        IMU·소음·위치│  │                          │           │
│       └───────┬────────┘             │       │  │  careflow /study (UI 3종)│           │
│               ▼                      ▼       │  │  ├ 질문 채팅 (RAG) ◄─────┘           │
│      Supabase (PostgreSQL+RLS)  /api/sensors │  │  ├ /claim 주장 근거화                │
│      기록·기준선·지표·pgvector               │  │  └ /audit 경계 카피 검수             │
│                                              │  │        │                             │
└──────────────────────────────────────────────┘  │        ▼                             │
                       ▲                          │  근거태깅 레지스트리 (#번호)         │
                       └── 단일 연결 ID: 레지스트리 #번호 ──┘                            │
                                                  └──────────────────────────────────────┘
```

### 3.2 저장소(레포) 구성

| 저장소 | 역할 | 기술 스택 | 상태 |
|---|---|---|---|
| `careflow/` | 웹앱 (제품 본체) | Next.js 14 App Router, TypeScript, Tailwind, Supabase | 구현·배포 완료 (Vercel: careflow-delta) |
| `careflow-app/` | 모바일 앱 | Expo SDK 54, React Native 0.81, React 19, TypeScript | 구현 중 (웹 패리티 진행) |
| `CareFlowWatch/` | 워치 센서 수집 | Swift, SwiftUI, CoreMotion, watchOS | 프로토타입 |
| LinkNote (`study-rag-api`) | RAG 백엔드 (공용) | Python, FastAPI, ChromaDB, OpenAI Embedding | 로컬 운영 (Render 배포 준비) |
| `논문 읽기/` | 근거 원문·개념 노트 | Markdown, PDF | 지속 축적 |

### 3.3 웹앱(careflow) 내부 구조

```
careflow/
├ app/                      # Next.js App Router
│ ├ dashboard/ history/     # 상태 인식: 대시보드·추세
│ ├ onboarding/ login/      # 온보딩·인증 (Supabase Auth)
│ ├ chat/                   # AI 대화 (관찰형 응답)
│ ├ app-web/record/         # 모바일 미러 기록 화면
│ ├ study/ (+claim, audit)  # 근거 워크스페이스 3종
│ └ api/
│   ├ chat/                 # AI 대화 (mock/GPT-4o/Claude 전환)
│   ├ indicators/           # 개인 기준선 밴드 산출
│   ├ weekly-checkins/      # 주간 척도
│   ├ sensors/healthkit·dizziness/       # 센서 수집 (P5 대비)
│   └ study/ingest·query·claim·audit·docs/  # RAG 파이프라인
├ lib/                      # 도메인 로직 (UI 독립), 하위 폴더로 분리
│ ├ domain/                 # nursingLogic, dizzinessMonitor, socialReturnIndicators,
│ │                          # evidenceRegistry, selfReportSchema, mockResponses, sessionStorage
│ ├ voice/                  # voiceDraft.ts (+synonyms) — 음성→기록 초안 파서
│ ├ integrations/           # linknote.ts, supabase/(client·server)
│ └ ui/                     # designTokens.ts — SPEC §4.1 디자인 토큰
├ supabase/migrations/      # 0001_init ~ 0005_evidence_claims
└ docs/SPEC.md              # 제품·측정 단일 기준
```

도메인 로직을 `lib/`에 UI와 분리해 배치하고 `lint:boundary` 스크립트로 경계를 강제함으로써, 웹·모바일이 동일한 기준선 계산 로직을 공유할 수 있는 구조를 유지한다.

### 3.4 데이터 모델 (Supabase, 마이그레이션 이력)

| 버전 | 내용 | 핵심 테이블 |
|---|---|---|
| 0001_init | 기록·지표·RLS 기반 | profiles, daily_logs, symptom_scores, affect_logs, social_logs, context_tags, sleep_logs, weekly_checkins, meaning_notes, baselines, social_return_indicators |
| 0002_feedback | 사용자 피드백 | feedback |
| 0003_affect_scores | 선택 감정 신호(0–10) 확장 | affect_scores |
| 0004_study_rag | pgvector RAG (임베딩 1536차원, IVFFlat 인덱스, 코사인 유사도 함수) | study_docs, study_chunks |
| 0005_evidence_claims | 근거태깅 레지스트리 | evidence_claims |

모든 테이블에 RLS(본인 행만 접근) 적용. 진단·예후·처방 관련 필드는 스키마 차원에서 존재하지 않는다.

### 3.5 배포·운영

- **웹:** Vercel 자동 배포 (careflow-delta.vercel.app), GitHub Actions 기반 Slack 알림 워크플로
- **모바일:** Expo Go / dev build
- **LinkNote RAG:** 로컬 uvicorn (포트 8000) → 베타 시 Render 이전 예정
- **환경변수 격리:** OpenAI 키는 LinkNote 한 곳에만 두어 키 관리 지점을 단일화
- **협업 체계:** 사람(제품·임상·검수) + AI 코딩 에이전트(Claude/Gemini/Cline), `AGENTS.md`로 규칙 고정

---

## 4. 구현 완료 vs 설계·진행 중

평가·제출 시 오해가 없도록 실제 구현 상태를 구분한다.

### ✅ 구현 완료

- 4축 + 수면 + 환경 태그 기록 UI (웹, 하루 4구간 + 응급 기록)
- 정규화된 데이터 모델 (Supabase 11개+ 테이블, RLS, 마이그레이션 0001–0005)
- 개인 7일 기준선 계산·3단계 밴드·상관 방향 로직 (`socialReturnIndicators.ts`)
- 대시보드·추세·온보딩·로그인 등 주요 화면 + iOS 17 디자인 시스템 통합
- AI 대화 (관찰형 응답 구조, 위기 감지 4단계 안전 레이어, mock/GPT-4o/Claude 전환)
- 음성→기록 초안 파서 (규칙 기반, 동의어 사전 포함)
- 웹 프로덕션 배포 (Vercel) + CI 알림
- /study 근거 워크스페이스 3종 (RAG 질문 채팅, /claim, /audit)
- LinkNote RAG 백엔드 (FastAPI + ChromaDB) 및 pgvector 통합 스키마
- 근거태깅 레지스트리 (17행 축적) 및 개념 노트 3건
- **LinkNote 학습 시스템:** 학습 상태 모델, 학습 큐 UI, 학습 세션 API, SM-2 간격 반복 스케줄러(`/learning-session/*`, `/review/*`)
- **CareFlow 베타 배포 준비:** EAS 빌드 설정(eas.json), 사용성 로깅(usage_events 마이그레이션 + usageLog.ts), 브랜치·버전 체계

### 🔧 설계 및 진행 중

- 모바일 앱(Expo) 웹 기능 패리티 — EAS 빌드는 가능, 실기기 검증·커밋 정리 진행 중
- 사용성 로깅 활성화 — 코드·마이그레이션 작성 완료, Supabase에 0006 적용 및 앱 재빌드 필요
- 개인 기준선 분석 고도화 (시간대별·요일별 패턴, 증상 변동성)
- HRV(오늘의 여유)·IMU(걸음 안정도) 실데이터 연동 — watchOS 센서 모듈은 프로토타입 구현, 지표 파이프라인 연결은 미완
- 생활 설계 지원 (일정 연동, 활동 가능 범위 제안)
- 음성 STT 고도화 (현재는 텍스트 파싱 단계)
- IRB·개인정보 처리 체계 (베타 전 필수)

---

## 5. 이번 기간의 핵심 성과

기능 하나를 추가한 것이 아니라 **프로젝트의 철학을 시스템으로 구체화**한 것이다.

1. **기록 중심 서비스 → 개인 기준선 기반 상태 인식**으로: 7일 롤링 기준선·밴드 계산이 실제 코드와 DB 스키마로 존재하며, 임상 컷오프를 쓰지 않는 원칙이 스키마 제약 수준에서 강제된다.
2. **상태 인식 → 생활 설계를 지원하는 비의료기기 플랫폼**으로: 센서 API·watchOS 프로토타입으로 다음 단계의 데이터 소스를 선행 확보했다.
3. **제품과 근거의 이중 구조 완성:** LinkNote라는 독립 지식 연결 엔진을 구축하고, 근거태깅 레지스트리로 "서비스의 모든 주장에 출처와 안전도를 붙이는" 체계를 만들었다. 이는 비의료기기로서의 신뢰성을 뒷받침하는 인프라다.
4. **경계의 자동화:** 비의료기기 경계를 문서(SPEC)에 두는 것을 넘어, /audit 린터·응답 구조·스키마 설계로 시스템 전반에 내장했다.

---

*본 보고서는 저장소 실코드(careflow, careflow-app, CareFlowWatch), docs/SPEC.md, 지원/CareFlow_개발구조.md, git 커밋 이력을 기준으로 작성되었다.*
