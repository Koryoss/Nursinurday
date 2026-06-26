import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const supabase = createClient()
  await supabase.auth.signOut()

  const loginUrl = new URL('/login', requestUrl.origin)
  loginUrl.searchParams.set('signedOut', '1')
  return NextResponse.redirect(loginUrl, { status: 303 })
}
