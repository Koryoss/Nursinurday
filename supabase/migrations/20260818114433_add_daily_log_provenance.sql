alter table public.daily_logs
  add column if not exists record_source text not null default 'direct',
  add column if not exists source_period_start date,
  add column if not exists source_period_end date;

alter table public.daily_logs
  drop constraint if exists daily_logs_record_source_check;

alter table public.daily_logs
  add constraint daily_logs_record_source_check
  check (record_source in ('direct', 'historical_weekly_recall'));

alter table public.daily_logs
  drop constraint if exists daily_logs_historical_period_check;

alter table public.daily_logs
  add constraint daily_logs_historical_period_check
  check (
    record_source <> 'historical_weekly_recall'
    or (
      source_period_start is not null
      and source_period_end is not null
      and source_period_start <= source_period_end
    )
  );

create index if not exists daily_logs_user_date_idx
  on public.daily_logs (user_id, log_date);

comment on column public.daily_logs.record_source is
  'direct: 앱에서 직접 입력, historical_weekly_recall: 과거 한 주를 회고해 작성한 자료에서 옮긴 시간대별 대표값';
comment on column public.daily_logs.source_period_start is
  '이관 자료가 회고한 기간의 시작일';
comment on column public.daily_logs.source_period_end is
  '이관 자료가 회고한 기간의 종료일';
