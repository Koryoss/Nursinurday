'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Band, CorrelationItem, TrendPoint } from '@/lib/socialReturnIndicators'
import { CARE_COLORS, CARE_FONT, CARE_GRADIENTS, CARE_RADIUS, CARE_SHADOW } from '@/lib/designTokens'

type IndicatorResponse = {
  date: string
  source: string
  indicators: {
    readiness: Band
    steadiness: Band
    activity_range: Band
  }
  trend: TrendPoint[]
  correlations: CorrelationItem[]
}

type WeeklyForm = {
  week_start: string
  dhi_p: number
  dhi_e: number
  dhi_f: number
  thi: number
  hads_a: number
  hads_d: number
  vss_sf: number
}

const SAGE = CARE_COLORS.primary
const SAGE_DARK = CARE_COLORS.primaryDark
const TEXT = CARE_COLORS.text
const TEXT_MID = CARE_COLORS.mid
const TEXT_LIGHT = CARE_COLORS.light
const BORDER = CARE_COLORS.border
const CARD = CARE_COLORS.card

const BAND_LABELS: Record<Band, string> = {
  low: '낮음',
  normal: '보통',
  high: '높음',
}

const BAND_COLORS: Record<Band, string> = {
  low: '#7E9AA0',
  normal: SAGE,
  high: CARE_COLORS.primaryDark,
}

const BAND_POSITIONS: Record<Band, string> = {
  low: '28%',
  normal: '55%',
  high: '78%',
}

const todayLocal = () => {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const emptyWeekly = (): WeeklyForm => ({
  week_start: todayLocal(),
  dhi_p: 0,
  dhi_e: 0,
  dhi_f: 0,
  thi: 0,
  hads_a: 0,
  hads_d: 0,
  vss_sf: 0,
})

function Card({
  title,
  children,
  aside,
  compact = false,
}: {
  title: string
  children: React.ReactNode
  aside?: React.ReactNode
  compact?: boolean
}) {
  return (
    <section
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: CARE_RADIUS.lg,
        boxShadow: 'none',
        padding: compact ? 14 : 16,
      }}
    >
      {(title || aside) && (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        {title ? <h2 style={{ margin: 0, color: TEXT_MID, fontSize: 15, fontWeight: 900 }}>{title}</h2> : <span />}
        {aside}
      </div>
      )}
      {children}
    </section>
  )
}

function BandGauge({
  title,
  band,
  body,
}: {
  title: string
  band: Band
  body: string
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <strong style={{ color: TEXT, fontSize: 20, lineHeight: 1.15 }}>{title}</strong>
        <span
          style={{
            minWidth: 58,
            textAlign: 'center',
            borderRadius: 99,
            padding: '6px 12px',
            color: '#fff',
            background: BAND_COLORS[band],
            fontSize: 15,
            fontWeight: 900,
          }}
        >
          {BAND_LABELS[band]}
        </span>
      </div>
      <div style={{ position: 'relative', height: 13, margin: '13px 0 7px' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 3, height: 10, borderRadius: 999, background: '#ECF1EC' }} />
        <div style={{ position: 'absolute', left: BAND_POSITIONS[band], top: -2, width: 5, height: 22, borderRadius: 999, background: TEXT, transform: 'translateX(-50%)' }} />
      </div>
      <p style={{ margin: 0, color: TEXT_MID, fontSize: 15, lineHeight: 1.45, fontWeight: 700 }}>
        {body}
      </p>
    </div>
  )
}

function TrendBars({ points }: { points: TrendPoint[] }) {
  const recent = points.slice(-4)
  const fallback = [42, 55, 50, 68]
  const values = recent.length
    ? recent.map(point => Math.max(26, Math.min(76, 34 + (point.gait ?? point.dizziness ?? 2) * 9)))
    : fallback

  return (
    <div>
      <div style={{ height: 76, display: 'flex', alignItems: 'flex-end', gap: 10, margin: '18px 4px 8px' }}>
        {values.map((height, index) => (
          <span
            key={`${height}-${index}`}
            style={{
              flex: 1,
              height: `${height}%`,
              minHeight: 28,
              borderRadius: '6px 6px 0 0',
              background: '#D6E2D6',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, color: TEXT_LIGHT, fontSize: 13, fontWeight: 800, textAlign: 'center' }}>
        <span>1주</span>
        <span>2주</span>
        <span>3주</span>
        <span>4주</span>
      </div>
      <p style={{ margin: '9px 4px 0', color: TEXT_LIGHT, fontSize: 13, lineHeight: 1.45, fontWeight: 700 }}>
        시작 ~ 최근 · 전체 기록 기준
      </p>
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <label style={{ display: 'grid', gap: 6, color: TEXT_MID, fontSize: 11, fontWeight: 800 }}>
      {label}
      <input
        type="number"
        min={0}
        value={value}
        onChange={event => onChange(Number(event.target.value))}
        style={{
          border: `1px solid ${BORDER}`,
          borderRadius: 12,
          padding: '10px 11px',
          background: '#fff',
          color: TEXT,
          fontWeight: 800,
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
    </label>
  )
}

function indicatorCopy(name: string, band: Band) {
  if (band === 'high') return `${name}이 개인 최근 기록보다 높게 관찰돼요. 오늘 기록을 함께 볼까요?`
  if (band === 'low') return `${name}이 개인 최근 기록보다 낮게 관찰돼요. 오늘 기록을 함께 볼까요?`
  return `${name}이 개인 최근 기록과 비슷하게 관찰돼요. 오늘 기록을 이어가며 함께 볼까요?`
}

export default function DashboardPage() {
  const [data, setData] = useState<IndicatorResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [weekly, setWeekly] = useState<WeeklyForm>(emptyWeekly)
  const [weeklySaving, setWeeklySaving] = useState(false)
  const [weeklySaved, setWeeklySaved] = useState(false)
  const [safetyMessage, setSafetyMessage] = useState('')
  const steadinessBand = data?.indicators.steadiness ?? 'low'
  const activityRangeBand = data?.indicators.activity_range ?? 'normal'

  const loadIndicators = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/indicators', { method: 'POST' })
      if (response.status === 401) {
        window.location.href = '/login?next=/dashboard'
        return
      }
      if (!response.ok) throw new Error('indicator')
      setData(await response.json())
    } catch (e) {
      setError('지표를 불러오지 못했어요. 기록 저장 상태와 연결을 함께 볼까요?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadIndicators()
  }, [])

  const saveWeekly = async () => {
    setWeeklySaving(true)
    setWeeklySaved(false)
    setSafetyMessage('')
    setError('')

    try {
      const response = await fetch('/api/weekly-checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(weekly),
      })
      if (response.status === 401) {
        window.location.href = '/login?next=/dashboard'
        return
      }
      if (!response.ok) throw new Error('weekly')
      const result = await response.json()
      setWeeklySaved(true)
      setSafetyMessage(result.safety ?? '')
      setWeekly(emptyWeekly())
    } catch (e) {
      setError('주간 체크인을 저장하지 못했어요. 로그인 상태와 연결을 함께 볼까요?')
    } finally {
      setWeeklySaving(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: CARE_GRADIENTS.app,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
        fontFamily: CARE_FONT,
      }}
    >
      <div
        style={{
          width: 390,
          height: 844,
          borderRadius: CARE_RADIUS.shell,
          background: CARE_GRADIENTS.shell,
          border: '1.5px solid rgba(255,255,255,0.9)',
          boxShadow: CARE_SHADOW.shell,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <header style={{ padding: '30px 22px 14px', borderBottom: `1px solid ${BORDER}`, margin: '0 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: SAGE }} />
              <span style={{ fontSize: 21, fontWeight: 900, color: SAGE_DARK }}>CareFlow</span>
            </div>
            <button
              type="button"
              onClick={loadIndicators}
              disabled={loading}
              style={{
                border: 'none',
                background: 'transparent',
                color: TEXT_LIGHT,
                fontSize: 17,
                fontWeight: 800,
                padding: 0,
              }}
            >
              9:41
            </button>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 22px', display: 'grid', gap: 14, scrollbarWidth: 'none' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Link
              href="/explore"
              style={{
                background: '#fff',
                border: `1px solid ${BORDER}`,
                borderRadius: 16,
                padding: '13px 14px',
                color: SAGE_DARK,
                fontSize: 15,
                fontWeight: 900,
                textAlign: 'center',
                textDecoration: 'none',
              }}
            >
              ✍️ 기록
            </Link>
            <Link
              href="/notification"
              style={{
                background: '#fff',
                border: `1px solid ${BORDER}`,
                borderRadius: 16,
                padding: '13px 14px',
                color: SAGE_DARK,
                fontSize: 15,
                fontWeight: 900,
                textAlign: 'center',
                textDecoration: 'none',
              }}
            >
              🔔 알림
            </Link>
          </div>

          {!data && loading && (
            <Card title="오늘의 지표 · 기준일 2026-06-22" compact>
              <p style={{ margin: 0, color: TEXT_LIGHT, fontSize: 12, lineHeight: 1.5 }}>
                기록을 바탕으로 최신 지표를 불러오고 있어요.
              </p>
            </Card>
          )}

          <Card title="">
            <BandGauge
              title="걸음 안정도"
              band={steadinessBand}
              body={indicatorCopy('걸음 안정도', steadinessBand)}
            />
          </Card>

          <Card title="">
            <BandGauge
              title="활동 범위"
              band={activityRangeBand}
              body=""
            />
          </Card>

          <Card title="오늘 저장된 기록">
            <p style={{ margin: 0, color: TEXT_MID, fontSize: 16, lineHeight: 1.65, fontWeight: 700 }}>
              아침 · 몸 신호 2개<br />
              수면 · 23:00 ~ 07:00
            </p>
          </Card>

          <Card title="활동 범위 추세">
            <TrendBars points={data?.trend ?? []} />
          </Card>

          <Card title="관찰된 연관">
            <p style={{ margin: 0, color: TEXT_MID, fontSize: 16, lineHeight: 1.65, fontWeight: 700 }}>
              걷기 불안과 두통이 <strong style={{ color: TEXT }}>함께 오르내리는 흐름</strong>이 관찰돼요.
            </p>
            <p style={{ margin: '12px 0 0', color: TEXT_LIGHT, fontSize: 13, lineHeight: 1.5, fontWeight: 700 }}>
              상관(연관)일 뿐, 원인·진단 아님
            </p>
          </Card>

          <Card title="주1회 체크인" aside={<span style={{ color: TEXT_LIGHT, fontSize: 10 }}>추세용 · 판정 아님</span>}>
            <div style={{ display: 'grid', gap: 10 }}>
              <label style={{ display: 'grid', gap: 6, color: TEXT_MID, fontSize: 11, fontWeight: 800 }}>
                주 시작일
                <input
                  type="date"
                  value={weekly.week_start}
                  onChange={event => setWeekly(prev => ({ ...prev, week_start: event.target.value }))}
                  style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: '10px 11px', background: '#fff', color: TEXT, fontWeight: 800 }}
                />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 9 }}>
                <NumberField label="DHI P" value={weekly.dhi_p} onChange={value => setWeekly(prev => ({ ...prev, dhi_p: value }))} />
                <NumberField label="DHI E" value={weekly.dhi_e} onChange={value => setWeekly(prev => ({ ...prev, dhi_e: value }))} />
                <NumberField label="DHI F" value={weekly.dhi_f} onChange={value => setWeekly(prev => ({ ...prev, dhi_f: value }))} />
                <NumberField label="THI" value={weekly.thi} onChange={value => setWeekly(prev => ({ ...prev, thi: value }))} />
                <NumberField label="HADS A" value={weekly.hads_a} onChange={value => setWeekly(prev => ({ ...prev, hads_a: value }))} />
                <NumberField label="HADS D" value={weekly.hads_d} onChange={value => setWeekly(prev => ({ ...prev, hads_d: value }))} />
                <NumberField label="VSS-SF" value={weekly.vss_sf} onChange={value => setWeekly(prev => ({ ...prev, vss_sf: value }))} />
              </div>
              <button
                type="button"
                onClick={saveWeekly}
                disabled={weeklySaving}
                style={{
                  border: 'none',
                  borderRadius: 14,
                  padding: '13px 14px',
                  background: SAGE,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 900,
                  opacity: weeklySaving ? 0.65 : 1,
                }}
              >
                {weeklySaving ? '저장 중...' : '주간 체크인 저장'}
              </button>
              <p style={{ margin: 0, color: TEXT_LIGHT, fontSize: 11, lineHeight: 1.6 }}>
                DHI · THI · HADS · VSS-SF
              </p>
            </div>
          </Card>

          <Card title="대화 · 음성 기록">
            <p style={{ margin: 0, color: TEXT_MID, fontSize: 16, lineHeight: 1.55, fontWeight: 700 }}>
              “오늘 하루를 말하면 기록 초안을 함께 만들어요”
            </p>
            <p style={{ margin: '12px 0 0', color: TEXT_LIGHT, fontSize: 13, lineHeight: 1.5, fontWeight: 700 }}>
              초안 확인 후 저장 · 점수 추정 없음
            </p>
            <Link href="/chat" style={{ display: 'inline-flex', marginTop: 12, color: SAGE_DARK, fontSize: 13, fontWeight: 900, textDecoration: 'none' }}>
              대화로 기록하기
            </Link>
          </Card>

          {weeklySaved && (
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, padding: 13, color: SAGE_DARK, fontSize: 12, fontWeight: 800 }}>
              주간 체크인이 저장됐어요.
            </div>
          )}

          {safetyMessage && (
            <div style={{ background: 'rgba(255,248,236,0.92)', border: '1px solid rgba(212,154,98,0.45)', borderRadius: 16, padding: 13 }}>
              <strong style={{ color: '#87521F', fontSize: 13 }}>함께 확인해볼까요?</strong>
              <p style={{ margin: '5px 0 0', color: '#87521F', fontSize: 12, lineHeight: 1.6 }}>{safetyMessage}</p>
            </div>
          )}

          <div style={{ borderLeft: `3px solid ${CARE_COLORS.accent}`, background: 'rgba(197,143,91,0.10)', borderRadius: '0 8px 8px 0', padding: '11px 13px', color: '#7A5A36', fontSize: 13, lineHeight: 1.55, fontWeight: 800 }}>
            비의료기기 경계 · 증상·불안이 클 땐 지표 대신 의료진·외부자원 연계를 우선 안내
          </div>

          {error && (
            <div style={{ background: 'rgba(255,244,240,0.92)', border: '1px solid rgba(180,72,44,0.3)', borderRadius: 16, padding: 13, color: '#A0482C', fontSize: 12, lineHeight: 1.6 }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
