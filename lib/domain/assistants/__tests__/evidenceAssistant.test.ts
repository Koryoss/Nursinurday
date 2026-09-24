import { describe, it, expect, vi } from 'vitest'
import { runEvidenceAssistant, EVIDENCE_ASSISTANT_SYSTEM_PROMPT } from '../evidenceAssistant'

function makeOpenAI(opts: { embedding?: number[]; completionContent?: string } = {}) {
  return {
    embeddings: {
      create: vi.fn().mockResolvedValue({ data: [{ embedding: opts.embedding ?? [0.1, 0.2] }] }),
    },
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: opts.completionContent ?? '테스트 답변' } }],
        }),
      },
    },
  } as any
}

function makeSupabase(result: { data: any; error: any }) {
  return { rpc: vi.fn().mockResolvedValue(result) } as any
}

describe('runEvidenceAssistant', () => {
  it('검색 결과가 없으면 확인 불가 메시지 + 면책 문구를 반환하고 LLM을 호출하지 않는다', async () => {
    const openai = makeOpenAI()
    const supabase = makeSupabase({ data: [], error: null })

    const result = await runEvidenceAssistant(openai, supabase, { keyword: '존재하지 않는 개념' })

    expect(result.sources).toEqual([])
    expect(result.answer).toContain('근거 살용은 찾을 촜을 시다')
    expect(result.answer).toContain('⚠️ 이 내용은 자료 근거 인용이며 의료 자문이 아닙니다.')
    expect(openai.chat.completions.create).not.toHaveBeenCalled()
  })

  it('검색 자체가 실패하면 에러 메시지를 반환하고 throw하지 않는다', async () => {
    const openai = makeOpenAI()
    const supabase = makeSupabase({ data: null, error: { message: 'match_study_chunks RPC 실패' } })

    const result = await runEvidenceAssistant(openai, supabase, { keyword: '어지럼' })

    expect(result.sources).toEqual([])
    expect(result.answer).toContain('match_study_chunks RPC 실패')
    expect(openai.chat.completions.create).not.toHaveBeenCalled()
  })

  it('근거가 있으면 sources를 snake_case 필드로 매핑하고 유사도를 0~100으로 반올림한다', async () => {
    const longContent = '가'.repeat(200)
    const chunks = [
      { doc_title: '메니에르병 연구', page_num: 12, similarity: 0.8234, content: longContent },
      { doc_title: '전정재활 가이드', page_num: null, similarity: 0.5, content: '짧은 내용' },
    ]
    const openai = makeOpenAI({ completionContent: '요약 답변입니다.' })
    const supabase = makeSupabase({ data: chunks, error: null })

    const result = await runEvidenceAssistant(openai, supabase, { keyword: '내림프수종' })

    expect(result.answer).toBe('요약 답변입니다.')
    expect(result.sources).toEqual([
      { doc_title: '메니에르병 연구', page_num: 12, similarity: 82, excerpt: longContent.slice(0, 130) + '…' },
      { doc_title: '전정재활 가이드', page_num: null, similarity: 50, excerpt: '짧은 내용' + '…' },
    ])
  })

  it('healthContext가 있으면 임베딩 검색 질의에 참고 맥락을 함께 포함한다', async () => {
    const openai = makeOpenAI()
    const supabase = makeSupabase({ data: [], error: null })

    await runEvidenceAssistant(openai, supabase, {
      keyword: 'HRV와 스트레스',
      healthContext: '최근 7일간 어지럼 점수 상승',
    })

    const embedCall = openai.embeddings.create.mock.calls[0][0]
    expect(embedCall.input).toContain('HRV와 스트레스')
    expect(embedCall.input).toContain('최근 7일간 어지럼 점수 상승')
  })

  it('gpt-4o-mini를 낮은 temperature로 호출하고 시스템 프롬프트를 포함한다', async () => {
    const openai = makeOpenAI()
    const supabase = makeSupabase({
      data: [{ doc_title: '논문', page_num: 1, similarity: 0.9, content: '내용' }],
      error: null,
    })

    await runEvidenceAssistant(openai, supabase, { keyword: '질문' })

    const call = openai.chat.completions.create.mock.calls[0][0]
    expect(call.model).toBe('gpt-4o-mini')
    expect(call.temperature).toBe(0.2)
    expect(call.messages[0]).toEqual({ role: 'system', content: EVIDENCE_ASSISTANT_SYSTEM_PROMPT })
  })

  // SPEC §0 회귀 방지: 프롬프트를 고치더라도 이 경계 문구들은 항상 남아 있어야 한다.
  it('시스템 프롬프트에 SPEC §0 경계 규칙이 포함돼 있다 (회귀 방지)', () => {
    expect(EVIDENCE_ASSISTANT_SYSTEM_PROMPT).toContain('진단')
    expect(EVIDENCE_ASSISTANT_SYSTEM_PROMPT).toContain('예후')
    expect(EVIDENCE_ASSISTANT_SYSTEM_PROMPT).toContain('처방')
    expect(EVIDENCE_ASSISTANT_SYSTEM_PROMPT).toContain('상관관계와 인과관계')
    expect(EVIDENCE_ASSISTANT_SYSTEM_PROMPT).toContain('⚠️ 이 내용은 자료 근거 인용이며 의료 자문이 아닙니다.')
  })
})
