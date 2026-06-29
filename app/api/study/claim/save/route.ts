import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/study/claim/save — 사용자 확인 후 레지스트리에 저장
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { claim, draft, top_source, sources } = body

  if (!claim?.trim() || !draft) {
    return NextResponse.json({ error: 'claim and draft required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('evidence_claims')
    .insert({
      claim: claim.trim(),
      source_title: top_source?.title ?? null,
      source_file: top_source?.file ?? null,
      source_page: top_source?.page ?? null,
      similarity: top_source?.similarity ?? null,
      strength: draft.strength,
      application_context: draft.application_context,
      safety_note: draft.safety_note,
      raw_chunks: sources ?? [],
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}
