'use client'

import { ReactNode } from 'react'
import { CARE_COLORS, CARE_FONT, CARE_GRADIENTS, CARE_RADIUS, CARE_SHADOW } from '@/lib/designTokens'

export default function IPhoneFrame({
  children,
  title,
  sub,
  action,
}: {
  children: ReactNode
  title?: string
  sub?: string
  action?: ReactNode
}) {
  return (
    <div style={{
      minHeight: '100dvh',
      background: CARE_GRADIENTS.app,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px 16px',
      fontFamily: CARE_FONT,
    }}>
      <div style={{
        width: 390, height: 844,
        borderRadius: CARE_RADIUS.shell,
        background: CARE_GRADIENTS.shell,
        border: '1.5px solid rgba(255,255,255,0.9)',
        boxShadow: CARE_SHADOW.shell,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', position: 'relative',
        userSelect: 'none',
      }}>

        {/* Dynamic Island */}
        <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', width: 120, height: 36, background: '#1C1C1E', borderRadius: 18, zIndex: 20 }} />

        {/* Status Bar */}
        <div style={{ height: 56, flexShrink: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 28px 8px', zIndex: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: CARE_COLORS.text }}>9:41</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <svg width="17" height="12" viewBox="0 0 17 12" fill={CARE_COLORS.text}>
              <rect x="0" y="4" width="3" height="8" rx="1" opacity="0.35"/>
              <rect x="4.5" y="2.5" width="3" height="9.5" rx="1" opacity="0.55"/>
              <rect x="9" y="1" width="3" height="11" rx="1"/>
              <rect x="13.5" y="0" width="3" height="12" rx="1"/>
            </svg>
            <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <div style={{ width: 24, height: 12, border: '1.5px solid rgba(45,52,54,0.5)', borderRadius: 3, padding: '2px', display: 'flex', alignItems: 'center' }}>
                <div style={{ height: '100%', width: '75%', background: CARE_COLORS.text, borderRadius: 1 }} />
              </div>
              <div style={{ width: 2, height: 6, background: 'rgba(45,52,54,0.35)', borderRadius: '0 1px 1px 0' }} />
            </div>
          </div>
        </div>

        {/* Header */}
        {(title || sub) && (
          <div style={{ padding: '0 22px 14px', flexShrink: 0, borderBottom: `1px solid ${CARE_COLORS.border}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: CARE_COLORS.primary, animation: 'cfPulse 2s infinite' }} />
                  <span style={{ fontSize: 20, fontWeight: 800, color: CARE_COLORS.text }}>CareFlow</span>
                </div>
                {sub && <div style={{ fontSize: 11, color: CARE_COLORS.mid, marginTop: 3 }}>{sub}</div>}
              </div>
              {action}
            </div>
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>

        <style>{`@keyframes cfPulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
      </div>
    </div>
  )
}
