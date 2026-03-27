# 📐 CareFlow 임계값 근거 문서
> 버전: v1.0 | 작성일: 2026.03
> 목적: CareFlow 신뢰도 점수 및 NANDA 분류 임계값의 의학·공학적 근거 정리
> 원칙: 검증되지 않은 값은 "가정(assumption)"으로 명시, 임상 근거가 있는 값은 출처 표기

---

## ⚠️ 먼저 읽어야 할 것 — 중요한 발견

문헌 검토 결과, **현재 CareFlow의 감지 접근 방식이 메니에르증후군에 대해 근본적으로 재검토가 필요**한 것으로 확인됐다.

### 핵심 문제

**현재 CareFlow의 가정:**
> 어지럼증 발작 → 몸이 많이 흔들린다 → 자이로 수치 상승 → 감지

**문헌이 말하는 메니에르 발작의 실제:**
> 메니에르 발작 직전 → **심박이 먼저 오른다** (교감신경 활성화)
> 메니에르 발작 중 → **환자는 움직이지 않으려 한다** (몸을 고정하고 버팀)
> 따라서 → 발작 중 자이로 수치가 오히려 **낮아질 수 있음**

이것은 알고리즘 설계의 전제가 바뀌어야 함을 의미한다.

---

## 1. 자이로스코프 임계값 (gyroVelocity)

### 현재 설정값

```swift
var gyroVelocity: Double = 2.0  // rad/s (이상 감지 시작점)
// confidence 포화점: 4.0 rad/s (2.0 × 2)
```

### 문헌 근거

#### 일상 활동 중 손목 자이로스코프 수치 (wrist-worn)

| 구분 | 각속도 | 출처 |
|---|---|---|
| 일상 활동 (ADL) 손목 | **241 deg/s = 4.21 rad/s** | Threshold Analysis of Wrist-Worn Motion Sensor Signals [1] |
| 낙상 손목 | **897 deg/s = 15.7 rad/s** | 동일 [1] |
| Apple Watch 측정 오차(RMSE) | **0.18~0.22 rad/s** | Can We Trust Inertial and Heart Rate Sensor Data from an APPLE Watch Device? [2] |

#### 머리 부착 IMU 자이로스코프 수치 (참고)

| 구분 | 각속도 | 출처 |
|---|---|---|
| 건강한 성인 보행 시 머리 | **~10 deg/s = 0.17 rad/s** | Characterization of head movement patterns in vestibular patients [3] |
| 전정기능 저하 환자 (양측) | **8~12 deg/s = 0.14~0.21 rad/s** | 동일 [3] |

### ❗ 문제점 분석

```
현재 CareFlow 임계값:  2.0 rad/s
일상 활동(ADL) 실측:   4.21 rad/s
```

**→ 현재 threshold(2.0 rad/s)는 일상 활동(4.21 rad/s)보다 낮다.**
정상 보행 중 손목 스윙만으로도 threshold를 초과할 가능성이 매우 높다.
특히 이 환자는 보행 시 균형 보상 전략으로 팔을 더 많이 사용할 수 있다.

### 근거 기반 수정 제안

| 항목 | 현재 | 문헌 근거 기반 수정 제안 |
|---|---|---|
| `gyroVelocity` (이상 시작) | 2.0 rad/s | **4.5~5.0 rad/s** (ADL 상단 + 여유) |
| confidence 포화점 | 4.0 rad/s | **10.0 rad/s** |
| 낙상/급성 발작 | (없음) | **≥ 10 rad/s** = 즉각 🔴 고려 |

> ⚠️ 메니에르 발작은 자이로 수치 상승보다 **심박 변화가 먼저** 나타남 (섹션 3 참조)

---

## 2. 기울기 임계값 (tiltChange)

### 현재 설정값

```swift
var tiltChange: Double = 15.0  // degrees
// confidence 포화점: 30° (15 × 2)
```

### 문헌 근거

| 구분 | 기울기 | 임상적 의미 | 출처 |
|---|---|---|---|
| 정상 보행 중 골반 기울기 | **5~15°** | 정상 범위 | Predicting falls in older adults [4] |
| 노인 낙상 위험 전방 경사 | **15°+** 증가 | 낙상 위험 지표 | 동일 [4] |
| 실제 낙상 발생 시 가속도 | **6.891 g** | 낙상 판별 기준 | Wrist-worn motion sensor threshold analysis [1] |

> **참고:** tilt는 신체 전체의 기울기가 아니라 **손목의 기울기**이므로,
> 신체 자세와의 직접 연관성이 낮음.
> 특히 Apple Watch는 손목에서 측정 — 팔 위치에 따라 tilt가 크게 변함.

### 근거 기반 수정 제안

| 항목 | 현재 | 수정 제안 |
|---|---|---|
| `tiltChange` | 15° | **20~25°** (정상 보행 상단 초과 기준) |
| confidence 기여도(30%) | 유지 | 자이로 가중치(40%) 보다 낮으므로 유지 |

> 단, 손목 tilt는 자세 기울기의 **간접 지표**임을 인식하고 가중치 낮출 것을 검토

---

## 3. 심박수 임계값 (heartRateChange) ← 가장 중요한 발견

### 현재 설정값

```swift
var baselineHeartRate: Double = 72.0   // 고정값 (개인화 없음)
var heartRateChange: Double = 15.0     // bpm 변화량
// confidence 포화점: 30 bpm 변화 (15 × 2)
```

### 문헌 근거 — 메니에르 발작과 심박의 관계

#### 핵심 연구 결과

**메니에르 발작 전 교감신경 활성화 패턴 (Frontiers in Neurology, 2022)** [5]

> "Heart rate representing sympathetic function was **statistically significantly higher just before an attack** than the values in the stable phase."
> (심박수가 발작 직전에 안정기보다 통계적으로 유의하게 높았다)

> "All nine patients whose HRV data had been obtained just before an attack showed marked **suppression of the parasympathetic nervous system** and **activation of the sympathetic nervous system**."
> (발작 직전 모든 환자에서 부교감신경 억제 + 교감신경 활성화 확인)

**HRV 분석 연구 (PubMed, 1999)** [6]

> 메니에르 발작 간격(interictal period)에서 **부교감신경 기능 저하 + 기립 시 교감 반응 감소**가 관찰됨.
> 발작 중에는 교감신경 활성화 수치가 유의하게 상승.

**어지럼증 환자 심박/호흡 변화 연구 (PubMed, 1998)** [7]

> 전정기능 이상 환자에서 현기증을 유발하는 머리 움직임 후 **심박수 및 호흡수 변화** 관찰됨.

### ❗ 중요한 함의

```
메니에르 발작 타임라인:

[안정기]          [발작 직전]         [발작 중]          [발작 후]
HR 낮음           HR 상승 시작        교감↑ 부교감↓      부교감 회복
HRV 정상          LF/HF 비율 변화     HR 고점             HR 안정화
자이로 낮음        자이로 낮음         자이로 낮음          자이로 낮음
                  ← 여기서 감지 가능! →
```

**→ 심박 변화가 자이로 변화보다 먼저 일어난다.**
**→ HRV(LF/HF ratio)가 가장 민감한 조기 지표이다.**

### 근거 기반 수정 제안

| 항목 | 현재 | 수정 제안 | 근거 |
|---|---|---|---|
| `baselineHeartRate` | 72.0 (고정) | **HealthKit 안정 심박수(restingHeartRate) 자동 사용** | 개인화 필수 |
| `heartRateChange` | 15 bpm | **10 bpm** (조기 감지 민감도 향상) | 발작 직전 유의한 상승 근거 |
| confidence 내 HR 가중치 | 30% | **40%로 상향** (자이로와 동일) | HRV가 1차 지표임 |
| HRV 모니터링 | 없음 | **LF/HF ratio 추적 추가** (미래 기능) | 가장 민감한 조기 지표 |

---

## 4. NANDA 분류 임계값 (20 / 50 / 80)

### 현재 설정값

```swift
🟢 < 20   → .none (Readiness)
🟡 20~49  → .mild (Risk)
🟠 50~79  → .moderate (Actual)
🔴 ≥ 80  → .severe (PC)
```

### 문헌 근거

**직접적 임상 근거: 없음.**

이 값들은 0~100 점수 체계를 4등분에 가깝게 나눈 것으로,
공학적 신호 처리 논문에서 유사한 4단계 분류를 사용하는 사례가 있으나
NANDA 간호진단과 직접 연결된 임계값 연구는 존재하지 않음.

### 간접 근거

| 구분 | 수치 | 출처 |
|---|---|---|
| Apple Watch 낙상 감지 경보 임계값 | 시스템 내부 (미공개) | Apple [8] |
| 스마트워치 낙상 감지 알고리즘 sensitivity | 실험 조건에서 **80~90%** 정확도 | JMIR Formative Research [9] |
| 웨어러블 기반 균형 손상 분류 | 연구별 상이, **표준화 없음** | Quantitative Assessment of Balance Impairment [10] |

### 현실적 판단

> NANDA 4유형과 confidence 숫자의 매핑은 **임상적 검증이 필요한 가설**이다.
> 현재 20/50/80은 "합리적인 출발점"이지만, 이 환자 데이터를 축적한 후
> 실제 주관적 호소(S 데이터)와 confidence 수치를 대조하여 보정해야 한다.

---

## 5. 에피소드 감지 로직 파라미터

### 현재 설정값

```swift
var minDuration: TimeInterval = 5.0   // 에피소드 최소 지속 시간 (초)
var alertThreshold: Double = 70.0     // 알림 발송 기준 confidence
consecutiveAnomalies = 3             // 연속 이상 횟수 (0.3초 = 3 × 10Hz)
```

### 문헌 근거

**메니에르 발작 지속 시간 (Mayo Clinic)** [11]

> 메니에르 전형적 발작 지속 시간: **20분~수 시간**
> 최소 기준: **20분 이상** 지속되어야 메니에르 발작으로 분류

```
현재 CareFlow minDuration = 5초
메니에르 발작 최소 = 20분 = 1200초
```

**→ 5초는 메니에르 발작 감지 기준으로는 너무 짧다.**
**→ 하지만 조기 경보 목적이라면 5초가 오히려 적합할 수 있다.**

### 수정 제안

| 목적 | 권장 minDuration | 이유 |
|---|---|---|
| 낙상 / 급성 기립 어지러움 감지 | **3~5초** (현재 유지) | 짧은 사건 포착 |
| 메니에르 발작 에피소드 기록 | **5~10분 (300~600초)** | 임상 정의에 부합 |
| 조기 경보 알림 | **5초** 유지 | 즉각 대응 유도 |

> 권고: 에피소드 타입을 두 가지로 분리
> - `ShortEvent` (5초+): 기립성 어지러움, 낙상 위험
> - `ExtendedEpisode` (5분+): 메니에르 발작 가능성

---

## 6. 이 환자(58세, 메니에르)에게 특화된 보정값

### 현재 약물 복용의 영향

메니에르에 흔히 처방되는 약물의 심박 영향:

| 약물 종류 | 심박 영향 | 임계값 영향 |
|---|---|---|
| 이뇨제 (Diuretics) | 직접 영향 미미 | `baselineHR` 개인 측정 필요 |
| 항히스타민 (Meclizine 등) | 심박 **감소** 가능 | `baselineHR` 낮게 설정 필요 |
| 베타차단제 (일부 처방) | 심박 **감소** 10~20 bpm | `heartRateChange` 임계값 5 bpm으로 낮춰야 할 수 있음 |
| 벤조디아제핀 (신경안정제) | 심박 **감소** | 동일 |

> **권고:** 첫 테스트 전, HealthKit에서 지난 30일 평균 안정 심박수를 추출하여
> `baselineHeartRate`를 개인화할 것.

### 만성 전정 기능 변화의 영향

2년 이상 메니에르를 겪은 환자는 **중추 보상(central compensation)**이 일어나
전정 신호에 대한 반응이 일반인과 다를 수 있다.

- 정상 보행 중 기저 자이로 값: 일반인보다 **낮을 가능성** (보상적 머리 고정 전략) [3]
- 발작 중 자이로 변화: **증가 폭이 작을 수 있음** (만성 적응)
- 반면 HR/HRV 변화: **여전히 유효한 지표** [5]

---

## 7. 종합: 근거 기반 임계값 재설계 로드맵

### Phase 1 — 즉시 수정 가능한 항목

| 파라미터 | 현재 | 수정값 | 근거 |
|---|---|---|---|
| `gyroVelocity` | 2.0 rad/s | **4.5 rad/s** | ADL wrist 실측값 4.21 rad/s 기반 [1] |
| `tiltChange` | 15° | **22°** | 정상 보행 상단(15°) + 여유 [4] |
| `heartRateChange` | 15 bpm | **10 bpm** | 발작 직전 조기 감지 [5] |
| `baselineHeartRate` | 72 (고정) | **HealthKit restingHeartRate 자동 사용** | 개인화 필수 |
| `minDuration` | 5.0초 | **10.0초** (짧은 오류 감소) | 노이즈 필터 강화 |

### Phase 2 — 테스트 후 보정

첫 2주 데이터 수집 후:
1. 정상 보행 시 평균 confidence 측정
2. 주관 어지러움 3점 이상 시 confidence와 대조
3. 20/50/80 임계값 환자 데이터 기반 이동

### Phase 3 — 미래 기능 (알고리즘 개선)

- HRV (LF/HF ratio) 조기 경보 신호 추가
- 발작 전 교감신경 활성화 패턴 감지
- 이중 에피소드 타입 분리 (ShortEvent / ExtendedEpisode)

---

## 📚 참고 문헌 (출처 목록)

| # | 제목 | URL | 사용된 데이터 |
|---|---|---|---|
| [1] | Threshold Analysis of Wrist-Worn Motion Sensor Signals | https://scholar.smu.edu/cgi/viewcontent.cgi?article=1156&context=datasciencereview | ADL 241 deg/s, 낙상 897 deg/s |
| [2] | Can We Trust Inertial and Heart Rate Sensor Data from an APPLE Watch Device? (MDPI) | https://www.mdpi.com/2504-3900/49/1/128 | Apple Watch 측정 오차 0.18~0.22 rad/s |
| [3] | Characterization of head movement patterns in vestibular patients (Frontiers in Neuroscience, 2026) | https://www.frontiersin.org/journals/neuroscience/articles/10.3389/fnins.2026.1731221/full | 전정 환자 보행 각속도 8~12 deg/s |
| [4] | Predicting falls in older adults: an umbrella review (BMC Geriatrics) | https://bmcgeriatr.biomedcentral.com/articles/10.1186/s12877-022-03271-5 | 정상 보행 기울기 5~15° |
| [5] | Relationship Between the Onset of Ménière's Disease and Sympathetic Hyperactivity (Frontiers in Neurology, 2022) | https://www.frontiersin.org/journals/neurology/articles/10.3389/fneur.2022.804777/full | 발작 직전 HR 유의한 상승, 교감신경 활성화 |
| [6] | Autonomic nervous function in Meniere's disease evaluated by HRV (PubMed, 1999) | https://pubmed.ncbi.nlm.nih.gov/10530737/ | 발작 간기 부교감 저하, 발작 중 교감 활성화 |
| [7] | Changes in heart rate and respiration rate in vestibular dysfunction patients (PubMed, 1998) | https://pubmed.ncbi.nlm.nih.gov/9792487/ | 머리 움직임 후 HR 변화 관찰 |
| [8] | Apple Developer Documentation — Gyroscope and accelerometer | https://developer.apple.com/design/human-interface-guidelines/gyro-and-accelerometer | Apple Watch 센서 특성 |
| [9] | Effectiveness of a Smartwatch App in Detecting Induced Falls (JMIR Formative Research, 2022) | https://formative.jmir.org/2022/3/e30121/ | 낙상 감지 알고리즘 정확도 |
| [10] | Quantitative Assessment of Balance Impairment for Fall-Risk Estimation (IEEE) | https://ieeexplore.ieee.org/iel7/7361/8049536/08026138.pdf | 웨어러블 균형 손상 분류 |
| [11] | Meniere's disease — Diagnosis and treatment (Mayo Clinic) | https://www.mayoclinic.org/diseases-conditions/menieres-disease/diagnosis-treatment/drc-20374916 | 발작 최소 지속 시간 20분 |
| [12] | Oxidative stress and heart rate variability in patients with vertigo (PMC, 2017) | https://pmc.ncbi.nlm.nih.gov/articles/PMC5667254/ | HRV와 어지럼증 관계 |
| [13] | IMU-based Romberg Test for Vestibular Hypofunction (PMC, 2024) | https://pmc.ncbi.nlm.nih.gov/articles/PMC10776102/ | IMU 기반 전정기능 평가 |
| [14] | Wearable Sensors for Vestibular Rehabilitation — Pilot Study (iMedPub) | https://www.imedpub.com/articles/wearable-sensors-for-vestibular-rehabilitation-a-pilot-study.php?aid=39321 | 전정 재활 웨어러블 적용 |
| [15] | Analysis of autonomic nervous function in peripheral vestibular disorders (Frontiers, 2025) | https://www.frontiersin.org/journals/neurology/articles/10.3389/fneur.2025.1660277/full | 말초 전정 장애 자율신경 분석 |

---

*"임계값은 데이터에서 나온다. 지금 이 문서는 첫 번째 데이터를 얻기 위한 시작점이다."*
*CareFlow Threshold Evidence Base v1.0 — 2026.03*
