import { describe, expect, it, vi } from 'vitest'
import {
  aggregateKeySymptoms,
  buildSummaryUserPrompt,
  extractRepeatedNotes,
  findBoundaryViolation,
  hasScoredSignal,
  runSummaryAssistant,
  BOUNDARY_SAFE_FALLBACK_SUMMARY,
} from '../summaryAssistant'
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

describe('aggregateKeySymptoms', () => {
  it('점수가 있는 증상만 집계하고 평균/횟수를 계산한다', () => {
    const entries = [
      makeEntry({ symptoms: [{ symptom: 'dizziness', score: 4 }, { symptom: 'tinnitus', score: null }] }),
      makeEntry({ symptoms: [{ symptom: 'dizziness', score: 6 }] }),
    ]
    const result = aggregateKeySymptoms(entries)
    expect(result).toEqual([{ symptom: 'dizziness', count: 2, avgScore: 5 }])
  })

  it('증상이 없으면 빈 배열을 반환한다', () => {
    expect(aggregateKeySymptoms([])).toEqual([])
  })

  it('출현 횟수 기준 내림차순 정렬한다', () => {
    const entries = [
      makeEntry({ symptoms: [{ symptom: 'headache', score: 3 }] }),
      makeEntry({ symptoms: [{ symptom: 'dizziness', score: 4 }] }),
      makeEntry({ symptoms: [{ symptom: 'dizziness', score: 5 }] }),
    ]
    const result = aggregateKeySymptoms(entries)
    expect(result[0].symptom).toBe('dizziness')
    expect(result[0].count).toBe(2)
  })
})

describe('extractRepeatedNotes', () => {
  it('빈 문자열/공백을 무시하고 반복 빈도순 상위 5개만 반환한다', () => {
    const notes = ['잠을 잘 못잤다', '  ', '잠을 잘 못잤다', '', '두통이 있었다']
    const result = extractRepeatedNotes(notes)
    expect(result[0]).toBe('잠을 잘 못잤다')
    expect(result).toContain('두통이 있었다')
    expect(result.length).toBeLessThanOrEqual(5)
  })

  it('입력이 없으면 빈 배열을 반환한다', () => {
    expect(extractRepeatedNotes([])).toEqual([])
  })
})

describe('hasScoredSignal', () => {
  it('증상 점수가 하나라도 있으면 true', () => {
    expect(hasScoredSignal([makeEntry({ symptoms: [{ symptom: 'dizziness', score: 3 }] })])).toBe(true)
  })

  it('감정 점수가 하나라도 있으면 true', () => {
    expect(hasScoredSignal([makeEntry({ affects: [{ affect: 'anxiety', score: 2 }] })])).toBe(true)
  })

  it('증상/감정 점수가 전부 null이면 false', () => {
    const entries = [
      makeEntry({ symptoms: [{ symptom: 'dizziness', score: null }], affects: [{ affect: 'anxiety', score: null }] }),
    ]
    expect(hasScoredSignal(entries)).toBe(false)
  })

  it('entries가 비어있으면 false', () => {
    expect(hasScoredSignal([])).toBe(false)
  })
})

describe('buildSummaryUserPrompt', () => {
  it('기록이 없는 필드는 없음으로 채워 넣는다', () => {
    const prompt = buildSummaryUserPrompt([makeEntry()], [], [])
    expect(prompt).toContain('증상[없음]')
    expect(prompt).toContain('감정[없음]')
    expect(prompt).toContain('[증상 집계]\n없음')
    expect(prompt).toContain('[사용자가 남긴 메모]\n없음')
  })

  it('증상/감정 점수를 문자열로 나열한다', () => {
    const entry = makeEntry({
      symptoms: [{ symptom: 'dizziness', score: 4 }],
      affects: [{ affect: 'anxiety', score: 3 }],
    })
    const prompt = buildSummaryUserPrompt([entry], [{ symptom: 'dizziness', count: 1, avgScore: 4 }], ['메모1'])
    expect(prompt).toContain('dizziness 4')
    expect(prompt).toContain('anxiety 3')
    expect(prompt).toContain('메모1')
  })
})

describe('findBoundaryViolation — SPEC §0 경계 검사', () => {
  const violatingExamples: Array<[string, string]> = [
    ['이명이 지속되는 것을 보면 메니에르병입니다.', 'diagnosis'],
    ['현재 증상은 중등도 수준으로 보여요.', 'severity'],
    ['시간이 지나면 자연히 회복될 가능성이 높아요.', 'prognosis'],
    ['전정재활운동을 하세요.', 'prescription'],
    ['소음 노출 때문에 어지럼이 심해졌어요.', 'causal'],
  ]

  it.each(violatingExamples)('위반 문구를 감지한다: "%s"', (text, expectedLabel) => {
    expect(findBoundaryViolation(text)).toBe(expectedLabel)
  })

  const cleanExamples = [
    '이번 주는 어지럼 점수가 지난주보다 낮게 기록됐어요. 함께 살펴볼까요?',
    '소음이 있던 날과 어지럼 점수가 높았던 날이 함께 나타났어요.',
    '이해받았다고 표시한 날이 많았네요. 오늘도 기록해볼까요?',
  ]

  it.each(cleanExamples)('SPEC을 지키는 문구는 통과시킨다: "%s"', text => {
    expect(findBoundaryViolation(text)).toBeNull()
  })
})

describe('runSummaryAssistant', () => {
  it('기록이 없으면 OpenAI를 호출하지 않고 기본 안내 문구를 반환한다', async () => {
    const create = vi.fn()
    const openai = { chat: { completions: { create } } } as any

    const result = await runSummaryAssistant(openai, { entries: [] })

    expect(create).not.toHaveBeenCalled()
    expect(result.summary).toContain('기록이 없어요')
    expect(result.keySymptoms).toEqual([])
    expect(result.structuredRecord).toEqual([])
  })

  it('정상적인 LLM 응답은 그대로 반환한다', async () => {
    const create = vi.fn().mockResolvedValue({
      choices: [{ message: { content: '어지럼 점수가 이번 주 다소 낮아졌어요. 함께 볼까요?' } }],
    })
    const openai = { chat: { completions: { create } } } as any

    const result = await runSummaryAssistant(openai, {
      entries: [makeEntry({ symptoms: [{ symptom: 'dizziness', score: 3 }] })],
    })

    expect(result.summary).toBe('어지럼 점수가 이번 주 다소 낮아졌어요. 함께 볼까요?')
  })

  it('LLM이 경계를 위반하는 문구를 반환하면 안전한 대체 문구로 교체한다', async () => {
    const create = vi.fn().mockResolvedValue({
      choices: [{ message: { content: '소음 때문에 어지럼이 심해진 것으로 보이며, 전정재활운동을 하세요.' } }],
    })
    const openai = { chat: { completions: { create } } } as any
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const result = await runSummaryAssistant(openai, {
      entries: [makeEntry({ symptoms: [{ symptom: 'dizziness', score: 5 }] })],
    })

    expect(result.summary).toBe(BOUNDARY_SAFE_FALLBACK_SUMMARY)
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('entries는 있지만 점수가 전부 null이면 LLM을 호출하지 않고 안내 문구를 반환한다', async () => {
    const create = vi.fn()
    const openai = { chat: { completions: { create } } } as any

    const result = await runSummaryAssistant(openai, {
      entries: [makeEntry({ symptoms: [{ symptom: 'dizziness', score: null }], affects: [{ affect: 'anxiety', score: null }] })],
    })

    expect(create).not.toHaveBeenCalled()
    expect(result.summary).toContain('점수가 없어요')
  })
})
