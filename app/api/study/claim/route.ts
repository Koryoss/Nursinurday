import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const maxDuration = 30

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `당신은 메니에르병 연구 근거를 분석하는 학술 도구입니다.

제공된 논문 청크와 주장을 비교해 아래 JSON만 출력하세요 (다른 텍스트 없이).

{
  "source_summary": "저자(연도) 논문명 p.페이지 — 없으면 '출처 미확인'",
  "strength": "강|중|약|출처 미확인",
  "application_context": "이 주장이 어떤 화면·기능 맥락에서 쓰일 수 있는지 (한 문장)",
  "safety_note": "SPEC 경계 주의: 상관·인과 구분, 진단 금지 해당 여부 (한 문장)"
}

근거강도 기준:
- 강: 국가통계·메타분석·체계적 문헌고찰·확립된 원칙
- 중: 코호트·단면·척도 연구 (n≥50)
- 약: 소표본(n<50)·설계 정의·사례 보고·전문가 의견
- 출처 미확인: 관련 논문 없거나 유사도 낮음

규칙:
- 진단·예후·처방 관련 주장은 safety_note에 경고 필수
- 인과관계 주장이면 safety_note에 "상관관계로만 표현 필요" 추가`

type Chunk = { doc_title: string; page_num: number; content: string; similarity: number; source_file?: string }

async function buildDraft(chunks: Chunk[], claim: string) {
  if (!chunks.length) {
    return { source_summary: '출처 미확인', strength: '출처 미확인', application_context: '', safety_note: '' }
  }
  const context = chunks.map((c, i) =>
    `[청크 ${i + 1}] 논문: "${c.doc_title}" / p.${c.page_num} / 유사도 ${Math.round(c.similarity * 100)}%\n${c.content}`
  ).join('\n\n---\n\n')

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `논문 청크:\n${context}\n\n주장: ${claim}` },
    ],
    temperature: 0.1,
    max_tokens: 600,
    response_format: { type: 'json_object' },
  })
  try {
    const parsed = JSON.parse(completion.choices[0].message.content ?? '{}')
    return {
      source_summary:      parsed.source_summary ?? '출처 미확인',
      strength:            ['강', '중', '약', '출처 미확인'].includes(parsed.strength) ? parsed.strength : '약',
      application_context: parsed.application_context ?? '',
      safety_note:         parsed.safety_note ?? '',
    }
  } catch {
    return { source_summary: '출처 미확인', strength: '출처 미확인', application_context: '', safety_note: '' }
  }
}

// POST /api/study/claim — 주장 → 4필드 초안 (저장 안 함)
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { claim } = await req.json() as { claim?: string }
  if (!claim?.trim()) return NextResponse.json({ error: 'claim required' }, { status: 400 })

  const embRes = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: claim.trim(),
  })
  const { data, error: searchErr } = await supabase.rpc('match_study_chunks', {
    query_embedding: embRes.data[0].embedding,
    match_count: 5,
    match_threshold: 0.3,
  })
  if (searchErr) return NextResponse.json({ error: searchErr.message }, { status: 500 })

  const chunks: Chunk[] = data ?? []
  const draft = await buildDraft(chunks, claim.trim())
  const topChunk = chunks[0] ?? null

  const sources = chunks.map(c => ({
    doc_title:   c.doc_title,
    page_num:    c.page_num,
    similarity:  Math.round(c.similarity * 100),
    excerpt:     c.content.slice(0, 130) + '…',
    source_file: c.source_file,
  }))

  return NextResponse.json({
    claim: claim.trim(),
    draft,
    sources,
    top_source: topChunk
      ? { title: topChunk.doc_title, page: topChunk.page_num, file: topChunk.source_file, similarity: topChunk.similarity }
      : null,
  })
}

// GET /api/study/claim — 저장된 레지스트리 목록
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('evidence_claims')
    .select('id, claim, source_title, source_page, strength, application_context, safety_note, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ claims: data })
}
