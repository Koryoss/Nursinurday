-- 메니에르 RAG 스터디 (본인 학습 전용)
-- 비의료기기: 진단·예후·처방 목적 없음. 논문 근거 인용만.

create extension if not exists vector;

create table study_docs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title       text not null,
  source_file text not null,
  page_count  int  default 0,
  chunk_count int  default 0,
  created_at  timestamptz default now()
);

create table study_chunks (
  id         uuid primary key default gen_random_uuid(),
  doc_id     uuid not null references study_docs on delete cascade,
  content    text not null,
  page_num   int  not null default 0,
  chunk_idx  int  not null,
  embedding  vector(1536),
  created_at timestamptz default now()
);

create index on study_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 50);

alter table study_docs   enable row level security;
alter table study_chunks enable row level security;

create policy "study_docs_rw" on study_docs
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "study_chunks_rw" on study_chunks
  for all to authenticated
  using (
    exists (
      select 1 from study_docs d
      where d.id = study_chunks.doc_id
        and d.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from study_docs d
      where d.id = study_chunks.doc_id
        and d.user_id = auth.uid()
    )
  );

create or replace function match_study_chunks(
  query_embedding vector(1536),
  match_count     int   default 5,
  match_threshold float default 0.3
)
returns table (
  id          uuid,
  doc_id      uuid,
  content     text,
  page_num    int,
  chunk_idx   int,
  doc_title   text,
  source_file text,
  similarity  float
)
language sql stable
as $$
  select
    c.id,
    c.doc_id,
    c.content,
    c.page_num,
    c.chunk_idx,
    d.title       as doc_title,
    d.source_file,
    1 - (c.embedding <=> query_embedding) as similarity
  from study_chunks c
  join study_docs   d on d.id = c.doc_id
  where c.embedding is not null
    and 1 - (c.embedding <=> query_embedding) > match_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
$$;
