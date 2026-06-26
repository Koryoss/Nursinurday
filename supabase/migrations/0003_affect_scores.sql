-- CareFlow P1 affect extensions — selectable emotion scores (SPEC §3·§5).
-- 비의료기기: 진단/예후/처방 필드 없음. 본인 daily_logs 소유권 기준 RLS.

create table if not exists affect_scores (
  id uuid primary key default gen_random_uuid(),
  daily_log_id uuid not null references daily_logs on delete cascade,
  affect text not null check (affect in ('anxiety','tension','sadness','irritation','fear','numbness','other')),
  score int not null check (score between 0 and 10),
  created_at timestamptz default now()
);

alter table affect_scores enable row level security;

drop policy if exists own_affect_scores on affect_scores;
create policy own_affect_scores on affect_scores for all
  using (exists (select 1 from daily_logs d where d.id = daily_log_id and d.user_id = auth.uid()))
  with check (exists (select 1 from daily_logs d where d.id = daily_log_id and d.user_id = auth.uid()));
