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

// POST /api/assistants/evidence — body: { keyword: string, healthContext?: string }
// 관리자(Study Workspace) 전용. 환자용 화면에서 호출하지 않는다.
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { keyword, healthContext } = await req.json() as { keyword?: string; healthContext?: string }
  if (!keyword?.trim()) return NextResponse.json({ error: 'keyword required' }, { status: 400 })

  const openai = getOpenAI()
  if (!openai) return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 503 })

  const result = await runEvidenceAssistant(openai, supabase, { keyword: keyword.trim(), healthContext })

  return NextResponse.json(result)
}
