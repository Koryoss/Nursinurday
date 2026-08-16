/**
 * Record Summary Assistant (docs/ai-flow.md §3)
 *
 * 목적: 사용자가 작성한 건강 기록을 읽기 쉽고 관리하기 쉬운 형태로 정리한다.
 * 책임: 긴 기록 요약, 핵심 증상 및 메모 추출, 반복 내용 정리, 기록 형식 통일.
 * 원칙(SPEC §0): 진단·중증도 판정·예후 예측·치료 추천 금지. 문구는 관찰/질문형으로만.
 *
 * 증상 집계·반복 메모 추출은 순수 JS로 처리하고, 자연어 요약 문장만 OpenAI에 위임한다.
 * (숫자 집계를 LLM에 맡기면 재현 불가능해지므로 분리한다.)
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

function buildSummaryUserPrompt(entries: HealthRecordEntry[], keySymptoms: SummaryKeySymptom[], weeklyNotes: string[]): string {
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
      return `- ${entry.date} (${entry.bucket}): 증상[${symptomText}] 감정[${affectText}] 이해받음:${entry.understood ?? '미기록'}`
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

function aggregateKeySymptoms(entries: HealthRecordEntry[]): SummaryKeySymptom[] {
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

function extractRepeatedNotes(weeklyNotes: string[]): string[] {
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

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SUMMARY_ASSISTANT_SYSTEM_PROMPT },
      { role: 'user', content: buildSummaryUserPrompt(input.entries, keySymptoms, input.weeklyNotes ?? []) },
    ],
    temperature: 0.3,
    max_tokens: 500,
  })

  return {
    summary: completion.choices[0]?.message?.content ?? '',
    keySymptoms,
    keyNotes,
    structuredRecord,
  }
}
