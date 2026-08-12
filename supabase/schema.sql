-- CareFlow Supabase schema (SPEC §3 측정규격 기반). 비의료기기: 진단/예후 필드 없음.
-- 공통: 모든 테이블 RLS = 본인 행만 접근.

create type time_bucket as enum ('morning','afternoon','evening','before_sleep','attack');
create type symptom as enum ('dizziness','gait','tinnitus','headache','floaters','other');
create type band as enum ('low','normal','high');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  chat_mode text default 'gentle',          -- 'gentle' | 'formal'
  target_conditions text[] default '{}',     -- meniere, bppv, tinnitus ...
  consented_at timestamptz,
  created_at timestamptz default now()
);

create table daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  log_date date not null,
  bucket time_bucket not null,
  created_at timestamptz default now()
);

create table symptom_scores (   -- 몸 (0-10)
  id uuid primary key default gen_random_uuid(),
  daily_log_id uuid not null references daily_logs on delete cascade,
  symptom symptom not null,
  score int check (score between 0 and 10)
);

create table affect_logs (      -- 감정
  daily_log_id uuid primary key references daily_logs on delete cascade,
  anxiety int check (anxiety between 0 and 10),
  tension int check (tension between 0 and 10)
);

create table affect_scores (    -- 선택 감정 신호 (0-10)
  id uuid primary key default gen_random_uuid(),
  daily_log_id uuid not null references daily_logs on delete cascade,
  affect text not null check (affect in ('anxiety','tension','sadness','irritation','fear','numbness','other')),
  score int not null check (score between 0 and 10),
  created_at timestamptz default now()
);

create table social_logs (      -- 관계: '오늘 이해받았는가'
  daily_log_id uuid primary key references daily_logs on delete cascade,
  understood boolean
);

create table context_tags (     -- 환경 맥락
  daily_log_id uuid primary key references daily_logs on delete cascade,
  noise boolean default false, weather_change boolean default false, crowded boolean default false
);

create table sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  sleep_date date not null,
  bedtime time, waketime time,
  psqi_q1 int, psqi_q2 int, psqi_q3 int
);

create table weekly_checkins (  -- 부록 B 임상척도 (추세용)
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  week_start date not null,
  dhi_p int, dhi_e int, dhi_f int, thi int, hads_a int, hads_d int, vss_sf int
);

create table meaning_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  week_start date, note text
);

create table baselines (        -- 개인 7일 기준선 (파생)
  user_id uuid not null references auth.users on delete cascade,
  metric text not null, rolling7_mean numeric, rolling7_sd numeric,
  updated_at timestamptz default now(), primary key (user_id, metric)
);

create table social_return_indicators (  -- 사회복귀 지표 (파생, band만)
  user_id uuid not null references auth.users on delete cascade,
  ind_date date not null,
  readiness band, steadiness band, activity_range band,
  primary key (user_id, ind_date)
);

create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  rating int not null check (rating between 1 and 5),
  message text,
  page_path text,
  created_at timestamptz default now()
);

-- 워치 기록: 워치는 입력만, 결과 확인은 로그인한 CareFlow iPhone 앱에서 한다.
-- 의료적 판정값은 저장하지 않으며, 관찰 시각·입력 방식·사용자 메모만 보관한다.
create table watch_observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  episode_id text not null,
  observed_at timestamptz not null,
  is_manual_report boolean not null default false,
  posture text,
  note text,
  sample_count integer not null default 0 check (sample_count >= 0),
  source text not null default 'apple_watch',
  created_at timestamptz not null default now(),
  unique (user_id, episode_id)
);

-- RLS
do $$ declare t text; begin
  foreach t in array array['profiles','daily_logs','symptom_scores','affect_logs','affect_scores','social_logs','context_tags','sleep_logs','weekly_checkins','meaning_notes','baselines','social_return_indicators','feedback','watch_observations']
  loop execute format('alter table %I enable row level security;', t); end loop;
end $$;
-- 정책 예시(직접 user_id 가진 테이블): 본인만
create policy own_rows on daily_logs using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_feedback_insert on feedback for insert with check (user_id = auth.uid());
create policy own_feedback_select on feedback for select using (user_id = auth.uid());
-- ※ 자식 테이블(symptom_scores 등)은 daily_logs 조인 기반 정책을 마이그레이션에서 추가.
create policy own_affect_scores on affect_scores for all
  using (exists (select 1 from daily_logs d where d.id = daily_log_id and d.user_id = auth.uid()))
  with check (exists (select 1 from daily_logs d where d.id = daily_log_id and d.user_id = auth.uid()));
create policy "watch observations belong to their user" on watch_observations for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
