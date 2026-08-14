-- CareFlow Watch 기록: 워치는 입력만, 결과 확인은 로그인한 CareFlow iPhone 앱에서 한다.
-- 의료적 판정값은 저장하지 않으며, 관찰 시각·입력 방식·사용자 메모만 보관한다.

create table if not exists watch_observations (
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

alter table watch_observations enable row level security;

-- 대시보드는 로그인한 사용자의 기록을 최신순으로 조회한다.
create index watch_observations_user_observed_at_idx
  on watch_observations (user_id, observed_at desc);

create policy "watch observations belong to their user"
  on watch_observations for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
