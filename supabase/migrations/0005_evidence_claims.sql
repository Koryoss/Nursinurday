-- 주장 근거화 레지스트리 (본인 확인 후 수동 저장)
create table evidence_claims (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid() references auth.users(id) on delete cascade,
  claim               text not null,
  source_title        text,
  source_file         text,
  source_page         int,
  similarity          float,
  strength            text not null check (strength in ('강', '중', '약', '출처 미확인')),
  application_context text,
  safety_note         text,
  raw_chunks          jsonb,
  created_at          timestamptz default now()
);
alter table evidence_claims enable row level security;
create policy "evidence_claims_rw" on evidence_claims
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
