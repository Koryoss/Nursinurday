/**
 * Study Workspace 공용 검색 헬퍼 (docs/ai-flow.md §3 Evidence Assistant)
 *
 * evidenceAssistant.ts, app/api/study/query, app/api/study/claim이 모두 동일한
 * 임베딩 검색(match_study_chunks RPC) 패턴을 각자 구현하고 있어 여기로 모은다.
 * 이 함수는 검색만 수행하고 근거를 생성·해석하지 않는다 (SPEC §0).
 */

import type OpenAI from 'openai'
import type { SupabaseClient } from '@supabase/supabase-js'

export type StudyChunk = {
  doc_title: string
  page_num: number | null
  similarity: number
  content: string
  source_file?: string
}

export type StudyChunkSearchOptions = {
  matchCount?: number
  matchThreshold?: number
}

const DEFAULT_MATCH_COUNT = 6
const DEFAULT_MATCH_THRESHOLD = 0.3

export async function searchStudyChunks(
  openai: OpenAI,
  supabase: SupabaseClient,
  query: string,
  options: StudyChunkSearchOptions = {}
): Promise<{ chunks: StudyChunk[]; error: string | null }> {
  const trimmed = query.trim()
  if (!trimmed) return { chunks: [], error: null }

  const embRes = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: trimmed,
  })

  const { data, error } = await supabase.rpc('match_study_chunks', {
    query_embedding: embRes.data[0].embedding,
    match_count: options.matchCount ?? DEFAULT_MATCH_COUNT,
    match_threshold: options.matchThreshold ?? DEFAULT_MATCH_THRESHOLD,
  })

  if (error) return { chunks: [], error: error.message }
  return { chunks: (data ?? []) as StudyChunk[], error: null }
}
