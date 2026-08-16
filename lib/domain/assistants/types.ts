/**
 * CareFlow AI Assistant 구조 — 공통 타입
 *
 * 근거 문서: docs/ai-flow.md §2~3
 *   Health Record → AI Orchestrator → Summary → Timeline → Context → Evidence → Structured Record
 *
 * 경계 (SPEC §0, 반드시 준수):
 *   - 진단·중증도 판정·예후 예측·치료/재활 처방을 하지 않는다.
 *   - 상관관계를 인과관계처럼 표현하지 않는다.
 *   - 사용자에게 보이는 문구는 단정이 아닌 질문형("고려해보세요 / 함께 볼까요")을 쓴다.
 *   - 어떤 Assistant도 위기 신호 감지·연계를 대신하지 않는다 (lib/domain/nursingLogic.ts가 담당).
 */

import type { Band, MetricKey } from '../socialReturnIndicators'

// ────────────────────────────────────────────────────
// 공통: 하루 단위 건강 기록 (Assistant 입력 공통 단위)
// ────────────────────────────────────────────────────
export type TimeBucket = 'morning' | 'afternoon' | 'evening' | 'before_sleep' | 'attack'

export type HealthRecordSymptom = {
  symptom: string // 'dizziness' | 'gait' | 'tinnitus' | 'headache' | 'floaters' | 'other'
  score: number | null // 0-10, 사용자 자기보고
}

export type HealthRecordAffect = {
  affect: string // 'anxiety' | 'tension' | ...
  score: number | null // 0-10
}

export type HealthRecordContextTags = {
  noise: boolean
  weather_change: boolean
  crowded: boolean
}

export type HealthRecordEntry = {
  dailyLogId: string
  date: string // YYYY-MM-DD
  bucket: TimeBucket
  symptoms: HealthRecordSymptom[]
  affects: HealthRecordAffect[]
  contextTags: HealthRecordContextTags
  understood: boolean | null // 관계 축: 오늘 이해받았는가
  note?: string | null // 자유 메모 (주간 meaning_notes에서 연결)
}

// ─────────────────────────────────────────────────────
// Record Summary Assistant
// 목적: 사용자가 작성한 건강 기록을 읽기 쉽고 관리하기 쉬운 형태로 정리
// ─────────────────────────────────────────────────────
export type SummaryAssistantInput = {
  entries: HealthRecordEntry[]
  weeklyNotes?: string[] // meaning_notes.note 모음 (선택)
}

export type SummaryKeySymptom = {
  symptom: string
  count: number
  avgScore: number | null
}

export type SummaryAssistantOutput = {
  summary: string // 자연어 요약 (질문형/관찰형)
  keySymptoms: SummaryKeySymptom[]
  keyNotes: string[] // 반복 등장한 메모 핵심 문구
  structuredRecord: HealthRecordEntry[] // 형식이 통일된 원본 정리본
}

// ─────────────────────────────────────────────────────
// Timeline Assistant
// 목적: 건강 기록을 시간의 흐름에 따라 정리해 장기 변화를 확인하도록 지원
// ─────────────────────────────────────────────────────
export type TimelineGranularity = 'day' | 'week' | 'month'

export type TimelinePeriodPoint = {
  period: string // day: YYYY-MM-DD, week: YYYY-Www, month: YYYY-MM
  entryCount: number
  metrics: Partial<Record<MetricKey, number | null>>
  bands: Partial<Record<MetricKey, Band>>
}

export type RecurringPattern = {
  metric: MetricKey
  description: string // 관찰형 문구, 원인 분석·진단 표현 금지
  periodsObserved: number
}

export type TimelineAssistantInput = {
  entries: HealthRecordEntry[]
  granularity?: TimelineGranularity // 기본 'week'
}

export type TimelineAssistantOutput = {
  timeline: TimelinePeriodPoint[]
  patterns: RecurringPattern[]
}

// ─────────────────────────────────────────────────────
// Context Assistant
// 목적: 현재 기록과 이전 기록을 이해하도록 지원
// 원칙: 의료적 해석이나 원인 분석은 수행하지 않는다.
// ─────────────────────────────────────────────────────
export type ContextMatch = {
  entry: HealthRecordEntry
  overlapScore: number // 0~1, 증상·맥락 태그·관계 겹침 비율 (원인 분석 아님)
  matchedOn: string[] // 예: ['symptom:dizziness', 'context:noise']
}

export type ContextAssistantInput = {
  current: HealthRecordEntry
  past: HealthRecordEntry[] // 검색 대상 과거 기록
  limit?: number // 기본 5
}

export type ContextAssistantOutput = {
  relatedEntries: ContextMatch[]
  message: string // 질문형 안내 문구
}

// ─────────────────────────────────────────────────────
// Evidence Assistant
// 목적: 관리자가 참고할 수 있는 의료 근거·학습 자료를 연결 (진단 도구 아님)
// 원칙: 의료 근거를 생성·해석하지 않으며, 검토된 자료를 연결하는 역할만 수행한다.
//
// 필드명은 snake_case를 쓴다 — match_study_chunks RPC/DB 컬럼, app/api/study/*의
// 기존 응답 규약(app/study/page.tsx가 소비하는 Source 타입 등)과 일치시키기 위함이다.
// ─────────────────────────────────────────────────────
export type EvidenceAssistantInput = {
  keyword: string // 검색 키워드/질문
  healthContext?: string // 사용자 건강 기록 요약 맥락 (선택, 검색 정확도 보조용)
}

export type EvidenceSource = {
  doc_title: string
  page_num: number | null
  similarity: number // 0~100
  excerpt: string
}

export type EvidenceAssistantOutput = {
  answer: string
  sources: EvidenceSource[]
}
