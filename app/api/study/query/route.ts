import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/integrations/supabase/server'
import { runEvidenceAssistant } from '@/lib/domain/assistants/evidenceAssistant'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const maxDuration = 30

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null
  return new OpenAI({ apiKey })
}

// POST /api/study/query — body: { question: string }
// Study Workspace 채팅 UI(app/study/page.tsx)가 호출한다.
// 검색·답변 생성 로직은 lib/domain/assistants/evidenceAssistant.ts의
// runEvidenceAssistant()를 그대로 재사용한다 (app/api/assistants/evidence와 단일 구현 공유).
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { question } = await req.json() as { question?: string }
  if (!question?.trim()) return NextResponse.json({ error: 'question required' }, { status: 400 })

  const openai = getOpenAI()
  if (!openai) return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 503 })

  const result = await runEvidenceAssistant(openai, supabase, { keyword: question.trim() })

  return NextResponse.json(result)
}
