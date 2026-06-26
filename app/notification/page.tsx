'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import IPhoneFrame from '../components/IPhoneFrame'
import { CARE_COLORS, CARE_RADIUS } from '@/lib/designTokens'

type ReminderKey = 'wake' | 'morning' | 'noon' | 'evening' | 'bedtime'

type Reminder = {
  label: string
  group: '수면' | '투약'
  time: string
  enabled: boolean
}

const SAGE = CARE_COLORS.primary
const SAGE_DARK = CARE_COLORS.primaryDark
const TEXT = CARE_COLORS.text
const TEXT_MID = CARE_COLORS.mid
const TEXT_LIGHT = CARE_COLORS.light
const BORDER = CARE_COLORS.border
const CARD = CARE_COLORS.card
const SAGE_SOFT = CARE_COLORS.primarySoft

const GLASS = {
  background: CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: 18,
  boxShadow: 'none',
}

const MEDS: Reminder[] = [
  { label: '아침', time: '08:00', group: '투약', enabled: true },
  { label: '점심', time: '13:00', group: '투약', enabled: true },
  { label: '저녁', time: '18:00', group: '투약', enabled: true },
]

const FEED = [
  { icon: '💊', text: '아침 복약 시간이에요', time: '오전 8:00', done: true, axis: null, dB: null },
  { icon: '👂', text: '이명 기록됨', time: '오전 10:23', done: true, axis: '몸', dB: '58dB' },
  { icon: '💊', text: '점심 복약 시간이에요', time: '오후 1:00', done: true, axis: null, dB: null },
  { icon: '📋', text: '오후 체크인 시간이에요', time: '오후 3:41', done: false, axis: null, dB: null },
  { icon: '💊', text: '저녁 복약 시간이에요', time: '오후 6:00', done: false, axis: null, dB: null },
  { icon: '🌙', text: '수면 기록을 남겨보세요', time: '오후 9:30', done: false, axis: '의미', dB: null },
]

const AXIS_COLOR: Record<string, string> = { 몸: '#C58F5B', 감정: '#9B8AC6', 관계: '#5C7A5E', 의미: '#B7A35A' }
const AXIS_TEXT: Record<string, string> = { 몸: '#7A5A36', 감정: '#5F5279', 관계: SAGE_DARK, 의미: '#6F6534' }

const TIME_OPTIONS = Array.from({ length: 96 }, (_, index) => {
  const hour = Math.floor(index / 4)
  const minute = (index % 4) * 15
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
})

const INITIAL_REMINDERS: Record<ReminderKey, Reminder> = {
  wake: { label: '기상 직후', group: '수면', time: '07:00', enabled: true },
  morning: { label: '아침', group: '투약', time: '08:00', enabled: true },
  noon: { label: '점심', group: '투약', time: '12:30', enabled: false },
  evening: { label: '저녁', group: '투약', time: '19:00', enabled: true },
  bedtime: { label: '취침 전', group: '수면', time: '22:30', enabled: true },
}

function parseTime(time: string) {
  const [hour, minute] = time.split(':').map(Number)
  return { hour: hour || 0, minute: minute || 0 }
}

function AnalogClock({ time }: { time: string }) {
  const { hour, minute } = parseTime(time)
  const minuteAngle = minute * 6
  const hourAngle = ((hour % 12) + minute / 60) * 30

  return (
    <div style={{ width: 178, height: 178, borderRadius: 89, border: `8px solid ${SAGE}`, background: CARE_COLORS.surface, position: 'relative', display: 'grid', placeItems: 'center', margin: '16px auto 8px' }}>
      {[12, 3, 6, 9].map(number => {
        const positions: Record<number, React.CSSProperties> = {
          12: { position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)' },
          3: { position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' },
          6: { position: 'absolute', bottom: 9, left: '50%', transform: 'translateX(-50%)' },
          9: { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' },
        }
        return (
          <div key={number} style={{ ...positions[number], color: CARE_COLORS.mid, fontSize: 16, fontWeight: 900 }}>{number}</div>
        )
      })}
      <div style={{ position: 'absolute', width: 6, height: 48, borderRadius: 3, background: SAGE_DARK, transformOrigin: 'bottom', transform: `rotate(${hourAngle}deg)` }} />
      <div style={{ position: 'absolute', width: 6, height: 64, borderRadius: 3, background: SAGE, transformOrigin: 'bottom', transform: `rotate(${minuteAngle}deg)` }} />
      <div style={{ width: 14, height: 14, borderRadius: 7, background: SAGE_DARK, position: 'absolute' }} />
    </div>
  )
}

export default function NotificationPage() {
  const [reminders, setReminders] = useState<Record<ReminderKey, Reminder>>(INITIAL_REMINDERS)
  const [activeKey, setActiveKey] = useState<ReminderKey>('morning')
  const [pickerKey, setPickerKey] = useState<ReminderKey | null>(null)
  const [meds, setMeds] = useState(true)
  const [checkin, setCheckin] = useState(true)
  const [sleep, setSleep] = useState(false)
  const [weekly, setWeekly] = useState(true)
  const [message, setMessage] = useState('')
  const currentHour = new Date().getHours()
  const activeReminder = reminders[activeKey]

  const updateReminder = (key: ReminderKey, patch: Partial<Reminder>) => {
    setReminders(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }))
  }

  const chooseTime = (time: string) => {
    if (pickerKey) {
      updateReminder(pickerKey, { time })
      setActiveKey(pickerKey)
    }
    setPickerKey(null)
  }

  const openSystemAlarm = () => {
    setMessage('웹에서는 휴대폰 알람 연동을 지원하지 않습니다.')
  }

  const renderReminder = (key: ReminderKey) => {
    const item = reminders[key]
    const selected = activeKey === key
    return (
      <button
        key={key}
        type="button"
        onClick={() => setActiveKey(key)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px',
          borderRadius: 20,
          border: `1px solid ${selected ? SAGE : BORDER}`,
          background: selected ? `${CARE_COLORS.primarySoft}20` : CARD,
          cursor: 'pointer',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: TEXT }}>{item.label}</div>
          <div style={{ fontSize: 15, color: TEXT_LIGHT, marginTop: 3 }}>{item.group} 시간</div>
        </div>
        <button
          type="button"
          onClick={event => { event.stopPropagation(); setPickerKey(key) }}
          style={{ minWidth: 86, minHeight: 46, borderRadius: 16, border: `1px solid ${BORDER}`, background: CARD, color: SAGE_DARK, fontWeight: 900, fontSize: 18, cursor: 'pointer' }}
        >
          {item.time}
        </button>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={item.enabled}
            onChange={event => updateReminder(key, { enabled: event.target.checked })}
            style={{ width: 40, height: 24, accentColor: SAGE }}
          />
        </label>
      </button>
    )
  }

  return (
    <IPhoneFrame
      sub={`${new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })} · 알림 설정 · 피드`}
      action={
        <Link
          href="/explore"
          style={{
            color: SAGE_DARK,
            fontSize: 12,
            fontWeight: 900,
            textDecoration: 'none',
            padding: '6px 10px',
            border: `1px solid ${BORDER}`,
            borderRadius: 999,
            background: '#fff',
            whiteSpace: 'nowrap',
          }}
        >
          ✍️ 기록
        </Link>
      }
    >
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 16px 0', scrollbarWidth: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ ...GLASS, overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ padding: '13px 16px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>💊</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>오늘의 복약</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, color: TEXT_LIGHT }}>3회</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {MEDS.map((m, i) => {
              const passed = currentHour > Number(m.time.slice(0, 2))
              return (
                <div key={m.label} style={{ position: 'relative', margin: '0 10px', marginBottom: i === MEDS.length - 1 ? 10 : 4, borderRadius: 16, overflow: 'hidden', background: '#fff', border: `1px solid ${BORDER}` }}>
                  {passed && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1.2, delay: i * 0.15, ease: 'easeOut' }}
                      style={{ position: 'absolute', inset: 0, background: `${SAGE_SOFT}40`, borderRadius: 16, zIndex: 0 }}
                    />
                  )}
                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: passed ? `${SAGE_SOFT}40` : 'rgba(92,122,94,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 15 }}>💊</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>{m.label} 복약</div>
                        <div style={{ fontSize: 10, color: TEXT_MID, marginTop: 1 }}>{m.time}</div>
                      </div>
                    </div>
                    {passed ? (
                      <span style={{ fontSize: 11, fontWeight: 700, color: SAGE_DARK, background: `${SAGE_SOFT}40`, padding: '3px 10px', borderRadius: 99 }}>✓ 완료</span>
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 800, color: SAGE_DARK }}>{m.time}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ ...GLASS, overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ padding: '13px 16px 8px', fontSize: 10, fontWeight: 700, color: TEXT_MID, letterSpacing: 0.8, textTransform: 'uppercase' }}>알림 설정</div>
          {[
            { icon: '💊', label: '복약 알림', sub: '아침·점심·저녁 복약 시간', val: meds, set: setMeds },
            { icon: '📋', label: '하루 체크인', sub: '오후 3시 기록 리마인더', val: checkin, set: setCheckin },
            { icon: '🌙', label: '수면 기록', sub: '취침 전 수면 패턴 기록', val: sleep, set: setSleep },
            { icon: '📊', label: '주간 리포트', sub: '매주 월요일 지난 주 요약', val: weekly, set: setWeekly },
          ].map((item, i, arr) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>{item.label}</div>
                <div style={{ fontSize: 10, color: TEXT_LIGHT, marginTop: 1 }}>{item.sub}</div>
              </div>
              <button
                type="button"
                onClick={() => item.set(!item.val)}
                style={{ width: 44, height: 26, borderRadius: 13, position: 'relative', cursor: 'pointer', background: item.val ? SAGE : '#DDE5DF', border: 'none' }}
              >
                <motion.div
                  animate={{ left: item.val ? 21 : 3 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{ position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.18)' }}
                />
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: TEXT_MID, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 2 }}>오늘 알림</div>
          {FEED.map((note, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 280 }}
              style={{ ...GLASS, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, opacity: note.done ? 0.75 : 1, borderRadius: 20 }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 13, background: note.axis ? `${AXIS_COLOR[note.axis]}18` : 'rgba(92,122,94,0.10)', border: `1px solid ${note.axis ? AXIS_COLOR[note.axis] + '30' : BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 18 }}>{note.icon}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: note.done ? 500 : 700, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.text}</span>
                  {note.dB && <span style={{ fontSize: 9, color: TEXT_LIGHT, flexShrink: 0, background: `${SAGE_SOFT}40`, padding: '1px 5px', borderRadius: 99 }}>{note.dB}</span>}
                </div>
                <div style={{ fontSize: 10, color: TEXT_LIGHT, marginTop: 2 }}>{note.time}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                {note.axis && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: `${AXIS_COLOR[note.axis]}18`, color: AXIS_TEXT[note.axis] }}>{note.axis}</span>}
                {!note.done && <div style={{ width: 7, height: 7, borderRadius: '50%', background: SAGE, boxShadow: '0 0 6px rgba(92,122,94,0.42)' }} />}
              </div>
            </motion.div>
          ))}
        </div>

        <div style={{ height: 8 }} />
      </div>

      {pickerKey !== null ? (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.18)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 18, zIndex: 1000 }}>
          <div style={{ width: '100%', maxWidth: 360, borderRadius: 24, background: CARD, border: `1px solid ${BORDER}`, padding: 20, boxShadow: '0 24px 70px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: 21, fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: 16 }}>{pickerKey ? reminders[pickerKey].label : ''}</div>
            <div style={{ maxHeight: 340, overflowY: 'auto', display: 'grid', gap: 10 }}>
              {TIME_OPTIONS.map(time => {
                const selected = pickerKey ? reminders[pickerKey].time === time : false
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => chooseTime(time)}
                    style={{
                      minHeight: 48,
                      width: '100%',
                      borderRadius: 18,
                      border: `1px solid ${selected ? SAGE : BORDER}`,
                      background: selected ? SAGE_SOFT : CARD,
                      color: selected ? SAGE_DARK : TEXT,
                      fontSize: 18,
                      fontWeight: 900,
                      cursor: 'pointer',
                    }}
                  >
                    {time}
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => setPickerKey(null)}
              style={{ marginTop: 16, width: '100%', minHeight: 54, borderRadius: 20, border: 'none', background: CARE_COLORS.surface, color: SAGE_DARK, fontWeight: 900, cursor: 'pointer' }}
            >
              닫기
            </button>
          </div>
        </div>
      ) : null}
    </IPhoneFrame>
  )
}
