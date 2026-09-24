/**
 * Record Summary Assistant (docs/ai-flow.md §3)
 *
 * 목적: 사용자가 작성한 건강 기록을 읽기 쉽고 관리하기 쉬운 형태로 정리한다.
 * 책임: 긴 기록 요약, 핵심 증상 및 메모 추출, 반복 내용 정리, 기록 형식 통일.
 * 원칙(SPEC §0): 진단·중증도 판정·예후 예측·치료 추천 금지. 문구는 관찰/질문형으로만.
 *
 * 증상 집계·반복 메모 추출은 순수 JS로 처리하고, 자연어 요약 문장만 OpenAI에 위임한다.
 * (숫자 집계를 LLM에 맡기면 재현 불가능해지므로 분리한다.)
 *
 * 경계 가드: 시스템 프롬프트만으로는 SPEC §0 위반(진단/중증도/예후/처방/인과 표현)을
 * 100% 막을 수 없으므로, findBoundaryViolation()으로 LLM 출력을 사후 검증하고
 * 위반 시 BOUNDARY_SAFE_FALLBACK_SUMMARY로 대체한다.
 */

import type OpenAI from 'openai'
import type { HealthRecordEntry, SummaryAssistantInput, SummaryAssistantOutput, SummaryKeySymptom } from './types'

export const SUMMARY_ASSISTANT_SYSTEM_PROMPT = `당신은 CareFlow의 Record Summary Assistant입니다.
사용자가 남긴 자기관찰 기록(증상 점수, 감정 점수, 메모)을 읽기 쉽게 정리하는 것이 유일한 역할입니다.

절대 규칙 (반드시 지킬 것):
1. 진단하지 않습니다. "~병입니다", "~장애입니다" 같은 표현을 쓰지 않습니다.
2. 중증도를 판정하거나 예후를 예측하지 않습니다.
3. 치료·재활을 처방하거나 권하지 않습니다.
4. 상관관계를 인과관계처럼 표현하지 않습니다 ("때문에", "원인은" 금지, "함께 나타났어요" 정도만 허용).
5. 제공된 기록에 없는 내용을 지어내지 않습니다.
6. 문장은 단정형이 아닌 관찰형·질문형으로 마무리합니다 ("~게 보여요", "함께 볼까요?").
7. 한국어로, 3~5문장 이내로 간결하게 답합니다.`

export function buildSummaryUserPrompt(entries: HealthRecordEntry[], keySymptoms: SummaryKeySymptom[], weeklyNotes: string[]): string {
  const entryLines = entries
    .map(entry => {
      const symptomText = entry.symptoms
        .filter(s => typeof s.score === 'number')
        .map(s => `${s.symptom} ${s.score}`)
        .join(', ') || '없음'
      const affectText = entry.affects
        .filter(a => typeof a.score === 'number')
        .map(a => `${a.affect} ${a.score}`)
        .join(', ') || '없음'
      const sourceText = entry.isDemo
        ? '제품 시연용 가상 기록'
        : entry.recordSource === 'historical_weekly_recall'
          ? `과거 주간 회고에서 옮긴 시간대별 대표값 ${entry.sourcePeriodStart ?? ''}~${entry.sourcePeriodEnd ?? ''}`
          : '앱에서 직접 남긴 기록'
      return `- ${entry.date} (${entry.bucket}, ${sourceText}): 증상[${symptomText}] 감정[${affectText}] 이해받음:${entry.understood ?? '미기록'}`
    })
    .join('\n')

  const symptomSummary = keySymptoms
    .map(s => `${s.symptom}: ${s.count}회, 평균 ${s.avgScore ?? '-'}`)
    .join(' / ') || '없음'

  const noteText = weeklyNotes.length > 0 ? weeklyNotes.join('\n') : '없음'

  return `다음 자기관찰 기록을 읽기 쉽게 요약해 주세요.

[기록 목록]
${entryLines || '기록 없음'}

[증상 집계]
${symptomSummary}

[사용자가 남긴 메모]
${noteText}`
}

export function aggregateKeySymptoms(entries: HealthRecordEntry[]): SummaryKeySymptom[] {
  const bySymptom = new Map<string, number[]>()
  entries.forEach(entry => {
    entry.symptoms.forEach(({ symptom, score }) => {
      if (typeof score !== 'number') return
      const list = bySymptom.get(symptom) ?? []
      list.push(score)
      bySymptom.set(symptom, list)
    })
  })

  return Array.from(bySymptom.entries())
    .map(([symptom, scores]) => ({
      symptom,
      count: scores.length,
      avgScore: scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null,
    }))
    .sort((a, b) => b.count - a.count)
}

export function extractRepeatedNotes(weeklyNotes: string[]): string[] {
  const seen = new Map<string, number>()
  weeklyNotes.forEach(note => {
    const trimmed = note.trim()
    if (!trimmed) return
    seen.set(trimmed, (seen.get(trimmed) ?? 0) + 1)
  })
  return Array.from(seen.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([note]) => note)
    .slice(0, 5)
}

// ─────────────────────────────────────────────────────
/** entries 중 하나라도 증상 또는 감정에 숫자 점수가 기록되어 있으면 true. 전부 null이면 false. */
export function hasScoredSignal(entries: HealthRecordEntry[]): boolean {
  return entries.some(
    entry =>
      entry.symptoms.some(s => typeof s.score === 'number') ||
      entry.affects.some(a => typeof a.score === 'number')
  )
}

// SPEC §0 경계 가드: LLM이 규칙을 어긴 문장을 만들어내는 경우를 잡아내는 안전망.
// 시스템 프롬프트만으로는 100% 보장되지 않으므로, 출력 사후 검증을 둔다.
// ─────────────────────────────────────────────────────
export type BoundaryViolationLabel = 'diagnosis' | 'severity' | 'prognosis' | 'prescription' | 'causal'

const BOUNDARY_VIOLATION_PATTERNS: { label: BoundaryViolationLabel; pattern: RegExp }[] = [
  // 진단: "~병입니다", "~장애로 보여요", "~증후군이에요" 등 병명 단정
  { label: 'diagnosis', pattern: /(병|질환|장애|증후군|질병)(입니다|이에요|예요|이네요|같아요|로\s?보여요|로\s?보입니다)/ },
  // 중증도 판정
  { label: 'severity', pattern: /(중증|경증|중등도|심각한\s?수준|위험한\s?수준|정상\s?범위)/ },
  // 예후 예측: 미래 상태 단정
  { label: 'prognosis', pattern: /(회복될|악화될|나아질|나빠질|호전될)\s?(것|가능성이\s?높|거예요|겁니다)/ },
  // 치료/재활 처방
  { label: 'prescription', pattern: /(처방합니다|복용하세요|약을\s?드세요|치료(를|가)\s?(받으세요|필요합니다)|재활을\s?(하세요|받으세요)|운동을\s?하세요)/ },
  // 인과 표현 (상관≠인과)
  { label: 'causal', pattern: /(때문에|원인은|로\s?인해|탓에)/ },
]

/** 텍스트가 SPEC §0 경계를 위반하는지 검사한다. 위반 시 첫 번째로 매치된 라벨을, 아니면 null을 반환한다. */
export function findBoundaryViolation(text: string): BoundaryViolationLabel | null {
  for (const { label, pattern } of BOUNDARY_VIOLATION_PATTERNS) {
    if (pattern.test(text)) return label
  }
  return null
}

export const BOUNDARY_SAFE_FALLBACK_SUMMARY =
  '최근 기록을 정리했어요. 아래 증상 집계와 메모를 함께 살펴볼까요?'

export async function runSummaryAssistant(
  openai: OpenAI,
  input: SummaryAssistantInput
): Promise<SummaryAssistantOutput> {
  const keySymptoms = aggregateKeySymptoms(input.entries)
  const keyNotes = extractRepeatedNotes(input.weeklyNotes ?? [])
  const structuredRecord = [...input.entries].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))

  if (input.entries.length === 0) {
    return {
      summary: '아직 요약할 기록이 없어요. 오늘의 몸·감정·관계 신호를 먼저 기록해볼까요?',
      keySymptoms,
      keyNotes,
      structuredRecord,
    }
  }

  if (!hasScoredSignal(input.entries)) {
    return {
      summary: '기록은 있지만 아직 점수가 없어요. 오늘 몸과 마음 상태를 숫자로 남겨볼까요?',
      keySymptoms,
      keyNotes,
      structuredRecord,
    }
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SUMMARY_ASSISTANT_SYSTEM_PROMPT },
      { role: 'user', content: buildSummaryUserPrompt(input.entries, keySymptoms, input.weeklyNotes ?? []) },
    ],
    temperature: 0.3,
    max_tokens: 500,
  })

  const rawSummary = completion.choices[0]?.message?.content ?? ''
  const violation = findBoundaryViolation(rawSummary)

  if (violation) {
    console.warn(`[summaryAssistant] boundary violation detected in LLM output (${violation}); falling back to safe summary.`)
  }

  return {
    summary: violation ? BOUNDARY_SAFE_FALLBACK_SUMMARY : rawSummary,
    keySymptoms,
    keyNotes,
    structuredRecord,
  }
}
