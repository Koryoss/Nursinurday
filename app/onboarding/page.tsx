'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CARE_COLORS, CARE_GRADIENTS } from '@/lib/designTokens'

type ConversationMode = 'gentle' | 'formal'

const C = {
  bg: CARE_COLORS.bg,
  card: CARE_COLORS.card,
  border: CARE_COLORS.border,
  accent: CARE_COLORS.primary,
  accentLight: CARE_COLORS.primarySoft,
  textDark: CARE_COLORS.text,
  textMid: CARE_COLORS.mid,
  textLight: CARE_COLORS.light,
}

export default function OnboardingPage() {
  const [mode, setMode] = useState<ConversationMode>('gentle')
  const [terms, setTerms] = useState(false)
  const [privacy, setPrivacy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const save = async () => {
    if (!terms || !privacy || saving) return
    setSaving(true)
    setError('')

    try {
      const supabase = createClient()
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user || user.is_anonymous) {
        router.replace('/login?next=/onboarding')
        return
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            chat_mode: mode,
            consented_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )

      if (profileError) throw profileError
      router.push('/explore')
    } catch (e) {
      setError('동의 정보를 저장하지 못했어요. 로그인 상태와 Supabase 연결을 함께 볼까요?')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: CARE_GRADIENTS.app, padding: 24, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 520, background: C.card, borderRadius: 28, padding: '28px 26px 32px', boxShadow: '0 24px 60px rgba(0, 0, 0, 0.09)' }}>
        <div style={{ marginBottom: 24 }}>
          <span style={{ color: C.accent, fontWeight: 900, fontSize: 18 }}>CareFlow</span>
          <h1 style={{ margin: '18px 0 12px', fontSize: 34, lineHeight: 1.05, color: C.textDark, fontWeight: 900 }}>오늘의 나를 위한 기록 공간이에요</h1>
          <p style={{ margin: 0, color: C.textMid, fontSize: 16, lineHeight: 1.75 }}>
            CareFlow는 진단이나 처방을 하지 않아요. 몸·감정·관계·의미 기록을 저장하고, 나의 변화 흐름을 함께 보기 위한 도구예요.
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ color: C.textMid, fontWeight: 900, marginBottom: 12 }}>대화 모드</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { value: 'gentle' as const, label: '친근 모드', description: '편하게 말해요.' },
              { value: 'formal' as const, label: '정중 모드', description: '존댓말로 차분하게 말해요.' },
            ].map(item => (
              <button
                key={item.value}
                type="button"
                onClick={() => setMode(item.value)}
                style={{
                  minHeight: 70,
                  borderRadius: 20,
                  border: `1px solid ${mode === item.value ? C.accent : C.border}`,
                  background: mode === item.value ? C.accentLight : C.card,
                  padding: '16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 900, color: C.textDark, marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontSize: 13, color: C.textMid }}>{item.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 24, padding: 20, marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => setTerms(prev => !prev)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '16px 14px', borderRadius: 18, border: '1px solid transparent', background: terms ? C.accentLight : C.card, cursor: 'pointer' }}
          >
            <span style={{ width: 24, height: 24, borderRadius: 8, border: `1px solid ${C.border}`, display: 'grid', placeItems: 'center', background: terms ? C.accent : 'transparent', color: terms ? '#fff' : C.textDark }}>
              {terms ? '✓' : ''}
            </span>
            <span style={{ color: C.textDark, fontSize: 15, lineHeight: 1.6 }}>
              이용약관과 면책 안내에 동의해요. 비의료기기이며 진단·치료를 대체하지 않아요.
            </span>
          </button>
          <button
            type="button"
            onClick={() => setPrivacy(prev => !prev)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '16px 14px', borderRadius: 18, border: '1px solid transparent', background: privacy ? C.accentLight : C.card, cursor: 'pointer' }}
          >
            <span style={{ width: 24, height: 24, borderRadius: 8, border: `1px solid ${C.border}`, display: 'grid', placeItems: 'center', background: privacy ? C.accent : 'transparent', color: privacy ? '#fff' : C.textDark }}>
              {privacy ? '✓' : ''}
            </span>
            <span style={{ color: C.textDark, fontSize: 15, lineHeight: 1.6 }}>
              개인정보 수집·이용에 동의해요(필수). 건강 관련 자기기록을 저장하고 본인 기록으로 다시 보여줘요.
            </span>
          </button>
        </div>

        {error ? <div style={{ color: '#A0482C', fontSize: 14, marginBottom: 16 }}>{error}</div> : null}

        <button
          type="button"
          onClick={save}
          disabled={!terms || !privacy || saving}
          style={{
            width: '100%',
            minHeight: 56,
            borderRadius: 20,
            border: 'none',
            background: !terms || !privacy || saving ? 'rgba(163,177,138,0.3)' : CARE_GRADIENTS.primary,
            color: '#fff',
            fontSize: 17,
            fontWeight: 900,
            cursor: !terms || !privacy || saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? '저장 중...' : '기록 시작하기'}
        </button>

        <div style={{ marginTop: 16, fontSize: 13, color: C.textLight, lineHeight: 1.7 }}>
          <p>모드는 언제든 바꿀 수 있어요.</p>
          <p style={{ marginTop: 8 }}>
            약관 및 개인정보처리방침은 <Link href="/terms" style={{ color: C.accent, fontWeight: 700 }}>여기</Link>에서 확인할 수 있어요.
          </p>
        </div>
      </div>
    </div>
  )
}
