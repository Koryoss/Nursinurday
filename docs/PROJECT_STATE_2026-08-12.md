# CareFlow 프로젝트 현황 — 2026-08-12 (재개 전 정리)

프로젝트를 잠시 중단했다가 재개하기 전 파일 정리와 함께 현재 상태를 점검한 기록입니다.

## ⚠️ 가장 먼저 확인할 것: git에 커밋되지 않은 변경사항

아래 변경사항이 아직 **커밋되지 않은 채로 남아 있습니다** (`git status`/`git diff` 기준).

- `docs/SPEC.md`는 한때 디스크에서 삭제되어 있었지만 **복원 완료**했습니다(git HEAD 기준). `AGENTS.md`·`docs/README.md`·`지원/CareFlow_개발구조.md`·`careflow-app/src/constants/colors.ts` 등 여러 곳이 SPEC.md를 "지금도 있는 단일 기준"으로 인용하고 있어서, 복원이 맞는 방향입니다.
- 기존에 git에 커밋돼 있던 `docs/architecture.md`, `docs/ai-flow.md`, `docs/decisions.md`, `docs/VOICE_SELF_GUIDE.md`, `docs/BETA_QA_CHECKLIST.md`, `docs/P3_DEPLOYMENT.md` 6개는 **삭제가 git에 스테이징된 상태**(`git rm`)입니다. 다른 어떤 파일도 이 6개를 참조하지 않는 걸 확인했습니다. 아직 **커밋은 안 했습니다.**
- `README.md`(루트)가 220줄 → 훨씬 짧은 버전으로 수정된 채 미커밋 상태입니다.
- `app/api/sensors/dizziness/route.ts`에 약 295줄 규모의 수정이 미커밋 상태로 남아있습니다. 재개 시 이 변경이 완성된 작업인지, 진행 중이던 작업인지 먼저 확인하는 게 좋습니다.

이 항목들은 "내용을 완성할지, 이대로 커밋할지"의 판단이 필요해서 사용자 확인 전까지는 커밋하지 않고 남겨뒀습니다.

## 지금까지 정리한 내용 (Claude + 직접 수정 혼합)

1. **Claude가 한 것:** 루트에 흩어져 있던 스크린샷 4장·`koryoss_three_repos_startup_audit.docx/pdf`·`.DS_Store`·빈 `lib/study/` 폴더·`.next`·`tsconfig.tsbuildinfo` 정리. `지원/발표자료_중간평가`에 있던 오래된(7/7) 버전의 `CareFlow_중간평가_흑백초안.pptx` 중복 파일 삭제(최신 버전만 유지). `docs/SPEC.md` 복원 + 참조 끊긴 문서 6개 git 삭제 스테이징. 업로드된 `CareFlow_사회복귀지표_설계안.docx`를 `.md`로 변환해 `docs/CareFlow_사회복귀지표_설계안.md`로 저장.
2. **사용자가 직접 한 것(2026-08-12):** `지원/`·`논문 읽기/` 폴더를 크게 정리했습니다. 그 결과:
   - `지원/`는 이제 거의 비어 있음(`.DS_Store`만 남음) — HIRA 원자료, IRB 신청서, 연구계획서, 제안서, 발표자료 등은 더 이상 이 폴더에 없음
   - `논문 읽기/` 폴더 자체가 최상위에서 사라짐 — 참고문헌 PDF 원문들도 더 이상 안 보임
   - 그 폴더들에 있던 노트/문서 6개(`CareFlow_참고문헌.md`, `CareFlow_개발구조.md`, `CareFlow_근거태깅_레지스트리.md`, `내림프수종.md`, `자율신경_HRV.md`, `전정계_VOR.md`)는 `docs/`로 옮겨져 지금 거기 있음
   - Claude가 만들었던 `docs/archive/`(스크린샷+감사 리포트 보관용)도 사라짐

   **참고:** 이 6개 노트가 이제 git 추적 대상인 `docs/` 안에 있습니다. `지원/`·`논문 읽기/`는 원래 README가 "대용량·비공개라 의도적으로 git 밖에 둔다"고 문서화한 폴더였는데, 이 노트들을 커밋하면 그 방침과 달라지니 커밋 전에 의도한 게 맞는지 한 번 확인하는 걸 권장합니다.

## 폴더 구조 (2026-08-12 기준, 재개 시 참고용)

| 경로 | 내용 |
|---|---|
| `app/` | Next.js App Router. 웹 페이지(`app/page.tsx` 등 12개)와 API 라우트(`app/api/**/route.ts` 15개: chat, indicators, sensors/dizziness·healthkit, study/*, weekly-checkins) |
| `lib/` | 핵심 로직 — `nursingLogic.ts`, `dizzinessMonitor.ts`, `socialReturnIndicators.ts`, `voiceDraft.ts`, `evidenceRegistry.ts`, `linknote.ts`, `supabase/` 클라이언트 |
| `careflow-app/` | Expo/React Native 모바일 앱. 같은 저장소에 포함되며 Supabase를 웹과 공유. `src/screens/`에 6개 화면(Auth, Chat, Dashboard, Notification, Onboarding, Record) |
| `supabase/` | DB 스키마(`schema.sql`) + 마이그레이션 6개(0001_init ~ 0006_usage_events) |
| `tests/` | `voiceDraft.test.ts` 1개뿐 — 테스트 커버리지가 얕음 |
| `scripts/` | `lint-boundary.mjs`(의료 카피 경계 체크), `run-migration.mjs` |
| `docs/` | 프로젝트 문서 전부 — SPEC/README/발전보고서/베타테스트 계획/PROJECT_STATE + 위에서 옮겨온 노트 6개. 위 "미커밋 변경사항" 참고 |
| `지원/` | 현재 거의 비어 있음(`.DS_Store`만) |
| `논문 읽기/` | 현재 최상위에 폴더 없음 |

## 스택 메모

- 웹: Next.js 14 (App Router, TS) + Tailwind, Vercel 배포. AI: `@anthropic-ai/sdk`, `openai` 둘 다 의존성에 있음(`AI_MODE` 환경변수로 전환하는 듯).
- 모바일: Expo ~54 / React Native 0.81, 웹과 Supabase 공유.
- 인증/DB: Supabase (Postgres + Auth + RLS).
- `AGENTS.md`에 명시된 절대 규칙: 비의료기기이므로 진단·중증도 판정·예후 예측·치료 처방 관련 코드/카피 금지, 사용자 문구는 단정형 금지·질문형 권장.
