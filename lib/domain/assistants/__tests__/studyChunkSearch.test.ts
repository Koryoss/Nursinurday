import { describe, it, expect, vi } from 'vitest'
import { searchStudyChunks } from '../studyChunkSearch'

function makeOpenAI(embedding: number[] = [0.1, 0.2, 0.3]) {
  return {
    embeddings: {
      create: vi.fn().mockResolvedValue({ data: [{ embedding }] }),
    },
  } as any
}

function makeSupabase(result: { data: any; error: any }) {
  return {
    rpc: vi.fn().mockResolvedValue(result),
  } as any
}

describe('searchStudyChunks', () => {
  it('빈 질의어는 검색 없이 빈 결과를 반환한다', async () => {
    const openai = makeOpenAI()
    const supabase = makeSupabase({ data: [], error: null })

    const result = await searchStudyChunks(openai, supabase, '   ')

    expect(result).toEqual({ chunks: [], error: null })
    expect(openai.embeddings.create).not.toHaveBeenCalled()
    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it('기본 match_count/match_threshold(6, 0.3)로 RPC를 호출한다', async () => {
    const openai = makeOpenAI()
    const supabase = makeSupabase({ data: [], error: null })

    await searchStudyChunks(openai, supabase, '메니에르병 어지럼')

    expect(openai.embeddings.create).toHaveBeenCalledWith({
      model: 'text-embedding-3-small',
      input: '메니에르병 어지럼',
    })
    expect(supabase.rpc).toHaveBeenCalledWith('match_study_chunks', {
      query_embedding: [0.1, 0.2, 0.3],
      match_count: 6,
      match_threshold: 0.3,
    })
  })

  it('옵션으로 넘긴 matchCount/matchThreshold를 그대로 사용한다 (study/claim의 5건 검색 등)', async () => {
    const openai = makeOpenAI()
    const supabase = makeSupabase({ data: [], error: null })

    await searchStudyChunks(openai, supabase, '주장 텍스트', { matchCount: 5, matchThreshold: 0.4 })

    expect(supabase.rpc).toHaveBeenCalledWith('match_study_chunks', {
      query_embedding: [0.1, 0.2, 0.3],
      match_count: 5,
      match_threshold: 0.4,
    })
  })

  it('RPC 오류 시 에러 메시지를 반환하고 chunks는 빈 배열이다', async () => {
    const openai = makeOpenAI()
    const supabase = makeSupabase({ data: null, error: { message: 'connection failed' } })

    const result = await searchStudyChunks(openai, supabase, '질문')

    expect(result).toEqual({ chunks: [], error: 'connection failed' })
  })

  it('성공 시 RPC가 반환한 청크 배열을 그대로 전달한다', async () => {
    const chunks = [
      { doc_title: '논문 A', page_num: 3, similarity: 0.82, content: '내용 A' },
      { doc_title: '논문 B', page_num: null, similarity: 0.55, content: '내용 B' },
    ]
    const openai = makeOpenAI()
    const supabase = makeSupabase({ data: chunks, error: null })

    const result = await searchStudyChunks(openai, supabase, '질문')

    expect(result).toEqual({ chunks, error: null })
  })
})
