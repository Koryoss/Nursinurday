-- CareFlow P3 feedback — 베타 피드백 저장. RLS: 본인 피드백만 insert/select.
create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  rating int not null check (rating between 1 and 5),
  message text,
  page_path text,
  created_at timestamptz default now()
);

alter table feedback enable row level security;

create policy own_feedback_insert on feedback
  for insert
  with check (user_id = auth.uid());

create policy own_feedback_select on feedback
  for select
  using (user_id = auth.uid());
