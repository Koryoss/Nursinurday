/**
 * Context Assistant (docs/ai-flow.md §3)
 *
 * 목적: 현재 기록과 이전 기록을 연결해 사용자가 자신의 건강 맥락을 이해하도록 지원한다.
 * 책임: 유사한 과거 기록 연결, 관련 생활 습관 기록 연결, 이전 메모 연결, 동일·유사 증상 연결.
 * 원칙: 의료적 해석이나 원인 분석은 수행하지 않는다 — 겹침 점수는 "연관 가능성"이 아니라
 *       단순 매칭 비율이며, 상관관계를 인과관계로 표현하지 않는다 (SPEC §0).
 *
 * 규칙 기반(rule-based)으로 구현한다: 증상 종류 일치, 정서(affect) 종류 일치, 맥락 태그
 * (소음/기온차/붐빔) 겹침, 기록 시간대(bucket) 일치, 관계(이해받음) 상태 일치를 가중합산해
 * 겹침 점수를 계산한다. LLM을 사용하지 않으므로 예측 불가능한 해석이 섞일 위험이 없다.
 *
 * 가중치 배분(합 1.0): 증상 0.35 > 정서 0.15, 맥락태그 0.10×3(=0.30), 시간대 0.10,
 * 관계 0.10. 증상을 가장 크게 두는 이유는 "비슷한 몸 상태였던 날"을 찾는 것이 이 Assistant의
 * 핵심 목적이기 때문이고, 나머지는 보조 신호로 낮게 둔다.
 */

import type { ContextAssistantInput, ContextAssistantOutput, ContextMatch, HealthRecordEntry } from './types'

const SYMPTOM_WEIGHT = 0.35
const AFFECT_WEIGHT = 0.15
const CONTEXT_TAG_WEIGHT = 0.1 // 태그당, 최대 3개
const BUCKET_WEIGHT = 0.1
const UNDERSTOOD_WEIGHT = 0.1

/** score > 0인 항목만 모아 이름 집합으로 만든다 (증상/정서 공용). */
function positiveScoreSet<T extends { score: number | null }>(items: T[], nameOf: (item: T) => string): Set<string> {
  return new Set(items.filter(item => typeof item.score === 'number' && (item.score ?? 0) > 0).map(nameOf))
}

function overlapContribution(currentSet: Set<string>, candidateSet: Set<string>, weight: number, label: string, matchedOn: string[]): number {
  let contribution = 0
  currentSet.forEach(name => {
    if (candidateSet.has(name)) {
      contribution += weight / Math.max(currentSet.size, 1)
      matchedOn.push(`${label}:${name}`)
    }
  })
  return contribution
}

export function scoreOverlap(current: HealthRecordEntry, candidate: HealthRecordEntry): { score: number; matchedOn: string[] } {
  const matchedOn: string[] = []
  let score = 0

  const currentSymptoms = positiveScoreSet(current.symptoms, s => s.symptom)
  const candidateSymptoms = positiveScoreSet(candidate.symptoms, s => s.symptom)
  score += overlapContribution(currentSymptoms, candidateSymptoms, SYMPTOM_WEIGHT, 'symptom', matchedOn)

  const currentAffects = positiveScoreSet(current.affects, a => a.affect)
  const candidateAffects = positiveScoreSet(candidate.affects, a => a.affect)
  score += overlapContribution(currentAffects, candidateAffects, AFFECT_WEIGHT, 'affect', matchedOn)

  ;(['noise', 'weather_change', 'crowded'] as const).forEach(tag => {
    if (current.contextTags[tag] && candidate.contextTags[tag]) {
      score += CONTEXT_TAG_WEIGHT
      matchedOn.push(`context:${tag}`)
    }
  })

  if (current.bucket === candidate.bucket) {
    score += BUCKET_WEIGHT
    matchedOn.push(`bucket:${current.bucket}`)
  }

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
