// =====================================================
// 히스토리 페이지 — 주간 / 월별 기록 캘린더
// LocalStorage 기반, 서버 불필요
// =====================================================
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  loadAllSessions,
  getWeekSessions,
  getMonthSessions,
  weekDates,
  monthDates,
  topDomain,
  monitorCount,
  currentStreak,
  domainFrequency,
  todayString,
  type SessionRecord,
} from '@/lib/sessionStorage'
import { domainLabels, axisLabels, type ObservationDomain, type CareAxis } from '@/lib/nursingLogic'

// ─────────────────────────────────────────────────────
// 색상 매핑
// ─────────────────────────────────────────────────────

const DOMAIN_COLORS: Record<ObservationDomain, string> = {
  Sleep:        '#6366f1',  // indigo
  Energy:       '#f59e0b',  // amber
  BodySignals:  '#ef4444',  // red
  EmotionFlow:  '#ec4899',  // pink
  Tension:      '#8b5cf6',  // violet
  SelfView:     '#3b82f6',  // blue
  Relationship: '#14b8a6',  // teal
  Direction:    '#84cc16',  // lime
  Growth:       '#10b981',  // emerald
  General:      '#94a3b8',  // slate
}

// macOS 트래픽 라이트 색상
const CRISIS_COLOR: Record<string, string> = {
  none:     '#28C840',   // macOS green
  monitor:  '#FEBC2E',   // macOS yellow
  urgent:   '#FF9F0A',   // macOS orange
  critical: '#FF5F57',   // macOS red
}

// 셀 배경 스타일 (인라인)
const CRISIS_CELL_STYLE: Record<string, React.CSSProperties> = {
  none:     { background: 'rgba(40,200,64,0.12)',   color: '#1A7030' },
  monitor:  { background: 'rgba(254,188,46,0.15)',  color: '#7A5500' },
  urgent:   { background: 'rgba(255,159,10,0.15)',  color: '#7A3800' },
  critical: { background: 'rgba(255,95,87,0.15)',   color: '#7A1500' },
}

// ─────────────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────────────

function toYearMonth(dateStr: string) {
  return dateStr.slice(0, 7)  // "2026-03"
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function dayLabel(dateStr: string) {
  const DAYS = ['일', '월', '화', '수', '목', '금', '토']
  return DAYS[new Date(dateStr).getDay()]
}

// ─────────────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────────────

export default function HistoryPage() {
  const [view, setView] = useState<'week' | 'month'>('week')
  const [today] = useState(todayString())
  const [selectedDate, setSelectedDate] = useState(today)
  const [allSessions, setAllSessions] = useState<SessionRecord[]>([])

  // currentMonth: "2026-03"
  const [currentMonth, setCurrentMonth] = useState(toYearMonth(today))

  useEffect(() => {
    setAllSessions(loadAllSessions())
  }, [])

  // 날짜 → 세션 맵
  const sessionMap = Object.fromEntries(allSessions.map(s => [s.date, s]))

  // ── 주간 데이터 ──
  const weekDays = weekDates(selectedDate)
  const weekSessions = weekDays
    .map(d => sessionMap[d])
    .filter(Boolean) as SessionRecord[]

  // ── 월별 데이터 ──
  const [mYear, mMonth] = currentMonth.split('-').map(Number)
  const firstDayOfMonth = new Date(mYear, mMonth - 1, 1).getDay()  // 0=일
  const daysInMonth = new Date(mYear, mMonth, 0).getDate()
  const monthSessions = getMonthSessions(currentMonth)
    .reduce((acc, s) => { acc[s.date] = s; return acc }, {} as Record<string, SessionRecord>)

  // ── 선택 날짜 세션 ──
  const selectedSession = sessionMap[selectedDate] ?? null

  // ── 통계 ──
  const streak = currentStreak()
  const weekTopDomain = topDomain(weekSessions)
  const weekMonitorCnt = monitorCount(weekSessions)
  const monthSessionsList = Object.values(monthSessions)
  const monthTopDomain = topDomain(monthSessionsList)
  const monthMonitorCnt = monitorCount(monthSessionsList)

  // ── 도메인 빈도 (주간 바 차트용) ──
  const freq = domainFrequency(weekSessions)
  const freqEntries = Object.entries(freq) as [ObservationDomain, number][]
  const maxFreq = Math.max(1, ...freqEntries.map(([, v]) => v))

  return (
    <div className="min-h-screen" style={{ background: '#FFFBF3' }}>

      {/* ── 헤더 ── */}
      <header className="px-4 py-3 flex items-center justify-between shadow-sm" style={{ background: '#FFF8EC', borderBottom: '1px solid #EAD9BA' }}>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm" style={{ color: '#2C1C10' }}>🌼 CareFlow</span>
          <span className="text-xs text-gray-400">나의 기록</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/chat" className="text-gray-400 hover:text-gray-600 transition-colors" title="채팅으로">
            {/* 채팅 아이콘 */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </Link>
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors" title="홈으로">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </Link>
        </div>
      </header>

      {/* ── 뷰 탭 ── */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
          {(['week', 'month'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="flex-1 py-2 text-sm font-medium rounded-lg transition-colors"
              style={view === v
                ? { background: '#FFF8EC', color: '#2C1C10', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                : { color: '#8B6F57' }
              }
            >
              {v === 'week' ? '주간' : '월별'}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pb-12">

        {/* ═══════════════════════════════════════════
            주간 뷰
        ═══════════════════════════════════════════ */}
        {view === 'week' && (
          <div className="space-y-4">

            {/* 주 이동 */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  const d = new Date(weekDays[0])
                  d.setDate(d.getDate() - 7)
                  setSelectedDate(d.toISOString().slice(0, 10))
                }}
                className="text-gray-400 hover:text-gray-600 px-2 py-1"
              >
                ‹ 이전 주
              </button>
              <span className="text-sm text-gray-500">
                {formatDate(weekDays[0])} – {formatDate(weekDays[6])}
              </span>
              <button
                onClick={() => {
                  const d = new Date(weekDays[0])
                  d.setDate(d.getDate() + 7)
                  const next = d.toISOString().slice(0, 10)
                  if (next <= today) setSelectedDate(next)
                }}
                className="text-gray-400 hover:text-gray-600 px-2 py-1 disabled:opacity-30"
                disabled={weekDays[6] >= today}
              >
                다음 주 ›
              </button>
            </div>

            {/* 7일 스트립 */}
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map(d => {
                const s = sessionMap[d]
                const isToday = d === today
                const isSelected = d === selectedDate
                const isPast = d <= today

                return (
                  <button
                    key={d}
                    onClick={() => isPast && setSelectedDate(d)}
                    disabled={!isPast}
                    className={`
                      flex flex-col items-center py-2 rounded-xl transition-colors
                      ${isSelected ? 'bg-white shadow' : 'hover:bg-white/60'}
                      ${!isPast ? 'opacity-30 cursor-not-allowed' : ''}
                    `}
                  >
                    <span className={`text-xs mb-1 ${isToday ? 'font-bold' : 'text-gray-400'}`} style={isToday ? { color: '#28C840' } : {}}>
                      {dayLabel(d)}
                    </span>
                    {s ? (
                      <>
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: DOMAIN_COLORS[s.primaryDomain] }}
                        >
                          {new Date(d).getDate()}
                        </div>
                        {/* 미니 도메인 점 */}
                        <div className="flex gap-0.5 mt-1">
                          {s.activeDomains.slice(0, 3).map((dm, i) => (
                            <div
                              key={i}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: DOMAIN_COLORS[dm] }}
                            />
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-300">
                        {new Date(d).getDate()}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* 선택 날짜 상세 */}
            {selectedSession ? (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">
                    {formatDate(selectedDate)} ({dayLabel(selectedDate)})
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={CRISIS_CELL_STYLE[selectedSession.crisisLevel]}
                  >
                    {selectedSession.crisisLevel === 'none' ? '자기돌봄' :
                     selectedSession.crisisLevel === 'monitor' ? '모니터링' :
                     selectedSession.crisisLevel === 'urgent' ? '긴급' : '위기'}
                  </span>
                </div>
                {/* 활성 도메인 태그 */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {selectedSession.activeDomains.map(dm => (
                    <span
                      key={dm}
                      className="text-xs px-2 py-1 rounded-full text-white"
                      style={{ backgroundColor: DOMAIN_COLORS[dm] }}
                    >
                      {domainLabels[dm]}
                    </span>
                  ))}
                </div>
                {/* 4축 점수 바 */}
                <div className="space-y-1.5">
                  {(Object.entries(selectedSession.axisScores) as [CareAxis, number][])
                    .filter(([, v]) => v > 0)
                    .sort(([, a], [, b]) => b - a)
                    .map(([axis, score]) => (
                      <div key={axis} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-8">{axisLabels[axis]}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ backgroundColor: '#28C840', width: `${Math.min(100, score * 10)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{score}</span>
                      </div>
                    ))}
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  대화 {selectedSession.messageCount}개 · {new Date(selectedSession.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ) : selectedDate <= today ? (
              <div className="bg-white/60 rounded-2xl p-4 text-center">
                <p className="text-sm text-gray-400">{formatDate(selectedDate)}에는 기록이 없어요</p>
                <Link href="/chat" className="mt-2 inline-block text-xs underline" style={{ color: '#28C840' }}>
                  지금 이야기하러 가기 →
                </Link>
              </div>
            ) : null}

            {/* 주간 도메인 빈도 바 차트 */}
            {freqEntries.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="text-xs font-semibold text-gray-500 mb-3">이번 주 관찰 영역</h3>
                <div className="space-y-2">
                  {freqEntries.sort(([, a], [, b]) => b - a).map(([dm, cnt]) => (
                    <div key={dm} className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 w-20 shrink-0">{domainLabels[dm]}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(cnt / maxFreq) * 100}%`,
                            backgroundColor: DOMAIN_COLORS[dm],
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-4 text-right">{cnt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 주간 요약 카드 */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '기록한 날', value: `${weekSessions.length}일` },
                { label: '주요 영역', value: weekTopDomain ? domainLabels[weekTopDomain] : '—' },
                { label: '모니터링', value: `${weekMonitorCnt}회` },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-xl p-3 text-center shadow-sm">
                  <p className="text-lg font-bold" style={{ color: '#2C1C10' }}>{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════
            월별 뷰
        ═══════════════════════════════════════════ */}
        {view === 'month' && (
          <div className="space-y-4">

            {/* 월 이동 */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  const [y, m] = currentMonth.split('-').map(Number)
                  const prev = new Date(y, m - 2, 1)
                  setCurrentMonth(prev.toISOString().slice(0, 7))
                }}
                className="text-gray-400 hover:text-gray-600 px-2 py-1"
              >
                ‹ 이전
              </button>
              <span className="text-sm font-semibold text-gray-600">
                {mYear}년 {mMonth}월
              </span>
              <button
                onClick={() => {
                  const [y, m] = currentMonth.split('-').map(Number)
                  const next = new Date(y, m, 1)
                  const nextStr = next.toISOString().slice(0, 7)
                  if (nextStr <= toYearMonth(today)) setCurrentMonth(nextStr)
                }}
                className="text-gray-400 hover:text-gray-600 px-2 py-1"
                disabled={currentMonth >= toYearMonth(today)}
              >
                다음 ›
              </button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['일', '월', '화', '수', '목', '금', '토'].map(d => (
                <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>
              ))}
            </div>

            {/* 캘린더 그리드 */}
            <div className="grid grid-cols-7 gap-1">
              {/* 첫 날 앞 빈칸 */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {/* 날짜 셀 */}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = String(i + 1).padStart(2, '0')
                const dateStr = `${currentMonth}-${day}`
                const s = monthSessions[dateStr]
                const isToday = dateStr === today
                const isPast = dateStr <= today

                return (
                  <button
                    key={dateStr}
                    onClick={() => {
                      if (isPast) {
                        setSelectedDate(dateStr)
                        setView('week')
                      }
                    }}
                    disabled={!isPast}
                    className={`
                      aspect-square rounded-lg flex flex-col items-center justify-center
                      text-xs transition-colors
                      ${!s ? (isPast ? 'bg-gray-50 text-gray-400' : 'text-gray-400') : ''}
                      ${!isPast ? 'opacity-25 cursor-not-allowed' : 'hover:opacity-80'}
                    `}
                    style={{
                      ...(s ? CRISIS_CELL_STYLE[s.crisisLevel] : {}),
                      ...(isToday ? { outline: `2px solid #28C840`, outlineOffset: '1px' } : {}),
                    }}
                  >
                    <span className="font-medium">{i + 1}</span>
                    {s && (
                      <div
                        className="w-1.5 h-1.5 rounded-full mt-0.5"
                        style={{ backgroundColor: DOMAIN_COLORS[s.primaryDomain] }}
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {/* 범례 */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              {[
                { label: '자기돌봄', color: '#28C840' },
                { label: '모니터링', color: '#FEBC2E' },
                { label: '긴급',     color: '#FF9F0A' },
                { label: '위기',     color: '#FF5F57' },
              ].map(({ label, color }) => (
                <span key={label} className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                  {label}
                </span>
              ))}
            </div>

            {/* 월 요약 카드 */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '기록한 날', value: `${monthSessionsList.length}일` },
                { label: '주요 영역', value: monthTopDomain ? domainLabels[monthTopDomain] : '—' },
                { label: '모니터링 감지', value: `${monthMonitorCnt}회` },
                { label: '연속 기록', value: `${streak}일` },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-xl p-3 shadow-sm">
                  <p className="text-lg font-bold" style={{ color: '#2C1C10' }}>{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* 이번 달 도메인 빈도 */}
            {monthSessionsList.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="text-xs font-semibold text-gray-500 mb-3">이번 달 관찰 영역</h3>
                <div className="space-y-2">
                  {(Object.entries(domainFrequency(monthSessionsList)) as [ObservationDomain, number][])
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([dm, cnt]) => (
                      <div key={dm} className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-20 shrink-0">{domainLabels[dm]}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(cnt / Math.max(...monthSessionsList.map(s => 1))) * 100}%`,
                              backgroundColor: DOMAIN_COLORS[dm],
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-4 text-right">{cnt}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 기록 없을 때 CTA */}
        {allSessions.length === 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm mb-4">아직 기록이 없어요.<br />첫 번째 이야기를 시작해볼까요?</p>
            <Link
              href="/chat"
              className="inline-block font-semibold px-6 py-3 rounded-xl transition-opacity hover:opacity-80 text-sm"
              style={{ background: '#28C840', color: '#fff' }}
            >
              지금 이야기 시작하기 →
            </Link>
          </div>
        )}

      </main>
    </div>
  )
}
