import { describe, expect, it } from 'vitest'
import { runContextAssistant, scoreOverlap } from '../contextAssistant'
import { findBoundaryViolation } from '../summaryAssistant'
import type { HealthRecordEntry } from '../types'

function makeEntry(overrides: Partial<HealthRecordEntry> = {}): HealthRecordEntry {
  return {
    dailyLogId: 'log-1',
    date: '2026-08-10',
    bucket: 'morning',
    symptoms: [],
    affects: [],
    contextTags: { noise: false, weather_change: false, crowded: false },
    understood: null,
    ...overrides,
  }
}

describe('scoreOverlap', () => {
  it('증상이 하나 겹치면 증상 가중치를 반영한다', () => {
    const current = makeEntry({ symptoms: [{ symptom: 'dizziness', score: 5 }] })
    const candidate = makeEntry({ dailyLogId: 'log-2', bucket: 'afternoon', symptoms: [{ symptom: 'dizziness', score: 3 }] })
    const { score, matchedOn } = scoreOverlap(current, candidate)
    expect(score).toBe(0.35)
    expect(matchedOn).toEqual(['symptom:dizziness'])
  })

  it('증상이 여러 개면 가중치를 겹친 증상 수만큼 분배한다', () => {
    const current = makeEntry({
      symptoms: [{ symptom: 'dizziness', score: 5 }, { symptom: 'tinnitus', score: 4 }],
    })
    const candidate = makeEntry({
      dailyLogId: 'log-2',
      bucket: 'afternoon',
      symptoms: [{ symptom: 'dizziness', score: 3 }, { symptom: 'tinnitus', score: 2 }],
    })
    const { score, matchedOn } = scoreOverlap(current, candidate)
    expect(score).toBe(0.35)
    expect(matchedOn).toEqual(['symptom:dizziness', 'symptom:tinnitus'])
  })

  it('score가 0이거나 null인 증상은 매칭에서 제외한다', () => {
    const current = makeEntry({ symptoms: [{ symptom: 'dizziness', score: 0 }, { symptom: 'tinnitus', score: null }] })
    const candidate = makeEntry({ dailyLogId: 'log-2', bucket: 'afternoon', symptoms: [{ symptom: 'dizziness', score: 5 }, { symptom: 'tinnitus', score: 5 }] })
    const { score, matchedOn } = scoreOverlap(current, candidate)
    expect(score).toBe(0)
    expect(matchedOn).toEqual([])
  })

  it('정서(affect)가 겹치면 정서 가중치를 반영한다', () => {
    const current = makeEntry({ affects: [{ affect: 'anxiety', score: 4 }] })
    const candidate = makeEntry({ dailyLogId: 'log-2', bucket: 'afternoon', affects: [{ affect: 'anxiety', score: 6 }] })
    const { score, matchedOn } = scoreOverlap(current, candidate)
    expect(score).toBe(0.15)
    expect(matchedOn).toEqual(['affect:anxiety'])
  })

  it('맥락태그는 겹치는 태그 하나당 0.1씩, 최대 3개(0.3)까지 더해진다', () => {
    const current = makeEntry({ contextTags: { noise: true, weather_change: true, crowded: true } })
    const candidate = makeEntry({ dailyLogId: 'log-2', bucket: 'afternoon', contextTags: { noise: true, weather_change: true, crowded: true } })
    const { score, matchedOn } = scoreOverlap(current, candidate)
    expect(score).toBe(0.3)
    expect(matchedOn).toEqual(['context:noise', 'context:weather_change', 'context:crowded'])
  })

  it('시간대(bucket)가 같으면 가중치를 더한다', () => {
    const current = makeEntry({ bucket: 'evening' })
    const candidate = makeEntry({ dailyLogId: 'log-2', bucket: 'evening' })
    const { score, matchedOn } = scoreOverlap(current, candidate)
    expect(score).toBe(0.1)
    expect(matchedOn).toEqual(['bucket:evening'])
  })

  it('시간대가 다르면 시간대 가점이 없다', () => {
    const current = makeEntry({ bucket: 'evening' })
    const candidate = makeEntry({ dailyLogId: 'log-2', bucket: 'morning' })
    const { score } = scoreOverlap(current, candidate)
    expect(score).toBe(0)
  })

  it('understood가 null이 아니고 같은 값이면 가점을 더한다', () => {
    const current = makeEntry({ understood: true })
    const candidate = makeEntry({ dailyLogId: 'log-2', bucket: 'afternoon', understood: true })
    const { score, matchedOn } = scoreOverlap(current, candidate)
    expect(score).toBe(0.1)
    expect(matchedOn).toEqual(['social:understood'])
  })

  it('understood가 둘 다 null이면 가점을 더하지 않는다', () => {
    const current = makeEntry({ understood: null })
    const candidate = makeEntry({ dailyLogId: 'log-2', bucket: 'afternoon', understood: null })
    const { score } = scoreOverlap(current, candidate)
    expect(score).toBe(0)
  })

  it('understood 값이 서로 다르면 가점을 더하지 않는다', () => {
    const current = makeEntry({ understood: true })
    const candidate = makeEntry({ dailyLogId: 'log-2', bucket: 'afternoon', understood: false })
    const { score } = scoreOverlap(current, candidate)
    expect(score).toBe(0)
  })

  it('모든 조건이 겹치면 합이 1.0으로 클램프된다', () => {
    const current = makeEntry({
      bucket: 'morning',
      symptoms: [{ symptom: 'dizziness', score: 5 }],
      affects: [{ affect: 'anxiety', score: 4 }],
      contextTags: { noise: true, weather_change: true, crowded: true },
      understood: true,
    })
    const candidate = makeEntry({
      dailyLogId: 'log-2',
      bucket: 'morning',
      symptoms: [{ symptom: 'dizziness', score: 3 }],
      affects: [{ affect: 'anxiety', score: 6 }],
      contextTags: { noise: true, weather_change: true, crowded: true },
      understood: true,
    })
    const { score } = scoreOverlap(current, candidate)
    expect(score).toBe(1)
  })
})

describe('runContextAssistant', () => {
  const current = makeEntry({ dailyLogId: 'today', date: '2026-08-16', symptoms: [{ symptom: 'dizziness', score: 5 }] })

  it('자기 자신(dailyLogId 동일)은 결과에서 제외한다', () => {
    const past = [makeEntry({ dailyLogId: 'today', date: '2026-08-16', symptoms: [{ symptom: 'dizziness', score: 5 }] })]
    const result = runContextAssistant({ current, past })
    expect(result.relatedEntries).toEqual([])
  })

  it('overlapScore가 0인 항목은 결과에서 제외한다', () => {
    const past = [makeEntry({ dailyLogId: 'log-2', date: '2026-08-01', bucket: 'afternoon', symptoms: [{ symptom: 'headache', score: 5 }] })]
    const result = runContextAssistant({ current, past })
    expect(result.relatedEntries).toEqual([])
  })

  it('점수 내림차순으로 정렬하고, 동점이면 최신 날짜를 우선한다', () => {
    const past = [
      makeEntry({ dailyLogId: 'log-old', date: '2026-08-01', symptoms: [{ symptom: 'dizziness', score: 3 }] }),
      makeEntry({ dailyLogId: 'log-new', date: '2026-08-10', symptoms: [{ symptom: 'dizziness', score: 3 }] }),
    ]
    const result = runContextAssistant({ current, past })
    expect(result.relatedEntries.map(m => m.entry.dailyLogId)).toEqual(['log-new', 'log-old'])
  })

  it('limit을 적용해 상위 N건만 반환한다 (기본값 5)', () => {
    const past = Array.from({ length: 8 }, (_, i) =>
      makeEntry({ dailyLogId: `log-${i}`, date: `2026-07-${String(i + 1).padStart(2, '0')}`, symptoms: [{ symptom: 'dizziness', score: 3 }] })
    )
    const defaultResult = runContextAssistant({ current, past })
    expect(defaultResult.relatedEntries.length).toBe(5)

    const limitedResult = runContextAssistant({ current, past, limit: 2 })
    expect(limitedResult.relatedEntries.length).toBe(2)
  })

  it('매칭 결과가 있으면 건수를 포함한 질문형 안내 문구를 반환한다', () => {
    const past = [makeEntry({ dailyLogId: 'log-2', date: '2026-08-01', symptoms: [{ symptom: 'dizziness', score: 3 }] })]
    const result = runContextAssistant({ current, past })
    expect(result.message).toBe('비슷한 조건에서 남긴 과거 기록 1건을 찾았어요. 함께 비교해볼까요?')
  })

  it('매칭 결과가 없으면 안내 문구를 반환한다', () => {
    const result = runContextAssistant({ current, past: [] })
    expect(result.message).toBe('아직 비슷한 조건의 과거 기록을 찾지 못했어요.')
  })

  describe('SPEC §0 경계 회귀 — 두 안내 문구 모두 위반 표현이 없어야 한다', () => {
    const past = [makeEntry({ dailyLogId: 'log-2', date: '2026-08-01', symptoms: [{ symptom: 'dizziness', score: 3 }] })]

    it('매칭 있음 문구', () => {
      const { message } = runContextAssistant({ current, past })
      expect(findBoundaryViolation(message)).toBeNull()
    })

    it('매칭 없음 문구', () => {
      const { message } = runContextAssistant({ current, past: [] })
      expect(findBoundaryViolation(message)).toBeNull()
    })
  })
})
