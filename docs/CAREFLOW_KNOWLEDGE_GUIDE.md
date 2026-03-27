# 🧠 CareFlow 통합 지식 가이드
> 간호 실무자 + 개발자 기준 — CareFlow를 설계·개발·운영하기 위해 갖추어야 할 핵심 지식

---

## PART 1. 간호 실무 지식

---

### 1-1. 간호진단의 철학적 기반

#### 핵심 원칙
> **"의학적 진단을 하지 않는다. 그 질병에 대한 인간의 반응에 집중한다."**

의사는 질병(disease)을 진단한다.
간호사는 그 질병에 대한 **인간의 반응(human response)** 을 다룬다.

| 구분 | 주체 | 대상 |
|---|---|---|
| 의학적 진단 | 의사 | 질병 그 자체 (BPPV, 기립성 저혈압) |
| 간호진단 | 간호사 | 질병에 대한 인간의 반응 (균형 변화, 낙상 위험) |

**예시:**
- ❌ "이 환자는 BPPV입니다" → 의학 진단
- ✅ "전정기능 변화와 관련된 균형감각 변화가 관찰됩니다" → 간호 현상 기술

---

### 1-2. NANDA 간호진단 4유형 × 🚦 신호등

NANDA International이 정의한 공식 간호진단 분류 체계.

| 🚦 | 유형 | NANDA 영문 표현 | 의미 |
|---|---|---|---|
| 🟢 | 안녕 간호진단 | Readiness for enhanced ~~ | 현재 정상, 더 좋아질 수 있는 상태 |
| 🟡 | 위험 간호진단 | Risk for ~~ | 아직 문제 없지만 위험 요소 존재 |
| 🟠 | 실제 간호진단 | Actual ~~ Related To ~~ | 현재 문제가 실제로 발생하고 있음 |
| 🔴 | 협력문제 | Potential Complication (PC) of ~~ | 의료팀 협력 필요, 간호 단독 불가 |

#### 핵심 구분: 간호진단 vs 협력문제

**간호진단 (🟢🟡🟠):** 간호사가 독자적으로 처방·중재할 수 있음
**협력문제 (🔴):** 의사 처방 없이 간호사 단독 해결 불가능 → 반드시 의료팀에 보고

---

### 1-3. v4.1 "Related To" 현상학적 프레임워크

#### 4단계 프로세스

```
[1단계] 센서 데이터 수집 (O: 객관적 자료)
    ↓
[2단계] 🚦 신호등 분류 (none/mild/moderate/severe)
    ↓
[3단계] "Related To" 현상 기술 (v4.1 언어)
    ↓
[4단계] 간호 중재 또는 의료 연결
```

#### v4.1 언어 규칙

| 규칙 | ❌ 금지 표현 | ✅ 허용 표현 |
|---|---|---|
| 진단명 금지 | "BPPV입니다" | "강한 회전 운동과 관련된 균형감각 변화" |
| 병명 금지 | "기립성 저혈압 가능성" | "기상 직후 자세 변화와 관련된 균형 변화" |
| 단정 금지 | "어지럼증 진단" | "균형감각 변화 패턴 관찰됨" |
| 협력문제 표현 | "심각한 전정 질환" | "PC: 전정기능 장애 가능성 — 의료 평가 필요" |

---

### 1-4. O / S 데이터 구분

| 구분 | 정의 | CareFlow 예시 |
|---|---|---|
| **O (Objective)** | 측정 가능한 객관적 자료 | 자이로스코프 수치, 심박수, HRV, 걸음수 |
| **S (Subjective)** | 환자가 직접 표현한 주관적 자료 | "어지럽다", "속이 메슥거린다", 사용자 메모 |

CareFlow Apple Watch는 주로 **O 데이터** 수집.
**S 데이터**는 사용자 메모(`userNotes`) 기능으로 보완.

---

### 1-5. 전정기관 관련 임상 지식 (CareFlow 핵심 도메인)

#### 전정기관(Vestibular System)이란?
- 위치: 내이(inner ear) 안쪽
- 기능: 균형 감지, 눈-머리 협응, 공간 방향감
- 관련 센서: 반고리관(각속도) + 이석기관(선형 가속도)

#### Apple Watch 센서와 전정기관의 연결

| 전정 기능 | 대응 센서 | 측정 항목 |
|---|---|---|
| 반고리관 (각속도) | 자이로스코프 | `gyroscope.magnitude` (rad/s) |
| 이석기관 (선형 가속도) | 가속도계 | `accelerometer.tilt` (°) |
| 자율신경 반응 | HealthKit | 심박수 변화, HRV |

#### 신뢰도(Confidence) 계산 원리

```
Confidence = 자이로 점수 + 기울기 점수 + 심박 점수 (0~100)

자이로 점수:  회전속도 ≥3.0 rad/s  → 최대 40점
기울기 점수:  기울기 변화 ≥20°     → 최대 30점
심박 점수:   심박 변화 ≥기준치     → 최대 30점
```

#### 신뢰도 → NANDA 매핑

```
🟢  0~19점  → Readiness for enhanced balance
🟡 20~49점  → Risk for falls
🟠 50~79점  → Actual impaired balance Related To vestibular input
🔴  80~100점 → PC: Vestibular disorder complication
```

---

### 1-6. 간호과정 5단계 (Nursing Process)

| 단계 | 내용 | CareFlow 해당 기능 |
|---|---|---|
| **사정(Assessment)** | 자료 수집 | Apple Watch 센서 + HealthKit |
| **진단(Diagnosis)** | 간호진단 도출 | 🚦 × NANDA 분류 |
| **계획(Planning)** | 중재 목표 설정 | 신호등 기반 알림 프로토콜 |
| **수행(Implementation)** | 간호 중재 실행 | 알림 → 사용자 행동 유도 |
| **평가(Evaluation)** | 효과 평가 | 에피소드 히스토리 분석 |

---

## PART 2. 개발 기술 지식

---

### 2-1. Swift / SwiftUI 기초

#### 필수 개념

| 개념 | 설명 | CareFlow 사용 예 |
|---|---|---|
| `@Published` | 값 변경 시 UI 자동 업데이트 | `currentSeverity`, `isDetecting` |
| `@EnvironmentObject` | 앱 전체 공유 상태 | `WatchDizzinessDetector`, `MotionSensorManager` |
| `ObservableObject` | 관찰 가능한 클래스 | 모든 Manager/Detector 클래스 |
| `async/await` | 비동기 처리 | HealthKit 데이터 fetch, API 전송 |
| `enum` with `Codable` | 직렬화 가능한 열거형 | `DizzinessSeverity`, `Posture` |
| `struct` | 값 타입 데이터 모델 | `DizzinessEpisode`, `PhenomenonObservation` |

#### SwiftUI View 구조 패턴

```swift
struct MyView: View {
    @EnvironmentObject var detector: WatchDizzinessDetector

    var body: some View {
        // UI 선언
    }
}
```

---

### 2-2. watchOS 앱 구조

#### 파일 구조 이해

```
CareFlowWatch/
├── Shared/                      ← iOS + watchOS 공용
│   ├── Models.swift             ← 데이터 모델 (DizzinessSeverity 등)
│   └── CareFlowAPIClient.swift  ← 서버 통신
│
├── CareFlowWatch Watch App/     ← watchOS 전용
│   ├── WatchMainView.swift      ← Watch UI
│   ├── WatchDizzinessDetector.swift ← 감지 알고리즘
│   └── MotionSensorManager.swift    ← 센서 관리
│
└── CareFlowWatch/               ← iOS 전용
    ├── ContentView.swift        ← iPhone UI
    ├── HealthKitManager.swift   ← HealthKit 연동
    └── WatchConnectivityManager.swift ← Watch 통신
```

#### Target 개념
Xcode에서 iOS App과 watchOS App은 **별개의 Target**. Shared 폴더 파일은 두 Target에 모두 추가해야 컴파일됨.

---

### 2-3. CMMotionManager (핵심 센서)

#### 수집 데이터

```swift
// 자이로스코프: 회전 각속도 (rad/s)
let gyroX = motion.rotationRate.x
let gyroY = motion.rotationRate.y
let gyroZ = motion.rotationRate.z
let magnitude = sqrt(x²+y²+z²)  // 전체 회전 크기

// 가속도계: 중력 포함 선형 가속도 (g)
let accelX = motion.gravity.x
let accelY = motion.gravity.y
let accelZ = motion.gravity.z
let tilt = acos(z) * 180/π      // 기울기 각도 (도)
```

#### 주의사항
- `CMMotionManager`는 **watchOS에서만** 사용 가능 (iOS에서도 가능하지만 CareFlow는 Watch 전용)
- 샘플링 주파수: 기본 10Hz (`normal` 모드) — 배터리와 정확도 균형
- 백그라운드 실행 시 watchOS Extended Runtime Session 필요

---

### 2-4. HealthKit

#### 권한 구조
HealthKit은 **읽기(read) / 쓰기(write) 권한을 별도 요청**. CareFlow는 읽기만 사용.

#### CareFlow 수집 항목

| 항목 | HealthKit 식별자 | 단위 |
|---|---|---|
| 심박수 | `.heartRate` | count/min (bpm) |
| 안정 심박수 | `.restingHeartRate` | bpm |
| HRV | `.heartRateVariabilitySDNN` | ms |
| 걸음수 | `.stepCount` | count |
| 수면 분석 | `.sleepAnalysis` | 카테고리 |
| 혈중 산소 | `.oxygenSaturation` | % |
| 활동 에너지 | `.activeEnergyBurned` | kcal |

#### 주의사항
- 시뮬레이터에서 HealthKit 데이터 없음 → 실기기(iPhone + Apple Watch) 필수
- Info.plist에 `NSHealthShareUsageDescription` 필수 기재

---

### 2-5. WatchConnectivity (iPhone ↔ Watch 통신)

#### 두 가지 전송 방식

| 방식 | 특징 | CareFlow 용도 |
|---|---|---|
| `sendMessage(_:replyHandler:)` | 실시간, 양쪽 활성 상태 필요 | 즉각 에피소드 전송 |
| `transferUserInfo(_:)` | 백그라운드, 큐잉 | Watch 비활성 시 저장 후 전송 |

#### 통신 흐름

```
Apple Watch                    iPhone
WatchDizzinessDetector    →   WatchConnectivityManager
  에피소드 완료                   수신 → recentEpisodes 추가
  sendMessage()              →  relayEpisodeToServer()
                                 CareFlowAPIClient.sendDizzinessEpisode()
                                   ↓
                              Next.js 서버 /api/sensors/dizziness
```

---

### 2-6. CareFlow API 서버 (Next.js)

#### 엔드포인트

| Method | Path | 용도 |
|---|---|---|
| POST | `/api/sensors/healthkit` | HealthKit 일일 데이터 저장 |
| GET | `/api/sensors/healthkit?days=N` | 히스토리 조회 |
| POST | `/api/sensors/dizziness` | 어지럼증 에피소드 저장 |

#### 개발 환경
- **로컬**: `http://localhost:3000`
- **실기기 테스트**: Mac IP 주소로 변경 필요 (같은 WiFi 네트워크)
  ```swift
  CareFlowAPIClient(baseURL: "http://192.168.x.x:3000")
  ```

---

## PART 3. CareFlow 통합 설계 원칙

---

### 3-1. 데이터 흐름 전체 그림

```
[Apple Watch]
  CMMotionManager (자이로 + 가속도)
       ↓ 10Hz
  MotionSensorManager.onNewDataPoint
       ↓
  WatchDizzinessDetector.processNewData()
       ↓ calculateConfidence() → getSeverity()
  🚦 DizzinessSeverity (.none / .mild / .moderate / .severe)
       ↓ 에피소드 감지 (연속 이상 신호 N회)
  DizzinessEpisode (시작~종료 구간)
       ↓ 완료 시
  WatchConnectivity → [iPhone] WatchConnectivityManager
       ↓
  CareFlowAPIClient → [서버] Next.js → DB 저장
```

---

### 3-2. 핵심 알고리즘: 에피소드 감지

```
1. 매 센서 데이터마다 confidence 계산
2. confidence ≥ alertThreshold(70) → consecutiveAnomalies++
3. consecutiveAnomalies ≥ 3 → 에피소드 시작 (startEpisode)
4. confidence < alertThreshold → consecutiveAnomalies = 0
5. 0으로 리셋 후 minDuration(5초) 이상이면 → 에피소드 종료 (endEpisode)
6. 에피소드 duration < minDuration → 무시 (노이즈 필터링)
```

---

### 3-3. 간호 × 기술 용어 대응표

| 간호 용어 | 기술 용어 | 코드 |
|---|---|---|
| 간호사정 (O 데이터) | 센서 측정값 | `DizzinessDataPoint` |
| 간호진단 4유형 | `DizzinessSeverity` enum | `.none/.mild/.moderate/.severe` |
| 실제 간호진단 | 에피소드 감지 | `DizzinessEpisode` |
| 현상 관찰 (v4.1) | `PhenomenonObservation` | `.phenomenon`, `.nandaExpression` |
| 신뢰도 평가 | Confidence Score | `0.0 ~ 100.0` |
| 간호 중재 | 알림 트리거 | `triggerAlert()` |
| 협력문제 (PC) | `.severe` case | `🔴 PC:` 메시지 |

---

### 3-4. Xcode 개발 체크리스트

프로젝트를 처음 열거나 팀에 합류할 때 확인할 항목들.

**환경 설정**
- [ ] Xcode 최신 버전 (15.0+)
- [ ] iOS 17+ / watchOS 10+ 타겟 확인
- [ ] Apple Developer 계정 + 인증서
- [ ] 실기기 2대 (iPhone + Apple Watch) 등록

**빌드 전 확인**
- [ ] `Shared/` 파일이 양쪽 Target에 추가되어 있는지
- [ ] HealthKit capability 추가 (iOS Target)
- [ ] Info.plist 권한 문구 작성 (`NSHealthShareUsageDescription`)
- [ ] WatchConnectivity capability 추가 (양쪽 Target)
- [ ] Background Modes: "Workout processing" 추가 (Watch Target)

**로컬 서버 연결**
- [ ] Next.js 서버 실행 (`npm run dev`)
- [ ] iPhone과 Mac이 같은 WiFi 연결 확인
- [ ] `CareFlowAPIClient(baseURL:)` IP 주소 설정

---

## PART 4. 빠른 참조 카드

---

### 🚦 신호등 × NANDA — 한 눈에 보기

```
🟢 NONE     → Readiness for enhanced ~~
             → 정상, 더 좋아질 수 있음
             → confidence < 20

🟡 MILD     → Risk for falls
             → 위험 요소 존재, 예방적 관찰
             → confidence 20~49

🟠 MODERATE → Actual impaired balance Related To vestibular input
             → 현상 발생 중, 간호 중재 시작
             → confidence 50~79

🔴 SEVERE   → PC: Vestibular disorder complication
             → 의료팀 즉각 연결 필요
             → confidence ≥ 80
```

---

### v4.1 현상 기술 템플릿

```
🟠 실제 간호진단:
"[관찰된 현상] Related To [관련 요인]"
예: "균형감각 변화 Related To 전정기능 입력 불일치"

🔴 협력문제:
"PC: [의학적 상태] — [간호 역할]"
예: "PC: 전정기능 장애 가능성 — 즉각적 의료 평가 요청"
```

---

### 자주 혼동하는 개념 정리

| 혼동 쌍 | 차이 |
|---|---|
| 간호진단 vs 의학진단 | 간호 = 인간 반응 / 의학 = 질병 자체 |
| 🟡 Risk vs 🟠 Actual | Risk = 아직 발생 안 함 / Actual = 지금 발생 중 |
| 🟠 Actual vs 🔴 PC | Actual = 간호 단독 중재 가능 / PC = 의료팀 필수 |
| O 데이터 vs S 데이터 | O = 측정값 / S = 환자 표현 |
| confidence vs severity | confidence = 0~100 점수 / severity = 4단계 분류 |
| `DizzinessEpisode` vs `DizzinessDataPoint` | Episode = 구간 전체 / DataPoint = 1초 단위 측정값 |

---

*CareFlow Knowledge Guide v1.0 — 2026.03*
*"의학적 진단을 하지 않는다. 그 질병에 대한 인간의 반응에 집중한다."*
