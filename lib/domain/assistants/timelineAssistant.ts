/**
 * Timeline Assistant (docs/ai-flow.md §3)
 *
 * 목적: 건강 기록을 시간의 흐름(일/주/월)에 따라 정리해 장기적인 변화를 확인하도록 지원한다.
 * 책임: 일·주·월 단위 기록 정리, 증상 발생 시점 연결, 건강 변화 흐름 정리, 반복 패턴 확인.
 * 원칙: 순수 데이터 집계만 수행한다. 원인 분석·진단·예후 표현을 하지 않으며,
 *       문구는 항상 "관찰됐어요 / 함께 볼까요"처럼 질문형·관찰형으로 남긴다.
 *
 * 개인 7일 기준선(baseline) 대비 band 계산은 lib/domain/socialReturnIndicators.ts를 그대로 재사용한다.
 * (SPEC §2: 절대 임상 컷오프·진단명 산출 금지 — 항상 본인 기준선 대비 상대값만 사용)
 */

import {
  bandFromZ,
  buildBaselines,
  mean,
  type Band,
  type Baseline,
  type DailyMetricPoint,
  type MetricKey,
} from '../socialReturnIndicators'
import type {
  HealthRecordEntry,
  RecurringPattern,
  TimelineAssistantInput,
  TimelineAssistantOutput,
  TimelineGranularity,
  TimelinePeriodPoint,
} from './types'

const METRICS: MetricKey[] = ['dizziness', 'gait', 'anxiety', 'tension', 'sleep']

function symptomAverage(entry: HealthRecordEntry, symptom: string): number | null {
  const scores = entry.symptoms
    .filter(item => item.symptom === symptom && typeof item.score === 'number')
    .map(item => item.score as number)
  if (scores.length === 0) return null
  return mean(scores)
}

function affectAverage(entry: HealthRecordEntry, affect: string): number | null {
  const scores = entry.affects
    .filter(item => item.affect === affect && typeof item.score === 'number')
    .map(item => item.score as number)
  if (scores.length === 0) return null
  return mean(scores)
}

/** HealthRecordEntry[] → 기존 지표 로직이 쓰는 DailyMetricPoint[]로 변환 (하루에 여러 기록이 있으면 평균) */
export function entriesToDailyMetricPoints(entries: HealthRecordEntry[]): DailyMetricPoint[] {
  const byDate = new Map<string, HealthRecordEntry[]>()
  entries.forEach(entry => {
    const list = byDate.get(entry.date) ?? []
    list.push(entry)
    byDate.set(entry.date, list)
  })

  return Array.from(byDate.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, dayEntries]) => {
      const point: DailyMetricPoint = { date }
      const dizziness = dayEntries.map(e => symptomAverage(e, 'dizziness')).filter((v): v is number => v !== null)
      const gait = dayEntries.map(e => symptomAverage(e, 'gait')).filter((v): v is number => v !== null)
      const anxiety = dayEntries.map(e => affectAverage(e, 'anxiety')).filter((v): v is number => v !== null)
      const tension = dayEntries.map(e => affectAverage(e, 'tension')).filter((v): v is number => v !== null)
      if (dizziness.length) point.dizziness = mean(dizziness)
      if (gait.length) point.gait = mean(gait)
      if (anxiety.length) point.anxiety = mean(anxiety)
      if (tension.length) point.tension = mean(tension)
      return point
    })
}

/** ISO 8601 주차 키 (YYYY-Www) — 월요일 시작 */
function isoWeekKey(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00.000Z`)
  const day = (date.getUTCDay() + 6) % 7 // 월=0 ... 일=6
  date.setUTCDate(date.getUTCDate() - day + 3) // 해당 주 목요일로 이동 (ISO 기준)
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4))
  const firstThursdayDay = (firstThursday.getUTCDay() + 6) % 7
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstThursdayDay + 3)
  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000))
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

function periodKey(date: string, granularity: TimelineGranularity): string {
  if (granularity === 'day') return date
  if (granularity === 'month') return date.slice(0, 7)
  return isoWeekKey(date)
}

function averageMetric(points: DailyMetricPoint[], metric: MetricKey): number | null {
  const values = points.map(point => point[metric]).filter((v): v is number => typeof v === 'number')
  if (values.length === 0) return null
  return Math.round(mean(values) * 10) / 10
}

function bandsFor(point: { [K in MetricKey]?: number | null }, baselines: Baseline[]): Partial<Record<MetricKey, Band>> {
  const byMetric = Object.fromEntries(baselines.map(baseline => [baseline.metric, baseline])) as Partial<Record<MetricKey, Baseline>>
  const bands: Partial<Record<MetricKey, Band>> = {}
  METRICS.forEach(metric => {
    const value = point[metric]
    if (value === undefined || value === null) return
    bands[metric] = bandFromZ(value, byMetric[metric])
  })
  return bands
}

/** 반복 패턴 확인: 최근 구간에서 특정 지표가 연속으로 'high' band인지만 관찰 (원인 분석 없음) */
function detectRecurringPatterns(periods: TimelinePeriodPoint[]): RecurringPattern[] {
  const patterns: RecurringPattern[] = []
  const recent = periods.slice(-4) // 최근 4개 구간까지만 확인

  METRICS.forEach(metric => {
    const highStreak = recent.filter(period => period.bands[metric] === 'high').length
    if (highStreak >= 2) {
      patterns.push({
        metric,
        description: `최근 ${recent.length}개 구간 중 ${highStreak}번, 개인 기준선보다 이 신호가 높게 관찰됐어요. 함께 살펴볼까요?`,
        periodsObserved: highStreak,
      })
    }
  })

  return patterns
}

export function runTimelineAssistant(input: TimelineAssistantInput): TimelineAssistantOutput {
  const granularity = input.granularity ?? 'week'
  const dailyPoints = entriesToDailyMetricPoints(input.entries)
  const baselines = buildBaselines(dailyPoints)

  const byPeriod = new Map<string, DailyMetricPoint[]>()
  dailyPoints.forEach(point => {
    const key = periodKey(point.date, granularity)
    const list = byPeriod.get(key) ?? []
    list.push(point)
    byPeriod.set(key, list)
  })

  const timeline: TimelinePeriodPoint[] = Array.from(byPeriod.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([period, points]) => {
      const metrics: Partial<Record<MetricKey, number | null>> = {}
      METRICS.forEach(metric => {
        metrics[metric] = averageMetric(points, metric)
      })
      return {
        period,
        entryCount: points.length,
        metrics,
        bands: bandsFor(metrics, baselines),
      }
    })

  return {
    timeline,
    patterns: detectRecurringPatterns(timeline),
  }
}
