# 🚦 CareFlow 신호등 × NANDA 전체 업데이트 로그

**업데이트 날짜**: 2026-03-23
**업데이트 내용**: 신호등 색(🟢🟡🟠🔴) × NANDA 4가지 유형 매핑을 모든 문서에 전사 적용
**적용 파일 수**: 8개 (마크다운 7 + TypeScript 1)

---

## 🎯 업데이트의 핵심

### 신호등 × NANDA 표현 최종 매핑

| 🚦 색 | NANDA 유형 | 영어 표현 | 한국어 의미 | CareFlow 역할 |
|------|-----------|---------|-----------|--------------|
| 🟢 | 안녕 간호진단 (Wellness) | **Readiness for enhanced ~~** | 건강하며 향상 의지 있음 | 자기돌봄 강화 제안 |
| 🟡 | 위험 간호진단 (Risk) | **Risk for ~~** | 위험 신호 감지됨 | 예방 모니터링 |
| 🟠 | 실제 간호진단 (Actual) | **Actual ~~ Related To** | 현상 이미 발생 | 현상 기반 심리 지원 |
| 🔴 | 협력문제 (Collaborative) | **Potential Complication of ~~** | 의료 전문가 필수 | 즉시 의료 연결 |

---

## 📋 파일별 업데이트 상세 내용

---

### 1️⃣ `lib/nursingLogic.ts` ✅

**변경 위치**: NANDA 4가지 유형 주석 블록 + TypeScript 타입 선언

**변경 내용**:

```typescript
// 이전 (색깔 없음)
export type NANDADiagnosisType =
  | 'wellness'      // 1️⃣ 안녕 간호진단
  | 'risk'          // 2️⃣ 잠재적/위험 간호진단
  | 'actual'        // 3️⃣ 실제 간호진단
  | 'collaborative' // 4️⃣ 협력문제

// 이후 (신호등 + NANDA 표현 추가)
export type NANDADiagnosisType =
  | 'wellness'      // 🟢 안녕 간호진단 — Readiness for enhanced ~~
  | 'risk'          // 🟡 위험 간호진단 — Risk for ~~
  | 'actual'        // 🟠 실제 간호진단 — Actual ~~
  | 'collaborative' // 🔴 협력문제 — Potential Complication of ~~
```

**주석 블록 변경**:
- 섹션 제목: "NANDA 간호 진단의 4가지 유형" → "🚦 신호등 색 × NANDA 4가지 유형"
- 각 유형 앞에 🟢🟡🟠🔴 아이콘 추가
- 각 유형에 NANDA 영어 표현 예시 추가
  - 🟢: `"Readiness for enhanced stress management"`
  - 🟡: `"Risk for anxiety related to sleep deprivation"`
  - 🟠: `"Disturbed sleep pattern related to anxiety"`
  - 🔴: `"PC: Hearing loss related to chronic tinnitus"`

---

### 2️⃣ `CAREFLOW_FINAL_DEFINITION.md` ✅

**변경 위치 1**: 4단계 프로세스 (Step 2️⃣ 현상 파악)

```
이전:
  S: "밤에 자주 깨요"
  O: Apple Watch - 야간 심박수 증가
  분석: "불안과 관련된 수면 방해 현상"

이후:
  🟢 Readiness for enhanced ~~
      S: "스트레스를 더 잘 관리하고 싶어요"
      → 현재 건강, 향상 의지 있음

  🟡 Risk for ~~
      S: "밤에 자주 깨요"
      O: Apple Watch - 야간 심박수 증가 (65→100 bpm)
      → "불안 위험과 관련된 수면 방해 패턴"

  🟠 Actual ~~
      S: "2주째 불안해요", O: 심박수 증가, 활동 감소
      → "불안과 관련된 수면 방해 현상"

  🔴 Potential Complication of ~~
      S: "귀에서 계속 울려요", O: 수면 단편화, 심박수 불규칙
      → 협력문제 감지 → 즉시 이비인후과 연결
```

**변경 위치 2**: Step 4️⃣ 데이터 기반 지원

```
이전:
  - 패턴 인식: "밤에 울림이 증폭되는 패턴"
  - 자기돌봄 제안: "음향 마스킹 시도하기"

이후:
  🟢 자기돌봄 강화 제안
  🟡 예방적 모니터링 + 패턴 인식
  🟠 심리적 지원 + 자기돌봄
  🔴 의료 연결 + 즉시 안전 계획
```

**변경 위치 3**: 협력문제 vs 현상 파악 섹션 → 신호등 테이블로 교체

```markdown
| 색 | NANDA 유형 | NANDA 표현 | CareFlow 역할 |
|----|-----------|-----------|--------------|
| 🟢 | 안녕 간호진단 | Readiness for enhanced ~~ | 자기돌봄 강화 제안 |
| 🟡 | 위험 간호진단 | Risk for ~~ | 예방 모니터링 |
| 🟠 | 실제 간호진단 | Actual ~~ (Related To) | 현상 기반 심리 지원 |
| 🔴 | 협력문제 | Potential Complication of ~~ | 즉시 의료 연결 |
```

**변경 위치 4**: 최종 원칙 6가지에 신호등 추가

```
이전: "1️⃣ "Related To" 표현 사용"
이후: "🟢 1️⃣ Readiness for enhanced ~~ 표현"
      "🟡 2️⃣ Risk for ~~ 데이터 기반 이해"
      "🟠 3️⃣ Related To 현상 파악"
      "🔴 4️⃣ 협력문제 신호 감지 → 즉시 의료 연결"
```

---

### 3️⃣ `CAREFLOW_PLAYBOOK.md` ✅

**변경 위치 1**: NANDA 4유형 표

```markdown
이전:
| 유형 | 정의 | 자료 | CareFlow 응답 | 예시 |

이후:
| 🚦 색 | 유형 | NANDA 표현 | 자료 | CareFlow 응답 | 예시 |
| 🟢 | 안녕 간호진단 | Readiness for enhanced ~~ | S만 OK | 자기돌봄 강화 | "Readiness for enhanced stress management" |
| 🟡 | 위험 간호진단 | Risk for ~~ | O+S 필수 | 패턴+예방 | "Risk for anxiety related to sleep deprivation" |
| 🟠 | 실제 간호진단 | Actual ~~ Related To | O+S 필수 | 현상 기반 지원 | "Disturbed sleep pattern related to anxiety" |
| 🔴 | 협력문제 | Potential Complication of ~~ | O+S 의료신호 | 즉시 의료 연결 | "PC: Hearing loss — 이비인후과 상담" |
```

**변경 위치 2**: Potential Complication 합병증 위험 표

```markdown
이전:
| 기저 증상 | Potential Complication | CareFlow 역할 |

이후:
| 🚦 | 기저 증상 | PC (Potential Complication) | CareFlow 역할 |
| 🔴 | 이명 | PC: Hearing loss / 이명성 자살 위험 | 즉시 연결 + 심리 지원 |
| 🔴 | 어지럼증 | PC: Fall injury / 낙상·골절 위험 | 즉시 연결 + 안전 가이드 |
| 🔴 | 우울증 | PC: Suicide attempt | 🔴 응급 연결 (1393) |
| 🔴 | 불안장애 | PC: Panic disorder progression | 의료 연결 + 심리 지원 |
| 🔴 | 공황장애 | PC: Agoraphobia development | 의료 연결 + 회피 방지 |
```

---

### 4️⃣ `DEVELOPER_MANUAL.md` ✅

**변경 위치 1**: 간호진단 vs 협력문제 섹션 제목

```
이전: ## 🎯 간호진단 vs 협력문제
이후: ## 🚦 신호등 × 간호진단 vs 협력문제
```

**변경 위치 2**: 간호진단 설명 블록

```
이전:
간호진단 (Nursing Diagnosis)
- 심리적 반응: "불안으로 인한 수면 방해"

이후:
🟢 Readiness for enhanced ~~ → 자기돌봄 강화 / S 자료만 OK
🟡 Risk for ~~ → 패턴 인식 + 예방 모니터링 / O+S 필수
🟠 Actual ~~ Related To → 현상 기반 심리 지원 / O+S 필수
```

**변경 위치 3**: 협력문제 섹션

```
이전: 협력문제 (Collaborative Problems)
이후: 🔴 PC: [의료적 합병증] — 의료만 가능
      PC: Hearing loss (이명 → 이비인후과)
      PC: Major depression (우울증 → 정신과)
      PC: Suicide attempt (자살 위험 → 1393 즉시)
```

**변경 위치 4**: 신체 + 정신 건강 동등 취급 표

```markdown
이전:
| 신체 증상 | 정신 증상 |
| 이명 → 이비인후과 | 우울증 → 정신과 |

이후:
| 🔴 신체 증상 | PC 위험 | 🔴 정신 증상 | PC 위험 |
| 이명 → 이비인후과 | PC: 청력 손상 | 우울증 → 정신과 | PC: 자살 시도 |
| 어지럼증 → 신경과 | PC: 낙상 골절 | 불안장애 → 정신과 | PC: 공황장애 |
| 비문증 → 안과 | PC: 망막 박리 | 공황장애 → 정신과 | PC: 광장공포증 |
| 메니에르병 → 이비인후과 | PC: 청력 손실 | 자살 위험 → 1393 | 🆘 즉시 연결 |
```

**변경 위치 5**: 긴급 상황 프로토콜 제목

```
이전: ## 🔴 긴급 상황 프로토콜
이후: ## 🚦 긴급 상황 프로토콜 (신호등 레벨)
      ### 🔴 Crisis Level: CRITICAL (자살/자해)
      ### 🟠 Crisis Level: URGENT (심각한 정신증상)
```

**변경 위치 6**: 주의 협력문제 섹션

```
이전: ## 🟡 주의 협력문제
이후: ## 🔴 주의 협력문제 — Potential Complication

이명: **🔴 이명 (귀 울림) — PC: Hearing loss / 이명성 자살**
어지럼증: **🔴 어지럼증 — PC: Fall injury / 낙상 위험**
우울증: **🔴 우울증 증상 — PC: Suicide attempt**
```

---

### 5️⃣ `V4_1_UPDATE_SUMMARY.md` ✅

**변경 위치 1**: 4단계 프로세스 섹션 제목 + 내용

```
이전: ## 🎯 v4.1 4단계 프로세스
이후: ## 🚦 v4.1 4단계 프로세스 × 신호등

Step 2️⃣에 신호등 분류 추가:
  🟢 Readiness for enhanced ~~ (향상 의지)
  🟡 Risk for ~~ (위험 감지)
  🟠 Actual ~~ Related To (현상 발생)
  🔴 Potential Complication of ~~ (의료 필수)

Step 3️⃣에 신호등 분기 추가:
  🔴 YES → 즉시 의료 연결
  🟢🟡🟠 NO → CareFlow 지원 계속

Step 4️⃣ 응답 분기:
  🟢 / 🟡 / 🟠 / 🔴 별 다른 응답
```

**변경 위치 2**: 핵심 원칙 6가지

```
이전: ### 1️⃣ "Related To" 표현 사용
이후: ### 🟢 1️⃣ "Readiness for enhanced ~~" 표현
      ### 🟡 2️⃣ "Risk for ~~" 데이터 기반 감지
      ### 🟠 3️⃣ "Related To" 현상 파악
      ### 🔴 4️⃣ 협력문제 → 즉시 의료 연결
```

---

### 6️⃣ `V4_1_AT_A_GLANCE.md` ✅

**변경 위치 1**: 핵심 변화 섹션 → 신호등 × NANDA 4유형 테이블로 교체

```markdown
이전: "표현의 변화 (가장 중요)" 단순 표

이후: ## 🚦 핵심: 신호등 × NANDA 4유형
| 🚦 | NANDA 표현 | 의미 | CareFlow |
| 🟢 | Readiness for enhanced ~~ | 건강, 향상 의지 | 자기돌봄 강화 |
| 🟡 | Risk for ~~ | 위험 신호 감지 | 예방 모니터링 |
| 🟠 | Actual ~~ Related To | 현상 발생 | 심리 지원 |
| 🔴 | Potential Complication of ~~ | 의료 필수 | 즉시 의료 연결 |
```

**변경 위치 2**: 표현의 변화 표에 신호등 추가

```
이전:
"불안으로 인한 수면 방해" → "불안과 관련된 수면 방해"

이후:
"불안으로 인한 수면 방해" → 🟠 "불안과 관련된 수면 방해"
"우울증입니다" → 🔴 "PC: Depression → 정신과 연결"
"이명입니다" → 🔴 "PC: Hearing loss → 이비인후과"
"잘 지내고 싶어요" → 🟢 "Readiness for enhanced well-being"
"불안해질 것 같아요" → 🟡 "Risk for anxiety related to ~~"
```

**변경 위치 3**: 4단계 프로세스에 신호등 분류 추가

**변경 위치 4**: 6가지 원칙에 신호등 추가

**변경 위치 5**: 개발자 체크리스트 → 신호등별 체크로 재구성

```
이전: 단순 체크박스 리스트

이후:
🔴 위험 체크 → "진단합니다" 없음? 협력문제 → 즉시 의료 연결?
🟠 현상 파악 체크 → "~과 관련된" 사용? S+O 자료 제시?
🟡 예방 체크 → "Risk for" 패턴 감지?
🟢 성장 체크 → "Readiness for enhanced" 가능성?
```

---

### 7️⃣ `NANDA_COMPREHENSIVE_FRAMEWORK.md` ✅

**변경 위치 1**: 핵심 구분 섹션 제목 + 내용

```
이전: ## 🎯 핵심 구분: 간호진단 vs 협력문제
이후: ## 🚦 핵심 구분: 간호진단 vs 협력문제 × 신호등

간호진단 블록:
🟢 Readiness for enhanced ~~ → S 자료만 OK
🟡 Risk for ~~ → O+S 필수
🟠 Actual ~~ Related To → O+S 필수

협력문제 블록:
🔴 PC: [의료적 합병증] — 의료 전문가만 가능
🔴 PC: Hearing loss → 이비인후과
🔴 PC: Major depression → 정신과
🔴 PC: Suicide attempt → 1393 즉시
```

**변경 위치 2**: 예시 1 (불안 관련 간호진단) — 신호등 추가

```
이전: "### 예시 1: 불안 관련 간호진단"
이후: "### 🟠 예시 1: 불안 관련 실제 간호진단 (Actual Nursing Diagnosis)"

간호진단 도출:
이전: P: "불안으로 인한 수면 방해"
이후: P: Disturbed sleep pattern
      E: Related to anxiety and autonomic nervous system activation

CareFlow 응답 v4.1 형식:
이전: "밤에 자주 깨시고..."
이후: "불안과 관련된 수면 방해를 경험하고 계신 거군요"
      🟡 모니터링: "2주 후에도 계속되면 전문가 상담 권유"
```

**변경 위치 3**: 예시 2 (이명 협력문제) — 신호등 추가

```
이전: "협력문제 감지 → 핵심!"
이후: "🔴 협력문제 감지 → 핵심!"

이전: "1️⃣ 협력문제: 이명 진단 필요"
이후: "🔴 협력문제: PC: Hearing loss / PC: Depression"
      "🟠 간호진단 (동반 지원): 이명 증상과 관련된 수면 방해"
```

**변경 위치 4**: 협력문제 4가지 유형 표 제목 + 컬럼

```
이전: ## 🚨 협력문제의 4가지 유형
이후: ## 🔴 협력문제의 4가지 유형 (Potential Complication)

이전: | 증상 | 협력문제 | 의료 영역 | CareFlow 역할 |
이후: | 🔴 증상 | PC (Potential Complication) | 의료 영역 | CareFlow 역할 |
```

---

### 8️⃣ `README.md` ✅

**변경 위치**: 중요 알림 섹션 전체

```
이전: ## ⚠️ 중요 알림: CareFlow v4.1 "Related To" 프레임워크

이후: ## ⚠️ 중요 알림: CareFlow v4.1 🚦 신호등 × "Related To" 프레임워크

신호등 × NANDA 테이블 추가:
| 🚦 | NANDA 표현 | 의미 | CareFlow 응답 |
| 🟢 | Readiness for enhanced ~~ | 건강, 향상 의지 | 자기돌봄 강화 |
| 🟡 | Risk for ~~ | 위험 신호 감지 | 예방 모니터링 |
| 🟠 | Actual ~~ Related To | 현상 발생 | 현상 기반 지원 |
| 🔴 | Potential Complication of ~~ | 의료 필수 | 즉시 의료 연결 |

v4.1 예시 업데이트:
이전: "2주간의 무력감과 관련된..."
이후:
  🔴 협력문제 감지: PC: Major depression → 정신과 연결
  🟠 현상 파악: "무력감과 관련된 활동 감소를 경험하고 계신 거군요"
```

---

## 📊 업데이트 전후 비교 요약

### 간호진단 표현 변화

| 상황 | 이전 표현 | 이후 표현 (신호등) |
|------|---------|-----------------|
| 건강, 향상 의지 | "스트레스 관리하고 싶어요" | 🟢 "Readiness for enhanced stress management" |
| 위험 신호 감지 | "수면 부족 → 불안 위험" | 🟡 "Risk for anxiety related to sleep deprivation" |
| 현상 발생 | "불안으로 인한 수면 방해" | 🟠 "Disturbed sleep pattern related to anxiety" |
| 의료 필수 | "이명 진단 필요" | 🔴 "PC: Hearing loss → 이비인후과 즉시 연결" |
| 응급 | "자살 위험 → 1393" | 🔴 "PC: Suicide attempt → 1393 즉시" |

---

## 🔁 신호등 흐름도 (전체 프로세스)

```
사용자 입력 (S + O 자료)
        ↓
🚦 NANDA 유형 분류
        ↓
┌───────────────────────┐
│ 🟢 Readiness for      │ → 자기돌봄 강화 제안
│    enhanced ~~        │
├───────────────────────┤
│ 🟡 Risk for ~~        │ → 예방 모니터링 + 패턴 인식
│                       │
├───────────────────────┤
│ 🟠 Actual ~~          │ → 현상 기반 심리 지원
│    Related To         │   + 자기돌봄
├───────────────────────┤
│ 🔴 Potential          │ → 즉시 의료 연결
│    Complication of ~~ │   + 안전 계획
└───────────────────────┘
```

---

## ✅ 업데이트 완료 현황

| 파일 | 신호등 적용 | 주요 변경 포인트 |
|------|-----------|---------------|
| `lib/nursingLogic.ts` | ✅ 완료 | 타입 주석 + 유형 설명 블록 |
| `CAREFLOW_FINAL_DEFINITION.md` | ✅ 완료 | 4단계 프로세스, 원칙 6가지, 유형 테이블 |
| `CAREFLOW_PLAYBOOK.md` | ✅ 완료 | NANDA 4유형 표, 합병증 표 |
| `DEVELOPER_MANUAL.md` | ✅ 완료 | 진단 섹션, 위기 레벨, 신체/정신 표 |
| `V4_1_UPDATE_SUMMARY.md` | ✅ 완료 | 4단계 다이어그램, 원칙 6가지 |
| `V4_1_AT_A_GLANCE.md` | ✅ 완료 | 신호등 테이블, 체크리스트 재구성 |
| `NANDA_COMPREHENSIVE_FRAMEWORK.md` | ✅ 완료 | 핵심 구분, 사례 예시, PC 표 |
| `README.md` | ✅ 완료 | 신호등 NANDA 테이블, 예시 업데이트 |

---

## 🎓 개발자 빠른 참조 카드

```
응답 생성 시 신호등 판단 흐름:

1. S + O 자료 수집
2. 상태 판단:
   사용자가 향상 의지를 보이는가? → 🟢 Readiness for enhanced ~~
   위험 신호가 있는가?              → 🟡 Risk for ~~
   현상이 이미 발생했는가?          → 🟠 Actual ~~ Related To ~~
   의료 개입이 필요한가?            → 🔴 Potential Complication of ~~

3. 의료 연결 여부:
   🔴 → 즉시 의료 기관 연결
   🟢🟡🟠 → CareFlow 자기돌봄 지원 계속

체크리스트:
  🔴 "진단합니다" 표현 없음?
  🔴 협력문제 → 즉시 의료 연결?
  🟠 "~과 관련된" 표현 사용?
  🟠 S + O 자료 제시?
  🟡 "Risk for" 패턴 감지?
  🟢 "Readiness for enhanced" 가능성?
```

---

**업데이트 완료**: 2026-03-23
**총 변경 파일**: 8개
**신호등 × NANDA 매핑**: ✅ 전사 적용
**v4.1 프레임워크**: ✅ 완전 통합
