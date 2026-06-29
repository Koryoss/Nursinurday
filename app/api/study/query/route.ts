import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const maxDuration = 30

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `당신은 메니에르병 관련 논문을 분석하는 학술 리서치 보조 도구입니다.

규칙:
1. 오직 제공된 논문 청크만을 근거로 답변합니다. 없는 내용을 꾸며내지 않습니다.
2. 모든 주장에는 출처를 표기합니다: [논문 제목, p.페이지]
3. 진단·예후·처방·중증도 판정을 절대 하지 않습니다.
4. 상관관계와 인과관계를 명확히 구분합니다 ("관련이 있다" vs "원인이다").
5. 논문에 없는 정보는 "제공된 논문에서 확인할 수 없습니다"라고 답합니다.

한국어로 답변하고, 마지막 줄에 반드시 이 문구를 붙입니다:
"⚠️ 이 내용은 논문 근거 인용이며 의료 자문이 아닙니다."`

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { question } = await req.json() as { question?: string }
  if (!question?.trim()) return NextResponse.json({ error: 'question required' }, { status: 400 })

  const embRes = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: question.trim(),
  })
  const { data: chunks, error: searchErr } = await supabase.rpc('match_study_chunks', {
    query_embedding: embRes.data[0].embedding,
    match_count: 6,
    match_threshold: 0.3,
  })
  if (searchErr) return NextResponse.json({ error: searchErr.message }, { status: 500 })

  if (!chunks?.length) {
    return NextResponse.json({
      answer: '제공된 논문에서 관련 내용을 찾을 수 없습니다.\n\n⚠️ 이 내용은 논문 근거 인용이며 의료 자문이 아닙니다.',
      sources: [],
    })
  }

  const context = chunks.map((c: any, i: number) =>
    `[출처 ${i + 1}] 논문: "${c.doc_title}" / p.${c.page_num}\n${c.content}`
  ).join('\n\n---\n\n')

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `다음 논문 내용을 바탕으로 질문에 답해주세요.\n\n${context}\n\n질문: ${question.trim()}` },
    ],
    temperature: 0.2,
    max_tokens: 1500,
  })

  const sources = chunks.map((c: any) => ({
    doc_title: c.doc_title,
    page_num: c.page_num,
    similarity: Math.round(c.similarity * 100),
    excerpt: c.content.slice(0, 130) + '…',
  }))

  return NextResponse.json({ answer: completion.choices[0].message.content ?? '', sources })
}
