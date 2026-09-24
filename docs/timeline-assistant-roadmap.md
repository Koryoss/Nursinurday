# Timeline Assistant 개발 계획

- 대상: `lib/domain/assistants/timelineAssistant.ts`, `app/api/assistants/timeline/route.ts`
- 근거 문서: `docs/ai-flow.md` §3(Timeline Assistant), `docs/SPEC.md` §0(절대 경계)·§2(지표), `AGENTS.md`
- 범위: 로직 개선 / 테스트 / UI 연결만 (진단·중증도·예후 로직 추가 없음)
- 작성일: 2026-08-16

---

## 0. 현재 상태 (As-Is)

| 항목 | 상태 |
|---|---|
| 로직 (`entriesToDailyMetricPoints`, `runTimelineAssistant`) | 동작함. `socialReturnIndicators.ts`의 baseline/band 로직 재사용 정상 |
| **sleep 지표** | **버그**: `METRICS`에 `'sleep'`이 있지만 어디서도 채워지지 않음 (아래 §1 참고) |
| 테스트 | 없음. 저장소 전체에 테스트 러너(jest/vitest) 미설치, `package.json`에 `test` 스크립트 없음 |
| UI 연결 | 없음. `/api/assistants/timeline`을 호출하는 프론트엔드 컴포넌트가 `app/` 어디에도 없음 (API만 존재) |
| 경계 검증 | `scripts/lint-boundary.mjs` 존재 (진단/예후/중증도/정상비정상/컷오프/인과 표현 검출). Timeline Assistant 문구는 현재 관찰형으로 통과 |

### 발견한 버그 상세: sleep 지표 미연결

- `docs/SPEC.md:19` — 수면은 "취침·기상 + PSQI 3문항"으로 매일 수집 대상
- `supabase/schema.sql` — `sleep_logs(bedtime, waketime, psqi_q1, psqi_q2, psqi_q3)` 테이블 존재
- `fetchHealthRecordEntries` (`lib/domain/assistants/fetchHealthRecords.ts`) — `sleep_logs`를 조회하지 않음. `HealthRecordEntry` 타입 자체에 sleep 필드가 없음
- `timelineAssistant.ts`의 `entriesToDailyMetricPoints` — `dizziness/gait/anxiety/tension`만 계산, `point.sleep`을 절대 설정 안 함
- 결과: `bandsFor`/`detectRecurringPatterns`가 `METRICS`를 순회해도 sleep 값은 항상 `undefined` → sleep band·패턴 문구가 영원히 나오지 않음
- **결정 필요 (임상/제품 판단, AGENTS.md 역할상 정유진 검수 필요)**: PSQI 3문항(각 0~3점 추정) + 취침/기상 시각을 다른 지표와 같은 0~10 스케일로 어떻게 환산할지. 예시 후보:
  - (a) PSQI 3문항 합(0~9)을 0~10으로 선형 변환, 취침/기상은 별도 표시만
  - (b) 수면시간(기상-취침)을 별도 파생 지표로 두고 PSQI는 그대로 밴드 계산에만 사용
  - 이 부분은 Phase 1 착수 전 확정 필요 (관리자 임상 검수 사항)

---

## 1. Phase 1 — sleep 지표 버그 수정 (로직)

**목표**: Timeline Assistant가 실제로 5개 지표(dizziness/gait/anxiety/tension/sleep) 전체를 관찰하도록 수정

- [ ] (결정) PSQI/취침·기상 → 0~10 sleep 스코어 환산 규칙 확정 (정유진 검수)
- [ ] `HealthRecordEntry` 타입에 sleep 관련 필드 추가 (`lib/domain/assistants/types.ts`)
- [ ] `fetchHealthRecordEntries`가 `sleep_logs`를 조회·조인하도록 수정
- [ ] `entriesToDailyMetricPoints`에 sleep 환산 로직 추가 → `point.sleep` 채우기
- [ ] `runTimelineAssistant` 출력에서 sleep band/패턴이 정상적으로 나오는지 수동 확인
- [ ] `scripts/lint-boundary.mjs` 통과 확인 (신규 문구 없다면 스킵 가능)

**변경 파일**: `types.ts`, `fetchHealthRecords.ts`, `timelineAssistant.ts`
**완료 기준**: sleep 데이터가 있는 샘플 입력으로 `runTimelineAssistant` 호출 시 `bands.sleep`, sleep 관련 `patterns`가 정상 출력
**예상 소요**: 결정 완료 후 반나절~1일

---

## 2. Phase 2 — 테스트 인프라 + 단위 테스트

**목표**: 순수 함수 로직(`timelineAssistant.ts`, `socialReturnIndicators.ts` 재사용 부분)에 대한 회귀 테스트 확보

- [ ] 테스트 러너 도입 (vitest 권장 — Next.js 14 / ESM 친화적, jest보다 설정 가벼움). `package.json`에 `"test": "vitest run"` 추가
- [ ] `entriesToDailyMetricPoints` 테스트: 하루 다중 기록 평균 처리, 결측치 처리
- [ ] `periodKey`/`isoWeekKey` 테스트: 주차 경계(연말연시 ISO week), 월 경계
- [ ] `bandsFor` 테스트: baseline 없음/sd=0 케이스 → 항상 'normal' 반환 확인
- [ ] `detectRecurringPatterns` 테스트: high band 2회 이상일 때만 패턴 생성, 최근 4구간만 확인하는 로직 검증
- [ ] `runTimelineAssistant` 통합 테스트: day/week/month granularity 각각에 대해 스냅샷성 검증
- [ ] (Phase 1 이후) sleep 지표 포함 케이스 테스트 추가
- [ ] 문구 관련 테스트: 생성된 `description`이 관찰형("관찰됐어요", "함께 살펴볼까요")으로 끝나는지 문자열 검증 (SPEC §0 셀프체크를 테스트로 고정)

**변경 파일**: `package.json`, `vitest.config.ts`(신규), `lib/domain/assistants/__tests__/timelineAssistant.test.ts`(신규)
**완료 기준**: `npm test` 통과, 핵심 분기(band 경계값, 패턴 감지 임계치) 커버
**예상 소요**: 1~2일 (인프라 설정 반나절 + 테스트 작성 1~1.5일)

---

## 3. Phase 3 — UI 연결

**목표**: `/api/assistants/timeline` 결과를 화면에서 확인 가능하게

- [ ] granularity(day/week/month) 선택 가능한 타임라인 화면/컴포넌트 위치 결정 (기존 대시보드 페이지 내 탭인지, 신규 라우트인지 — 정유진 확인 필요)
- [ ] API 응답(`timeline`, `patterns`)을 받아 지표별 band(low/normal/high) 시각화 (색상은 진단적 뉘앙스 없는 중립 팔레트로 — SPEC §0 유의)
- [ ] `patterns`의 관찰형 문구를 카드/배너로 노출 (질문형 유지, 단정형으로 재가공 금지)
- [ ] 데이터 없음/기록 부족 상태(빈 배열) UI 처리
- [ ] 로딩/에러 상태 처리

**변경 파일**: `app/` 하위 신규 페이지 또는 기존 대시보드 컴포넌트, 필요 시 클라이언트 fetch 훅
**완료 기준**: 로그인 사용자가 화면에서 기간별 타임라인과 관찰 문구를 확인 가능
**예상 소요**: 화면 위치/디자인 확정 여부에 따라 1~2일

---

## 4. Phase 4 — 마무리 검증

- [ ] `npm run build` / 타입체크 통과
- [ ] `npm run lint:boundary` 통과 (신규 카피 전수 검토)
- [ ] SPEC §0 셀프체크: 진단/중증도/예후/컷오프/인과 표현 없는지 최종 확인
- [ ] PR 설명에 SPEC 어느 항목 대응인지 명시 (AGENTS.md §3 규칙)

---

## 진행 순서 제안

```
Phase 1 (sleep 버그 수정, 결정 선행)
   ↓
Phase 2 (테스트 인프라 — Phase 1 수정분도 함께 커버)
   ↓
Phase 3 (UI 연결)
   ↓
Phase 4 (검증)
```

Phase 2(테스트 인프라)는 Phase 1과 순서를 바꿔 먼저 진행해도 무방합니다 — 오히려 sleep 버그 수정 전에 현재 동작(4개 지표만)에 대한 회귀 테스트를 먼저 깔아두면 수정 중 실수를 잡기 쉽습니다. 원하시면 순서를 Phase 2 → Phase 1로 조정할 수 있습니다.

## 결정이 필요한 항목 (진행 전 확인)

1. PSQI 3문항 + 취침/기상 시각 → 0~10 sleep 스코어 환산 규칙
2. 테스트 러너: vitest vs jest 중 선호
3. UI 연결 위치: 기존 화면에 탭 추가 vs 신규 라우트
