# Nursinurday — CareFlow 작업공간 안내

이 폴더(`Nursinurday/`)는 **여러 저장소와 자료를 담는 로컬 작업공간**입니다. 폴더 자체는 git 저장소가 아니며, 아래처럼 독립 저장소·자료가 함께 놓여 있습니다.

## 폴더 = 저장소 매핑

| 로컬 폴더 | 정체 | GitHub |
|---|---|---|
| `careflow/` | **CareFlow 통합 저장소** (Next.js 웹 + 앱미러 + Study + 모바일앱) | Koryoss/**Nursinurday** |
| `careflow/careflow-app/` | 모바일 앱 (Expo/React Native) — 위 저장소에 포함 | (같은 repo) |
| `CareFlowWatch/` | Apple Watch·iPhone 네이티브 센서 앱 | Koryoss/CareFlowWatch |

> ⚠️ 헷갈리기 쉬운 점: GitHub의 **Nursinurday** 저장소는 최상위 폴더가 아니라 **`careflow/` 하위 폴더**에 매핑됩니다. 개발·배포·git 작업은 `careflow/` 안에서 합니다.

## git에 없는 로컬 자료 (버전관리·백업 안 됨)

| 폴더 | 내용 | 비고 |
|---|---|---|
| `docs/` | 발전보고서, 베타테스트 계획 | 프로젝트 산출물 |
| `지원/` | 설계안·시장통계·근거 레지스트리 등 지원 자료 | 대용량·비공개 자료 |
| `논문 읽기/` | 원문 PDF + 개념 노트 | 근거 자료 |
| `(추후에 반영)…와이어프레임.html` | 초기 와이어프레임 | 참고용 |

이 자료들은 의도적으로 웹 저장소 밖에 둡니다(대용량 PDF·비공개). 백업이 필요하면 별도 저장소나 클라우드에 두는 것을 권장합니다.

## 관련 저장소 (다른 위치)

- **LinkNote** (Koryoss/LinkNote) — 의료·간호 지식 RAG 엔진. `careflow/` 의 Study Workspace가 연동. (로컬 위치: `~/Desktop/LINKNOTE`)

## 자주 하는 작업

```bash
# CareFlow 웹/앱 (= Nursinurday 저장소)
cd careflow
npm run dev                 # 웹 개발 서버
cd careflow-app && npx expo start   # 모바일 앱

# 워치 앱
open CareFlowWatch/CareFlowWatch.xcodeproj
```

각 저장소의 상세 구조·문서는 해당 폴더의 `README.md`와 `docs/`를 참조하세요 (`careflow/README.md`, `careflow/docs/README.md`).
