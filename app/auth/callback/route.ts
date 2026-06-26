import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/explore'
  }

  return value
}

async function resolvePostLoginPath(supabase: ReturnType<typeof createClient>, next: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.is_anonymous) return '/login'

  const { data: profile } = await supabase
    .from('profiles')
    .select('consented_at')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.consented_at) return '/onboarding'
  return next === '/onboarding' ? '/explore' : next
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null
  const next = safeNextPath(requestUrl.searchParams.get('next'))
  const supabase = createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const postLoginPath = await resolvePostLoginPath(supabase, next)
      return NextResponse.redirect(new URL(postLoginPath, requestUrl.origin))
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    })

    if (!error) {
      const postLoginPath = await resolvePostLoginPath(supabase, next)
      return NextResponse.redirect(new URL(postLoginPath, requestUrl.origin))
    }
  }

  const loginUrl = new URL('/login', requestUrl.origin)
  loginUrl.searchParams.set('next', next)
  loginUrl.searchParams.set('error', 'callback')
  return NextResponse.redirect(loginUrl)
}
