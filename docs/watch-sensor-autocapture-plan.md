# 워치 자동 센서 수집 설계안 (초안)

작성일: 2026-09-17
상태: 1~3단계 코드 작성 완료(이 환경에는 Xcode가 없어 빌드 미검증 — 사용자 Mac에서 확인 필요)

## 0. 구현 완료 내역 (2026-09-17)

- `CareFlow.entitlements`, 신규 `CareFlowWatch.entitlements`에 `com.apple.developer.healthkit` 추가
- `CareFlow.xcodeproj/project.pbxproj`의 CareFlowWatch 타겟 Debug/Release에 `CODE_SIGN_ENTITLEMENTS` 배선
- 양쪽 `Info.plist`에 `NSHealthShareUsageDescription` 추가
- `WatchObservationSender.swift`: `requestHealthAuthorization()` 추가, `recordNow()`를 async로 바꿔 심박(HealthKit)·주변소음(HealthKit `environmentalAudioExposure`)·5초 가속도 평균(CoreMotion)을 병렬 수집 후 전송
- `WatchContentView.swift`: 탭 중 로딩 상태 표시, `onAppear`에서 HealthKit 권한 요청
- `WatchObservationReceiver.swift`: `heartRateBpm`/`ambientNoiseDb`/`movementLevel` 파싱·저장 추가
- `supabase/migrations/20260917120000_add_watch_sensor_fields.sql`: `watch_observations`에 nullable 컬럼 3개 추가
- `careflow-app/src/lib/watchStorage.ts`: 타입·Supabase upsert 매핑에 새 필드 반영 — 웹·모바일 양쪽 `tsc --noEmit` 통과 확인

다음 단계는 사용자 Mac Xcode에서 빌드 → 실기기(HealthKit은 시뮬레이터보다 실기기 권장)에서 권한
다이얼로그와 payload 값을 확인하는 것. Supabase 마이그레이션도 `supabase db push` 또는 대시보드에서
직접 적용해야 실제 컬럼이 생긴다(로컬에는 CLI가 없어 적용 못 함, 파일만 준비됨).

## 1. 배경 — 지금 뭐가 없는가

`careflow-app/ios/CareFlowWatch/WatchContentView.swift`의 "지금 기록하기" 버튼은
`WatchObservationSender.recordNow()`를 호출해 고정 페이로드만 보낸다.

```swift
let payload: [String: Any] = [
  "episodeId": UUID().uuidString,
  "observedAt": ISO8601DateFormatter().string(from: Date()),
  "isManualReport": true,
  "posture": "unknown",   // 항상 고정값
  "note": "워치에서 직접 남긴 기록",
  "sampleCount": 0,       // 항상 0
]
```

즉 지금은 "버튼을 눌렀다"는 사실과 시각만 기록될 뿐, 움직임·심박·주변소음 같은
센서 자동 수집 코드는 저장소 전체에 전혀 없다(확인 완료 — `CMMotion`, `HealthKit`,
`decibel`, `heartRate` 등 관련 키워드로 워치 관련 파일을 전수 검색했으나 매치 0건).

이 문서는 신청서(`docs/2026_IRB_참가신청서_최종본.md`, "모두의 창업" 초안)에 적힌
"watchOS 센서 시제품(움직임·심박·주변 소음 크기를 아이폰으로 전달)"이라는 문구를
실제로 구현하기 위한 설계다. 그 문구는 코드보다 앞서 있었다는 게 이번에
확인되어, 신청서 쪽은 우선 사실대로("수동 기록 버튼" 방식) 고쳐뒀다.

## 2. 설계 원칙

세 신호를 전부 "연속 백그라운드 스트리밍"으로 만들지 않는다. 워치 백그라운드
센서 세션(`WKExtendedRuntimeSession`)은 승인 가능한 세션 타입이 제한적이고
배터리·권한 이슈가 커서, 지금 앱의 "탭하면 그 순간을 기록한다"는 철학을
유지한 채 **버튼을 누른 시점에 짧게 burst 샘플링**하는 방식을 택한다.

- **심박**: 새로 측정을 시작하지 않는다. HealthKit에 이미 있는 최신 심박
  샘플 1건을 `HKSampleQuery`로 읽기만 한다.
- **주변소음**: 마이크를 직접 켜지 않는다. 워치 Noise 앱이 이미 계산해둔
  `HKQuantityTypeIdentifier.environmentalAudioExposure` 값을 HealthKit에서
  읽는다. 마이크 권한도, 오디오 원본 저장도 필요 없어 "의료적 판정값 저장
  안 함" 원칙과 사생활 리스크 양쪽에 안전하다.
- **움직임**: HealthKit에 바로 쓸 만한 값이 없다. `CMMotionManager
  .startDeviceMotionUpdates`로 버튼 탭 후 5~10초만 포그라운드에서 가속도를
  모아 평균 크기(스칼라 값 하나)만 계산하고, 원시 파형은 버린다.

## 3. 구현 순서

### 1단계 — HealthKit 권한 설정
- 워치 타겟(`CareFlowWatch`)과 iOS 타겟(`CareFlow`) 양쪽에 HealthKit
  capability(entitlements) 추가.
- `Info.plist`에 `NSHealthShareUsageDescription` 문구 추가.
- 앱 첫 실행 시 `HKHealthStore.requestAuthorization`으로 심박·
  `environmentalAudioExposure` 읽기 권한 요청 코드 작성.

### 2단계 — burst 샘플링 로직
- "지금 기록하기" 버튼 핸들러에서 (1) 심박 최신 샘플 조회 (2) 소음 최신
  샘플 조회 (3) `CMMotionManager`로 5~10초 가속도 평균 계산을 병렬로 실행.
- 세 값을 `WatchObservationSender.recordNow()` 페이로드에
  `heartRateBpm`, `ambientNoiseDb`, `movementLevel` 필드로 추가.

### 3단계 — 수신·저장·동기화 배선
- `careflow-app/ios/CareFlow/WatchObservationReceiver.swift`의 `store()`에
  같은 필드 파싱 추가.
- `supabase/migrations/`에 새 마이그레이션 추가 — `watch_observations`
  테이블에 `heart_rate_bpm`, `ambient_noise_db`, `movement_level` 컬럼
  3개(nullable — 값이 없으면 권한 미허용 또는 샘플 없음을 뜻함).
- `careflow-app/src/lib/watchStorage.ts` 동기화 로직에 새 필드 반영.
- 대시보드 표시는 지금 단계에서는 미루고, 데이터가 며칠 쌓인 뒤 표시
  여부를 판단한다.

## 4. 오늘 어디까지 가능한가

1~3단계 모두 **코드 작성 자체는 하루 세션 안에 가능**하다 — 파일 수는
많지만(Swift 3~4개, TS 1개, SQL 마이그레이션 1개) 전부 텍스트 편집이라
"1번만 가능"은 과소평가다.

다만 한계가 하나 있다: 이 작업 환경(Linux 샌드박스)에는 Xcode·macOS 툴체인이
없어서 watchOS/iOS 빌드·시뮬레이터 실행으로 검증할 수 없다. 즉 코드는 오늘
다 쓸 수 있어도, 실제로 컴파일이 되는지·HealthKit 권한 다이얼로그가 뜨는지·
워치-아이폰 간 실제 전달이 되는지는 사용자가 본인 Mac의 Xcode에서 빌드해서
확인해야 한다.

그래서 현실적인 오늘의 목표는: 1~3단계 코드를 전부 작성해서 넘겨드리고,
사용자가 Xcode에서 빌드 → 실기기(또는 시뮬레이터, HealthKit은 실기기 권장)에서
권한 다이얼로그·페이로드 값을 확인하는 것을 다음 단계로 남기는 것이다.

## 5. 관련 파일

- `careflow-app/ios/CareFlowWatch/WatchContentView.swift`
- `careflow-app/ios/CareFlowWatch/WatchObservationSender.swift`
- `careflow-app/ios/CareFlow/WatchObservationReceiver.swift`
- `careflow-app/ios/CareFlow/CareFlowWatchBridge.swift` / `.m`
- `careflow-app/src/lib/watchStorage.ts`
- `supabase/migrations/0007_watch_observations.sql` (기존 테이블 정의)
