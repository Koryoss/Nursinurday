# CareFlow 문서 인덱스

CareFlow(Koryoss/Nursinurday) 저장소의 문서 모음입니다. 문서는 **설계 기준 / 운영 가이드 / 다음 단계**로 나뉩니다.

## 1. 설계 기준 (Single Source of Truth)

새 기능·화면·데이터는 이 문서들과 어긋나지 않게 작업합니다.

| 문서 | 내용 |
|---|---|
| [architecture.md](architecture.md) | 프로젝트 목적, 설계 철학, 4개 서비스(Web·App Mirror·Expo App·Study Workspace), 기록 중심 데이터 흐름, 시스템 구성, 설계 원칙 |
| [ai-flow.md](ai-flow.md) | AI Orchestrator와 Assistant(Summary·Timeline·Context·Evidence) 구조, AI 처리 흐름, AI가 하지 않는 일(진단·처방·치료 판단) |
| [decisions.md](decisions.md) | 주요 설계 결정 기록(ADR): 기록 중심·Assistant 구조·Study Workspace 분리·LinkNote 독립·Evidence 참고자료화 |
| [SPEC.md](SPEC.md) | 제품·측정·DB 단일 기준(4축 지표, 개인 기준선, 디자인 토큰, 데이터 원칙) |

## 2. 운영 가이드

| 문서 | 내용 |
|---|---|
| [P3_DEPLOYMENT.md](P3_DEPLOYMENT.md) | 배포 절차 |
| [BETA_QA_CHECKLIST.md](BETA_QA_CHECKLIST.md) | 베타 QA 체크리스트 |
| [VOICE_SELF_GUIDE.md](VOICE_SELF_GUIDE.md) | 음성 기록 가이드 |

## 3. 다음 단계 (설계 문서 기반 로드맵)

아래 항목은 위 설계 문서에서 정의된 향후 방향을 한눈에 모은 것입니다. 상세 근거는 각 문서를 참조합니다.

**AI 구조 확장** (ai-flow.md §5)
- OCR Assistant — 검사 결과·처방전 등 의료 문서 → 디지털 기록 (의료기기 판정 필요 여부 확인 후 진행)
- Voice Assistant — 음성 → 텍스트 기록 자동 정리
- Calendar Assistant — 병원 방문·복약·증상 일정 관리
- Reflection Assistant — 주간·월간 회고, 장기 변화 정리

**시스템 확장** (architecture.md §8)
- AI Router / Memory
- MCP 기반 외부 서비스 연동
- 개인 건강 기록 시각화, 장기 건강 변화 분석

**서비스별 다음 단계**
- Expo App (핵심) — 베타 배포(EAS), 사용성 로깅(usage_events) 활성화, 웹↔앱 패리티
- Web (홍보) — 베타 테스터 모집 랜딩 고도화
- App Mirror (데모) — 앱 화면 변경의 웹 미러 반영
- Study Workspace (내부 지식) — LinkNote 연동 심화, 근거 레지스트리 축적

## 관련 저장소

- **LinkNote** (Koryoss/LinkNote) — 의료·간호 지식 RAG 엔진. Study Workspace가 연동. ADR-004에 따라 독립 저장소로 유지.
- **CareFlowWatch** (Koryoss/CareFlowWatch) — Apple Watch·iPhone 네이티브 센서 수집 앱.
