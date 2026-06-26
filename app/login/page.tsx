'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CARE_COLORS, CARE_FONT, CARE_GRADIENTS, CARE_RADIUS, CARE_SHADOW } from '@/lib/designTokens'

const C = {
  bg: CARE_COLORS.bg,
  card: CARE_COLORS.card,
  border: CARE_COLORS.border,
  sage: CARE_COLORS.primary,
  sageDark: CARE_COLORS.primaryDark,
  text: CARE_COLORS.text,
  mid: CARE_COLORS.mid,
  light: CARE_COLORS.light,
  warn: CARE_COLORS.warn,
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const nextPath = useMemo(() => {
    const next = searchParams.get('next')
    return next?.startsWith('/') && !next.startsWith('//') ? next : '/explore'
  }, [searchParams])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user && !data.user.is_anonymous) {
        router.replace('/explore')
      }
    })
  }, [router])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email || sending) return

    setSending(true)
    setSent(false)
    setError('')

    const supabase = createClient()
    const origin = window.location.origin
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    })

    if (otpError) {
      setError('로그인 링크를 보내지 못했어요. 이메일 주소와 Supabase Auth 설정을 함께 볼까요?')
    } else {
      setSent(true)
    }

    setSending(false)
  }

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: CARE_GRADIENTS.app,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: CARE_FONT,
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 420,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: CARE_RADIUS.lg,
          boxShadow: CARE_SHADOW.card,
          padding: 26,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 26 }}>
          <div style={{ width: 9, height: 9, borderRadius: 99, background: C.sage }} />
          <span style={{ color: C.text, fontWeight: 900, fontSize: 21 }}>CareFlow</span>
        </div>

        <h1 style={{ margin: 0, color: C.text, fontSize: 27, lineHeight: 1.25, letterSpacing: 0 }}>
          기록을 이어서 볼까요?
        </h1>
        <p style={{ margin: '10px 0 24px', color: C.mid, fontSize: 14, lineHeight: 1.7 }}>
          이메일로 받은 링크를 열면 내 기록 공간으로 들어갈 수 있어요.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <label style={{ display: 'grid', gap: 7, color: C.mid, fontSize: 12, fontWeight: 800 }}>
            이메일
            <input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                border: `1px solid ${C.border}`,
                borderRadius: CARE_RADIUS.md,
                padding: '13px 14px',
                background: '#fff',
                color: C.text,
                fontSize: 15,
                outline: 'none',
              }}
            />
          </label>

          <button
            type="submit"
            disabled={sending}
            style={{
              border: 'none',
              borderRadius: CARE_RADIUS.md,
              padding: '14px 16px',
              background: CARE_GRADIENTS.primary,
              color: '#fff',
              fontSize: 15,
              fontWeight: 900,
              cursor: sending ? 'not-allowed' : 'pointer',
              opacity: sending ? 0.65 : 1,
            }}
          >
            {sending ? '보내는 중...' : '로그인 링크 받기'}
          </button>
        </form>

        {sent && (
          <p style={{ margin: '16px 0 0', color: C.sageDark, fontSize: 13, lineHeight: 1.65, fontWeight: 700 }}>
            메일함을 확인해 주세요. 링크를 열면 CareFlow 기록 화면으로 돌아옵니다.
          </p>
        )}

        {error && (
          <p style={{ margin: '16px 0 0', color: C.warn, fontSize: 13, lineHeight: 1.65, fontWeight: 700 }}>
            {error}
          </p>
        )}

        <p style={{ margin: '22px 0 0', color: C.light, fontSize: 11.5, lineHeight: 1.65 }}>
          CareFlow는 진단이나 처방을 대신하지 않는 자기관찰 도구예요. 몸의 변화가 걱정될 때는 의료진과 함께 확인해 주세요.
        </p>
      </section>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
