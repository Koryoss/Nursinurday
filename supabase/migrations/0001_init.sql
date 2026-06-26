-- CareFlow P0 init — 스키마 + 전체 RLS (SPEC §3·§5). 비의료기기: 진단/예후 필드 없음.
create extension if not exists pgcrypto;

create type time_bucket as enum ('morning','afternoon','evening','before_sleep','attack');
create type symptom as enum ('dizziness','gait','tinnitus','headache','floaters','other');
create type band as enum ('low','normal','high');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  chat_mode text default 'gentle',
  target_conditions text[] default '{}',
  consented_at timestamptz,
  created_at timestamptz default now()
);
create table daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  log_date date not null, bucket time_bucket not null,
  created_at timestamptz default now()
);
create table symptom_scores (
  id uuid primary key default gen_random_uuid(),
  daily_log_id uuid not null references daily_logs on delete cascade,
  symptom symptom not null, score int check (score between 0 and 10)
);
create table affect_logs (
  daily_log_id uuid primary key references daily_logs on delete cascade,
  anxiety int check (anxiety between 0 and 10), tension int check (tension between 0 and 10)
);
create table social_logs (
  daily_log_id uuid primary key references daily_logs on delete cascade, understood boolean
);
create table context_tags (
  daily_log_id uuid primary key references daily_logs on delete cascade,
  noise boolean default false, weather_change boolean default false, crowded boolean default false
);
create table sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  sleep_date date not null, bedtime time, waketime time,
  psqi_q1 int, psqi_q2 int, psqi_q3 int
);
create table weekly_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  week_start date not null,
  dhi_p int, dhi_e int, dhi_f int, thi int, hads_a int, hads_d int, vss_sf int
);
create table meaning_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade, week_start date, note text
);
create table baselines (
  user_id uuid not null references auth.users on delete cascade,
  metric text not null, rolling7_mean numeric, rolling7_sd numeric,
  updated_at timestamptz default now(), primary key (user_id, metric)
);
create table social_return_indicators (
  user_id uuid not null references auth.users on delete cascade,
  ind_date date not null, readiness band, steadiness band, activity_range band,
  primary key (user_id, ind_date)
);

-- RLS 활성화
alter table profiles enable row level security;
alter table daily_logs enable row level security;
alter table symptom_scores enable row level security;
alter table affect_logs enable row level security;
alter table social_logs enable row level security;
alter table context_tags enable row level security;
alter table sleep_logs enable row level security;
alter table weekly_checkins enable row level security;
alter table meaning_notes enable row level security;
alter table baselines enable row level security;
alter table social_return_indicators enable row level security;

-- 본인 행만 (user_id 직접 보유)
create policy own_profile on profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy own_daily on daily_logs for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_sleep on sleep_logs for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_weekly on weekly_checkins for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_meaning on meaning_notes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_baseline on baselines for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_sri on social_return_indicators for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 자식 테이블: daily_logs 소유자 기준
create policy own_symptom on symptom_scores for all
  using (exists (select 1 from daily_logs d where d.id = daily_log_id and d.user_id = auth.uid()))
  with check (exists (select 1 from daily_logs d where d.id = daily_log_id and d.user_id = auth.uid()));
create policy own_affect on affect_logs for all
  using (exists (select 1 from daily_logs d where d.id = daily_log_id and d.user_id = auth.uid()))
  with check (exists (select 1 from daily_logs d where d.id = daily_log_id and d.user_id = auth.uid()));
create policy own_social on social_logs for all
  using (exists (select 1 from daily_logs d where d.id = daily_log_id and d.user_id = auth.uid()))
  with check (exists (select 1 from daily_logs d where d.id = daily_log_id and d.user_id = auth.uid()));
create policy own_context on context_tags for all
  using (exists (select 1 from daily_logs d where d.id = daily_log_id and d.user_id = auth.uid()))
  with check (exists (select 1 from daily_logs d where d.id = daily_log_id and d.user_id = auth.uid()));

-- 가입 시 profiles 자동 생성
create or replace function handle_new_user() returns trigger language plpgsql security definer as $$
begin insert into public.profiles (id) values (new.id) on conflict do nothing; return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();
