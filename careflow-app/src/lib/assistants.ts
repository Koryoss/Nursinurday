/**
 * 웹에 배포된 Assistant API(app/api/assistants/*)를 모바일에서 호출하는 헬퍼.
 *
 * 웹은 쿠키 세션으로 인증하지만 모바일 앱은 쿠키를 공유하지 않으므로, 현재 Supabase 세션의
 * access token을 Authorization: Bearer 헤더로 실어 보낸다 (app/api/assistants/context/route.ts가
 * 이 헤더를 받아 supabase.auth.getUser(token)으로 검증한다).
 */

import { supabase } from './supabase'
import { API_BASE_URL } from '../constants/api'
import type { ContextAssistantOutput, SummaryAssistantOutput, TimelineAssistantOutput, TimelineGranularity } from '../../../lib/domain/assistants/types'

export type WeeklySummaryResponse = SummaryAssistantOutput & {
  from: string
  to: string
}

export type TimelinePatternsResponse = TimelineAssistantOutput & {
  from: string
  to: string
  granularity: TimelineGranularity
}

/** 오늘(또는 지정한 날짜) 기록과 비슷한 과거 기록을 Context Assistant에서 조회한다.
 *  실패하거나 로그인 세션이 없으면 null을 반환한다 (UI는 이 경우 카드를 표시하지 않는다). */
export async function fetchContextMatches(date: string, limit = 5): Promise<ContextAssistantOutput | null> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) return null

  try {
    const response = await fetch(`${API_BASE_URL}/api/assistants/context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ date, limit }),
    })
    if (!response.ok) return null
    return (await response.json()) as ContextAssistantOutput
  } catch {
    return null
  }
}

/** 지정한 기간을 granularity 단위로 묶어 Timeline Assistant의 반복 패턴 관찰을 조회한다.
 *  DashboardScreen이 이미 클라이언트에서 계산하는 오늘의 band/trend를 대체하는 용도가 아니라,
 *  거기 없는 값(여러 구간에 걸친 반복 패턴 관찰)만 새로 보여주기 위한 것이다.
 *  실패하거나 로그인 세션이 없으면 null을 반환한다 (UI는 이 경우 섹션을 표시하지 않는다). */
export async function fetchTimelinePatterns(
  from: string,
  to: string,
  granularity: TimelineGranularity = 'week'
): Promise<TimelinePatternsResponse | null> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) return null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    const params = new URLSearchParams({ from, to, granularity })
    const response = await fetch(`${API_BASE_URL}/api/assistants/timeline?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
    if (!response.ok) return null
    return (await response.json()) as TimelinePatternsResponse
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

/** 지정한 기간의 기록을 주간 회고 문장으로 정리한다.
 *  호출이 실패해도 원기록 화면은 자체 조회 결과로 계속 사용할 수 있다. */
export async function fetchWeeklySummary(from: string, to: string): Promise<WeeklySummaryResponse | null> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) return null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(`${API_BASE_URL}/api/assistants/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ from, to }),
      signal: controller.signal,
    })
    if (!response.ok) return null
    return (await response.json()) as WeeklySummaryResponse
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}
