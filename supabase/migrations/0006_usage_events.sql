-- 베타 사용성 로그 (연구계획서 H1 검증용 자동 수집)
-- 비의료기기: 건강정보 아님. 화면 이동·기록 소요시간 등 사용성 이벤트만 저장.
create table usage_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  event      text not null check (event in ('screen_view','record_start','record_save','record_abandon')),
  screen     text,
  meta       jsonb,
  client     text not null default 'app',
  created_at timestamptz default now()
);

create index usage_events_user_created_idx on usage_events (user_id, created_at);

alter table usage_events enable row level security;

create policy "usage_events_insert_own" on usage_events
  for insert to authenticated with check (auth.uid() = user_id);

create policy "usage_events_select_own" on usage_events
  for select to authenticated using (auth.uid() = user_id);
