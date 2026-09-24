-- 워치 자동 센서 수집(움직임·심박·주변소음) 필드 추가.
-- 셋 다 워치에서 권한이 없거나 샘플이 없으면 NULL로 남는다 — "값 없음"이 정상 상태다.
-- 의료적 판정값이 아니라 HealthKit이 이미 계산한 원시 관찰값(심박·소음)과
-- 가속도 평균 스칼라(움직임)만 저장한다.

alter table watch_observations
  add column if not exists heart_rate_bpm numeric,
  add column if not exists ambient_noise_db numeric,
  add column if not exists movement_level numeric;
