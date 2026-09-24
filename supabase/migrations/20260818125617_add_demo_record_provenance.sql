alter table public.daily_logs
  add column if not exists is_demo boolean not null default false;

alter table public.sleep_logs
  add column if not exists is_demo boolean not null default false;

create index if not exists daily_logs_user_demo_date_idx
  on public.daily_logs (user_id, is_demo, log_date);

create index if not exists sleep_logs_user_demo_date_idx
  on public.sleep_logs (user_id, is_demo, sleep_date);

comment on column public.daily_logs.is_demo is
  'true이면 실제 환자 기록이 아닌 제품 시연용 가상자료';

comment on column public.sleep_logs.is_demo is
  'true이면 실제 환자 기록이 아닌 제품 시연용 가상자료';
