'use client'

import { useState } from 'react'
import type {
  ContextAssistantOutput,
  EvidenceAssistantOutput,
  TimelineAssistantOutput,
  TimelineGranularity,
} from '@/lib/domain/assistants/types'

// AX Hub — 4개 AI Assistant(docs/ai-flow.md §3)를 한 화면에서 확인·실행하는 관리자 전용 허브.
// 우선순위(careflow-assistants-hub 합의): Timeline/Context 검증 > Evidence 진행 > Summary 보류.
// 이 화면은 기존 /api/assistants/* 라우트를 그대로 소비하며, 별도 로직을 재구현하지 않는다.

const T = {
  bg: '#F3F6F1',
  surface: '#FBFCFA',
  card: 'rgba(255,255,255,0.82)',
  body: '#26312A',
  sub: '#5F6D64',
  dim: '#8D9A91',
  primary: '#5C7A5E',
  warn: '#C58F5B',
  err: '#b94a48',
  border: '#e5ebe5',
  font: "Pretendard, -apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
}

type AssistantId = 'summary' | 'timeline' | 'context' | 'evidence'

type Status = { label: string; color: string }

const STATUS: Record<'priority' | 'active' | 'hold', Status> = {
  priority: { label: '검증 우선', color: T.primary },
  active:   { label: '진행 중',   color: '#4F7F9B' },
  hold:     { label: '보류',      color: T.dim },
}

const ASSISTANTS: {
  id: AssistantId
  name: string
  purpose: string
  engine: string
  route: string
  status: Status
}[] = [
  {
    id: 'timeline',
    name: 'Timeline',
    purpose: '기록을 일·주·월 단위로 정리해 개인 기준선 대비 흐름(band)을 보여줍니다.',
    engine: '순수 함수 · LLM 미사용',
    route: 'GET /api/assistants/timeline',
    status: STATUS.priority,
  },
  {
    id: 'context',
    name: 'Context',
    purpose: '오늘 기록과 겹치는 과거 기록을 연결합니다. 원인 분석은 하지 않습니다.',
    engine: '규칙 기반 · LLM 미사용',
    route: 'POST /api/assistants/context',
    status: STATUS.priority,
  },
  {
    id: 'evidence',
    name: 'Evidence',
    purpose: '검토된 학습 자료에서 관련 근거를 찾아 출처와 함께 연결합니다.',
    engine: 'OpenAI + embedding',
    route: 'POST /api/assistants/evidence',
    status: STATUS.active,
  },
  {
    id: 'summary',
    name: 'Record Summary',
    purpose: '기록과 메모를 읽기 쉬운 형태로 정리합니다. 실사용 메모가 쌓일 때까지 보류합니다.',
    engine: 'OpenAI',
    route: 'POST /api/assistants/summary',
    status: STATUS.hold,
  },
]

const BAND_COLORS: Record<string, string> = {
  low: '#4F7F9B',
  normal: T.primary,
  high: T.warn,
}

function kstToday() {
  return new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10)
}

async function readJson<R>(res: Response): Promise<R> {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `요청 실패 (${res.status})`)
  return data as R
}

export default function AxHubPage() {
  const [selected, setSelected] = useState<AssistantId>('timeline')
  const current = ASSISTANTS.find(a => a.id === selected)!

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>AX Hub</h1>
        <p style={{ fontSize: 13, color: T.sub, margin: '4px 0 0', lineHeight: 1.6 }}>
          CareFlow AI Assistant 네 가지를 한 곳에서 살펴보고 실제 내 기록으로 실행해볼 수 있어요.
          결과는 기록 정리용이며 진단·처방이 아니에요.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12 }}>
        {ASSISTANTS.map(a => {
          const active = a.id === selected
          return (
            <button
              key={a.id}
              onClick={() => setSelected(a.id)}
              style={{
                textAlign: 'left',
                background: active ? '#EEF4EE' : T.card,
                border: `1px solid ${active ? T.primary : T.border}`,
                borderRadius: 14,
                padding: 16,
                cursor: 'pointer',
                fontFamily: T.font,
                color: T.body,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{a.name}</span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: a.status.color,
                  border: `1px solid ${a.status.color}`,
                  borderRadius: 999,
                  padding: '1px 8px',
                  whiteSpace: 'nowrap',
                }}>
                  {a.status.label}
                </span>
              </div>
              <span style={{ fontSize: 12, color: T.sub, lineHeight: 1.55 }}>{a.purpose}</span>
              <span style={{ fontSize: 11, color: T.dim }}>{a.engine}</span>
              <code style={{ fontSize: 11, color: T.dim }}>{a.route}</code>
            </button>
          )
        })}
      </div>

      <section style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 18 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>{current.name} 실행</div>
        {selected === 'timeline' && <TimelinePanel />}
        {selected === 'context' && <ContextPanel />}
        {selected === 'evidence' && <EvidencePanel />}
        {selected === 'summary' && (
          <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.6, margin: 0 }}>
            Record Summary는 실사용 메모 데이터가 충분히 쌓일 때까지 보류 중이에요.
            라우트(<code>/api/assistants/summary</code>)는 그대로 남아 있고, 이 허브에서는 실행하지 않아요.
          </p>
        )}
      </section>

      <div style={{
        background: '#FEF9F0',
        border: '1px solid #f0d9b5',
        borderRadius: 12,
        padding: '12px 14px',
        fontSize: 12,
        color: '#8D6A3A',
        lineHeight: 1.6,
      }}>
        ⚠️ 관리자 전용 내부 도구입니다. Assistant 결과는 기록을 정리·연결할 뿐 의료 진단·처방·예후 예측이 아닙니다.
        걱정되는 변화가 있다면 의료진과 함께 살펴보는 것을 고려해보세요.
      </div>
    </div>
  )
}

// ── 공통 UI ──

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: T.sub }}>
      {label}
      {children}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  border: `1px solid ${T.border}`,
  borderRadius: 8,
  padding: '7px 10px',
  fontSize: 13,
  fontFamily: T.font,
  color: T.body,
  background: T.surface,
}

function RunButton({ loading, disabled, onClick }: { loading: boolean; disabled?: boolean; onClick: () => void }) {
  const off = loading || disabled
  return (
    <button
      onClick={onClick}
      disabled={off}
      style={{
        alignSelf: 'flex-end',
        background: off ? T.dim : T.primary,
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        padding: '8px 16px',
        fontSize: 13,
        fontFamily: T.font,
        cursor: off ? 'default' : 'pointer',
      }}
    >
      {loading ? '실행 중…' : '실행'}
    </button>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div style={{
      fontSize: 12,
      color: T.err,
      background: '#fdf0f0',
      border: '1px solid #f5c6cb',
      borderRadius: 8,
      padding: '8px 10px',
      marginTop: 12,
    }}>
      {message}
    </div>
  )
}

function useRunner<R>() {
  const [result, setResult] = useState<R | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function run(fn: () => Promise<R>) {
    setLoading(true)
    setError(null)
    try {
      setResult(await fn())
    } catch (err) {
      setResult(null)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return { result, error, loading, run }
}

// ── Timeline ──

type TimelineResponse = TimelineAssistantOutput & { from: string; to: string; granularity: TimelineGranularity }

function TimelinePanel() {
  const today = kstToday()
  const [from, setFrom] = useState(() => {
    const d = new Date(`${today}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() - 90)
    return d.toISOString().slice(0, 10)
  })
  const [to, setTo] = useState(today)
  const [granularity, setGranularity] = useState<TimelineGranularity>('week')
  const { result, error, loading, run } = useRunner<TimelineResponse>()

  const metricKeys = result
    ? Array.from(new Set(result.timeline.flatMap(p => Object.keys(p.bands))))
    : []

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Field label="시작일"><input type="date" value={from} onChange={e => setFrom(e.target.value)} style={inputStyle} /></Field>
        <Field label="종료일"><input type="date" value={to} onChange={e => setTo(e.target.value)} style={inputStyle} /></Field>
        <Field label="단위">
          <select value={granularity} onChange={e => setGranularity(e.target.value as TimelineGranularity)} style={inputStyle}>
            <option value="day">일</option>
            <option value="week">주</option>
            <option value="month">월</option>
          </select>
        </Field>
        <RunButton
          loading={loading}
          onClick={() => run(() =>
            fetch(`/api/assistants/timeline?${new URLSearchParams({ from, to, granularity })}`).then(r => readJson<TimelineResponse>(r))
          )}
        />
      </div>

      {error && <ErrorBox message={error} />}

      {result && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {result.timeline.length === 0 ? (
            <p style={{ fontSize: 13, color: T.dim, margin: 0 }}>이 기간에는 기록이 없어요. 기간을 넓혀볼까요?</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
                <thead>
                  <tr style={{ color: T.sub, textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px' }}>기간</th>
                    <th style={{ padding: '6px 8px' }}>기록 수</th>
                    {metricKeys.map(k => <th key={k} style={{ padding: '6px 8px' }}>{k}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {result.timeline.map(p => (
                    <tr key={p.period} style={{ borderTop: `1px solid ${T.border}` }}>
                      <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>{p.period}</td>
                      <td style={{ padding: '6px 8px' }}>{p.entryCount}</td>
                      {metricKeys.map(k => {
                        const band = p.bands[k as keyof typeof p.bands]
                        const value = p.metrics[k as keyof typeof p.metrics]
                        return (
                          <td key={k} style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>
                            {band ? (
                              <span style={{ color: BAND_COLORS[band] ?? T.sub, fontWeight: 600 }}>
                                {band}
                                {typeof value === 'number' && <span style={{ color: T.dim, fontWeight: 400 }}> · {value.toFixed(1)}</span>}
                              </span>
                            ) : <span style={{ color: T.dim }}>—</span>}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.patterns.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>반복해서 보이는 흐름</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: T.sub, lineHeight: 1.7 }}>
                {result.patterns.map((pt, i) => (
                  <li key={i}>{pt.description} <span style={{ color: T.dim }}>({pt.periodsObserved}구간)</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Context ──

function ContextPanel() {
  const [date, setDate] = useState(kstToday())
  const [lookbackDays, setLookbackDays] = useState(90)
  const { result, error, loading, run } = useRunner<ContextAssistantOutput>()

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Field label="기준 날짜"><input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} /></Field>
        <Field label="돌아볼 기간(일)">
          <input
            type="number"
            min={7}
            max={365}
            value={lookbackDays}
            onChange={e => setLookbackDays(Number(e.target.value) || 90)}
            style={{ ...inputStyle, width: 90 }}
          />
        </Field>
        <RunButton
          loading={loading}
          onClick={() => run(() =>
            fetch('/api/assistants/context', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ date, lookbackDays }),
            }).then(r => readJson<ContextAssistantOutput>(r))
          )}
        />
      </div>

      {error && <ErrorBox message={error} />}

      {result && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 13, color: T.body, margin: 0, lineHeight: 1.6 }}>{result.message}</p>
          {result.relatedEntries.map(m => (
            <div key={m.entry.dailyLogId} style={{ background: T.bg, borderRadius: 10, padding: '10px 12px', fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontWeight: 600 }}>{m.entry.date} · {m.entry.bucket}</span>
                <span style={{ color: T.dim }}>겹침 {Math.round(m.overlapScore * 100)}%</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                {m.matchedOn.map(tag => (
                  <span key={tag} style={{
                    background: '#EEF4EE',
                    color: T.primary,
                    borderRadius: 999,
                    padding: '1px 8px',
                    fontSize: 11,
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Evidence ──

function EvidencePanel() {
  const [keyword, setKeyword] = useState('')
  const { result, error, loading, run } = useRunner<EvidenceAssistantOutput>()

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 260px' }}>
          <Field label="키워드 / 질문">
            <input
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="예: 내림프수종, 전정 재활 교육 자료"
              style={inputStyle}
            />
          </Field>
        </div>
        <RunButton
          loading={loading}
          disabled={!keyword.trim()}
          onClick={() => run(() =>
            fetch('/api/assistants/evidence', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ keyword: keyword.trim() }),
            }).then(r => readJson<EvidenceAssistantOutput>(r))
          )}
        />
      </div>

      {error && <ErrorBox message={error} />}

      {result && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 13, margin: 0, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{result.answer}</p>
          {result.sources.map((s, i) => (
            <div key={i} style={{ background: T.bg, borderRadius: 10, padding: '10px 12px', fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontWeight: 600 }}>{s.doc_title}{s.page_num != null && ` · p.${s.page_num}`}</span>
                <span style={{ color: T.dim }}>{s.similarity}%</span>
              </div>
              <p style={{ margin: '6px 0 0', color: T.sub, lineHeight: 1.55 }}>{s.excerpt}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
