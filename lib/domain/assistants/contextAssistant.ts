/**
 * Context Assistant (docs/ai-flow.md §3)
 *
 * 목적: 현재 기록과 이전 기록을 연결해 사용자가 자신의 건강 맥락을 이해하도록 지원한다.
 * 책임: 유사한 과거 기록 연결, 관련 생활 습관 기록 연결, 이전 메모 연결, 동일·유사 증상 연결.
 * 원칙: 의료적 해석이나 원인 분석은 수행하지 않는다 — 겹침 점수는 "연관 가능성"이 아니라
 *       단순 매칭 비율이며, 상관관계를 인과관계로 표현하지 않는다 (SPEC §0).
 *
 * 규칙 기반(rule-based)으로 구현한다: 증상 종류 일치, 맥락 태그(소음/기온차/붐빔) 겹침,
 * 관계(이해받음) 상태 일치를 가중합산해 겹침 점수를 계산한다. LLM을 사용하지 않으므로
 * 예측 불가능한 해석이 섞일 위험이 없다.
 */

import type { ContextAssistantInput, ContextAssistantOutput, ContextMatch, HealthRecordEntry } from './types'

const SYMPTOM_WEIGHT = 0.5
const CONTEXT_TAG_WEIGHT = 0.15 // 태그당, 최대 3개
const UNDERSTOOD_WEIGHT = 0.05

function symptomSet(entry: HealthRecordEntry): Set<string> {
  return new Set(entry.symptoms.filter(s => typeof s.score === 'number' && (s.score ?? 0) > 0).map(s => s.symptom))
}

function scoreOverlap(current: HealthRecordEntry, candidate: HealthRecordEntry): { score: number; matchedOn: string[] } {
  const matchedOn: string[] = []
  let score = 0

  const currentSymptoms = symptomSet(current)
  const candidateSymptoms = symptomSet(candidate)
  currentSymptoms.forEach(symptom => {
    if (candidateSymptoms.has(symptom)) {
      score += SYMPTOM_WEIGHT / Math.max(currentSymptoms.size, 1)
      matchedOn.push(`symptom:${symptom}`)
    }
  })

  ;(['noise', 'weather_change', 'crowded'] as const).forEach(tag => {
    if (current.contextTags[tag] && candidate.contextTags[tag]) {
      score += CONTEXT_TAG_WEIGHT
      matchedOn.push(`context:${tag}`)
    }
  })

  if (current.understood !== null && current.understood === candidate.understood) {
    score += UNDERSTOOD_WEIGHT
    matchedOn.push('social:understood')
  }

  return { score: Math.min(1, Math.round(score * 100) / 100), matchedOn }
}

export function runContextAssistant(input: ContextAssistantInput): ContextAssistantOutput {
  const limit = input.limit ?? 5

  const scored: ContextMatch[] = input.past
    .filter(entry => entry.dailyLogId !== input.current.dailyLogId)
    .map(entry => {
      const { score, matchedOn } = scoreOverlap(input.current, entry)
      return { entry, overlapScore: score, matchedOn }
    })
    .filter(match => match.overlapScore > 0)
    .sort((a, b) => (b.overlapScore - a.overlapScore) || (a.entry.date < b.entry.date ? 1 : -1))
    .slice(0, limit)

  const message = scored.length > 0
    ? `비슷한 조건에서 남긴 과거 기록 ${scored.length}건을 찾았어요. 함께 비교해볼까요?`
    : '아직 비슷한 조건의 과거 기록을 찾지 못했어요.'

  return { relatedEntries: scored, message }
}
