/**
 * Evidence Assistant (docs/ai-flow.md §3)
 *
 * 목적: 관리자가 참고할 수 있는 의료 근거와 학습 자료를 연결한다 (진단 도구가 아니다).
 * 책임: LinkNote/Study Workspace 검색, 관련 논문 연결, 임상 가이드라인 제공.
 * 원칙: 의료 근거를 생성하거나 해석하지 않으며, 검토된 자료를 연결하는 역할만 수행한다.
 *
 * app/api/study/query/route.ts는 이 함수를 그대로 재사용한다 (단일 구현).
 * 이 Assistant는 관리자 전용(Study Workspace)이며 환자용 화면에는 노출하지 않는다.
 */

import type OpenAI from 'openai'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { EvidenceAssistantInput, EvidenceAssistantOutput, EvidenceSource } from './types'
import { searchStudyChunks } from './studyChunkSearch'

export const EVIDENCE_ASSISTANT_SYSTEM_PROMPT = `당신은 CareFlow의 Evidence Assistant입니다.
관리자(연구/제품 담당자)가 참고할 의료 근거와 학습 자료를 연결하는 것이 유일한 역할입니다.

규칙:
1. 오직 제공된 논문/자료 청크만을 근거로 답변합니다. 없는 내용을 꾸며내지 않습니다.
2. 모든 주장에는 출처를 표기합니다: [자료 제목, p.페이지]
3. 진단·예후·처방·중증도 판정을 절대 하지 않습니다.
4. 상관관계와 인과관계를 명확히 구분합니다 ("관련이 있다" vs "원인이다").
5. 자료에 없는 정보는 "제공된 자료에서 확인할 수 없습니다"라고 답합니다.

한국어로 답변하고, 마지막 줄에 반드시 이 문구를 붙입니다:
"⚠️ 이 내용은 자료 근거 인용이며 의료 자문이 아닙니다."`

export async function runEvidenceAssistant(
  openai: OpenAI,
  supabase: SupabaseClient,
  input: EvidenceAssistantInput
): Promise<EvidenceAssistantOutput> {
  const question = input.healthContext
    ? `${input.keyword}\n\n(참고 맥락: ${input.healthContext})`
    : input.keyword

  const { chunks: matched, error } = await searchStudyChunks(openai, supabase, question)

  if (error) {
    return {
      answer: `근거 자료 검색 중 문제가 있었어요: ${error}`,
      sources: [],
    }
  }

  if (matched.length === 0) {
    return {
      answer: '제공된 자료에서 관련 내용을 찾을 수 없습니다.\n\n⚠️ 이 내용은 자료 근거 인용이며 의료 자문이 아닙니다.',
      sources: [],
    }
  }

  const context = matched
    .map((chunk, i) => `[출처 ${i + 1}] 자료: "${chunk.doc_title}" / p.${chunk.page_num ?? '-'}\n${chunk.content}`)
    .join('\n\n---\n\n')

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: EVIDENCE_ASSISTANT_SYSTEM_PROMPT },
      { role: 'user', content: `다음 자료를 바탕으로 질문에 답해주세요.\n\n${context}\n\n질문: ${input.keyword.trim()}` },
    ],
    temperature: 0.2,
    max_tokens: 1500,
  })

  const sources: EvidenceSource[] = matched.map(chunk => ({
    doc_title: chunk.doc_title,
    page_num: chunk.page_num,
    similarity: Math.round(chunk.similarity * 100),
    excerpt: chunk.content.slice(0, 130) + '…',
  }))

  return {
    answer: completion.choices[0]?.message?.content ?? '',
    sources,
  }
}
