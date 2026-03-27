// =====================================================
// CareFlow 세션 기록 — LocalStorage 기반 퍼시스턴스
// 키: "careflow_sessions"  값: SessionRecord[]
// =====================================================

import type { ObservationDomain, CareAxis, CrisisLevel } from './nursingLogic'

// ─────────────────────────────────────────────────────
// 데이터 구조
// ─────────────────────────────────────────────────────

export interface SessionRecord {
  date: string                         // "2026-03-18"  (로컬 날짜 기준)
  primaryDomain: ObservationDomain
  activeDomains: ObservationDomain[]   // 감지된 전체 도메인 목록 (score 순)
  axisScores: Record<CareAxis, number>
  crisisLevel: CrisisLevel
  messageCount: number                 // 해당 세션 중 사용자 메시지 수
  timestamp: number                    // Date.now()
}

// ─────────────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────────────

const STORAGE_KEY = 'careflow_sessions'
const MAX_RECORDS = 200   // 로컬 스토리지 과부하 방지

// ─────────────────────────────────────────────────────
// 유틸 — 날짜 문자열
// ─────────────────────────────────────────────────────

/** "YYYY-MM-DD" 로컬 날짜 반환 */
export function todayString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 주어진 날짜가 속한 주의 월요일 ~ 일요일 배열 반환 ("YYYY-MM-DD") */
export function weekDates(dateStr: string): string[] {
  const base = new Date(dateStr)
  const dow = base.getDay()  // 0=일, 1=월
  const diffToMonday = (dow + 6) % 7
  const monday = new Date(base)
  monday.setDate(base.getDate() - diffToMonday)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

/** 주어진 달의 "YYYY-MM" 에 해당하는 모든 날짜 반환 */
export function monthDates(yearMonth: string): string[] {
  const [y, m] = yearMonth.split('-').map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, i) => {
    const d = String(i + 1).padStart(2, '0')
    return `${yearMonth}-${d}`
  })
}

// ─────────────────────────────────────────────────────
// 읽기 / 쓰기
// ─────────────────────────────────────────────────────

/** 전체 세션 기록 로드 */
export function loadAllSessions(): SessionRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SessionRecord[]) : []
  } catch {
    return []
  }
}

/** 세션 1건 저장 — 같은 날짜면 기존 레코드를 갱신(messageCount 누적) */
export function saveSession(record: Omit<SessionRecord, 'date' | 'timestamp'>): void {
  if (typeof window === 'undefined') return

  const today = todayString()
  const sessions = loadAllSessions()

  const existingIdx = sessions.findIndex(s => s.date === today)

  if (existingIdx !== -1) {
    // 같은 날이면 더 심각한 crisisLevel 유지, messageCount 누적
    const existing = sessions[existingIdx]
    const crisisPriority: Record<CrisisLevel, number> = {
      critical: 3, urgent: 2, monitor: 1, none: 0,
    }
    const mergedCrisis: CrisisLevel =
      crisisPriority[record.crisisLevel] >= crisisPriority[existing.crisisLevel]
        ? record.crisisLevel
        : existing.crisisLevel

    sessions[existingIdx] = {
      ...record,
      date: today,
      timestamp: Date.now(),
      crisisLevel: mergedCrisis,
      messageCount: existing.messageCount + 1,
    }
  } else {
    sessions.push({
      ...record,
      date: today,
      timestamp: Date.now(),
      messageCount: 1,
    })
  }

  // 최대 레코드 수 초과 시 오래된 것 제거
  const trimmed = sessions
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, MAX_RECORDS)

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch {
    // 스토리지 가득 찬 경우 무시
  }
}

/** 특정 날짜의 기록 가져오기 */
export function getSessionByDate(dateStr: string): SessionRecord | null {
  return loadAllSessions().find(s => s.date === dateStr) ?? null
}

/** 특정 주의 기록 가져오기 (오늘 기준 or 임의 날짜 기준) */
export function getWeekSessions(dateStr: string = todayString()): SessionRecord[] {
  const days = weekDates(dateStr)
  const all = loadAllSessions()
  return all.filter(s => days.includes(s.date))
}

/** 특정 달의 기록 가져오기. yearMonth = "2026-03" */
export function getMonthSessions(yearMonth: string): SessionRecord[] {
  const all = loadAllSessions()
  return all.filter(s => s.date.startsWith(yearMonth))
}

// ─────────────────────────────────────────────────────
// 통계 헬퍼
// ─────────────────────────────────────────────────────

/** 도메인 빈도 집계 */
export function domainFrequency(
  sessions: SessionRecord[],
): Partial<Record<ObservationDomain, number>> {
  const freq: Partial<Record<ObservationDomain, number>> = {}
  for (const s of sessions) {
    freq[s.primaryDomain] = (freq[s.primaryDomain] ?? 0) + 1
  }
  return freq
}

/** 가장 자주 등장한 primaryDomain */
export function topDomain(
  sessions: SessionRecord[],
): ObservationDomain | null {
  const freq = domainFrequency(sessions)
  const entries = Object.entries(freq) as [ObservationDomain, number][]
  if (entries.length === 0) return null
  return entries.sort(([, a], [, b]) => b - a)[0][0]
}

/** 모니터링 이상 감지 횟수 */
export function monitorCount(sessions: SessionRecord[]): number {
  return sessions.filter(s => s.crisisLevel !== 'none').length
}

/** 연속 기록일 수 (오늘 포함해서 가장 긴 streak) */
export function currentStreak(): number {
  const all = loadAllSessions()
  if (all.length === 0) return 0

  const dates = new Set(all.map(s => s.date))
  let streak = 0
  const cursor = new Date()

  while (true) {
    const key = cursor.toISOString().slice(0, 10)
    if (dates.has(key)) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}
