'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CARE_COLORS, CARE_GRADIENTS, CARE_RADIUS, CARE_SHADOW } from '@/lib/designTokens'

export default function FeedbackButton() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(5)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')

  const submitFeedback = async () => {
    if (saving) return
    setSaving(true)
    setStatus('')

    try {
      const supabase = createClient()
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user || user.is_anonymous) {
        router.push(`/login?next=${encodeURIComponent(pathname || '/')}`)
        return
      }

      const { error } = await supabase.from('feedback').insert({
        user_id: user.id,
        rating,
        message: message.trim() || null,
        page_path: pathname || '/',
      })

      if (error) throw error

      setStatus('고마워요. 남겨주신 의견을 제품 개선에 참고할게요.')
      setMessage('')
      setRating(5)
      setTimeout(() => setOpen(false), 1200)
    } catch (e) {
      setStatus('의견을 저장하지 못했어요. 로그인 상태와 연결을 함께 볼까요?')
    } finally {
      setSaving(false)
    }
  }

  if (pathname?.startsWith('/study')) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="피드백 남기기"
        style={{
          position: 'fixed',
          right: 18,
          bottom: 18,
          zIndex: 2000,
          border: 'none',
          borderRadius: CARE_RADIUS.pill,
          padding: '12px 16px',
          background: CARE_GRADIENTS.primary,
          color: '#fff',
          fontSize: 13,
          fontWeight: 900,
          boxShadow: CARE_SHADOW.button,
          cursor: 'pointer',
        }}
      >
        의견
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2100,
            display: 'grid',
            placeItems: 'end center',
            padding: 18,
            background: 'rgba(38,49,42,0.18)',
          }}
        >
          <section
            style={{
              width: 'min(420px, 100%)',
              background: CARE_COLORS.cardSolid,
              border: `1px solid ${CARE_COLORS.border}`,
              borderRadius: CARE_RADIUS.lg,
              boxShadow: CARE_SHADOW.shell,
              padding: 18,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <strong style={{ color: CARE_COLORS.text, fontSize: 15 }}>CareFlow를 어떻게 느끼셨나요?</strong>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="닫기"
                style={{ border: 'none', background: 'transparent', color: CARE_COLORS.light, fontSize: 18, cursor: 'pointer' }}
              >
                x
              </button>
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
              {[1, 2, 3, 4, 5].map(value => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  aria-label={`${value}점`}
                  style={{
                    width: 38,
                    height: 34,
                    borderRadius: CARE_RADIUS.sm,
                    border: `1px solid ${value <= rating ? CARE_COLORS.primary : CARE_COLORS.border}`,
                    background: value <= rating ? CARE_COLORS.primarySoft : '#fff',
                    color: value <= rating ? CARE_COLORS.primaryDark : CARE_COLORS.light,
                    fontWeight: 900,
                    cursor: 'pointer',
                  }}
                >
                  {value}
                </button>
              ))}
            </div>

            <textarea
              value={message}
              onChange={event => setMessage(event.target.value)}
              placeholder="불편했던 점이나 더 보고 싶은 흐름을 적어주세요."
              rows={4}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                marginTop: 12,
                border: `1px solid ${CARE_COLORS.border}`,
                borderRadius: CARE_RADIUS.md,
                padding: 12,
                color: CARE_COLORS.text,
                font: 'inherit',
                resize: 'vertical',
              }}
            />

            {status && <p style={{ margin: '10px 0 0', color: CARE_COLORS.mid, fontSize: 12, lineHeight: 1.6 }}>{status}</p>}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  border: `1px solid ${CARE_COLORS.border}`,
                  borderRadius: CARE_RADIUS.md,
                  background: '#fff',
                  color: CARE_COLORS.mid,
                  padding: '11px 14px',
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                닫기
              </button>
              <button
                type="button"
                onClick={submitFeedback}
                disabled={saving}
                style={{
                  border: 'none',
                  borderRadius: CARE_RADIUS.md,
                  background: CARE_GRADIENTS.primary,
                  color: '#fff',
                  padding: '11px 15px',
                  fontWeight: 900,
                  opacity: saving ? 0.65 : 1,
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? '저장 중...' : '보내기'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
