'use client'

import { useState, useEffect } from 'react'

const T = {
  bg: '#F3F6F1',
  surface: '#FBFCFA',
  card: 'rgba(255,255,255,0.82)',
  body: '#26312A',
  sub: '#5F6D64',
  dim: '#8D9A91',
  primary: '#5C7A5E',
  border: '#e5ebe5',
  warn: '#C58F5B',
  font: "Pretendard, -apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
}

const STRENGTH_COLOR: Record<string, string> = {
  '강': '#3F5F46',
  '중': '#5C7A5E',
  '약': '#C58F5B',
  '출처 미확인': '#8D9A91',
}

type Draft = {
  source_summary: string
  strength: string
  application_context: string
  safety_note: string
}

type Source = {
  doc_title: string
  page_num: number
  similarity: number
  excerpt: string
}

type TopSource = {
  title: string
  page: number
  file: string
  similarity: number
} | null

type RegistryEvidence = {
  id: number
  claim: string
  source: string
  strength: string
  safety: string
  safetyNote: string
}

type ClaimResult = {
  claim: string
  draft: Draft
  registry_numbers: string[]
  registry_evidence: RegistryEvidence[]
  registry_guidance: string[]
  sources: Source[]
  top_source: TopSource
}

type SavedClaim = {
  id: string
  claim: string
  source_title: string | null
  source_page: number | null
  strength: string
  application_context: string | null
  safety_note: string | null
  registry_numbers?: string[]
  registry_evidence?: RegistryEvidence[]
  created_at: string
}

export default function ClaimPage() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<ClaimResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [registry, setRegistry] = useState<SavedClaim[]>([])
  const [showRegistry, setShowRegistry] = useState(false)

  useEffect(() => { fetchRegistry() }, [])

  async function fetchRegistry() {
    const res = await fetch('/api/study/claim')
    if (res.ok) setRegistry((await res.json()).claims ?? [])
  }

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return
    setLoading(true)
    setResult(null)
    setSaved(false)

    const res = await fetch('/api/study/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claim: input.trim() }),
    })
    const data = await res.json()
    setResult(res.ok ? data : null)
    setLoading(false)
  }

  async function handleSave() {
    if (!result || saving) return
    setSaving(true)
    const res = await fetch('/api/study/claim/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    })
    if (res.ok) {
      setSaved(true)
      fetchRegistry()
    }
    setSaving(false)
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px', fontFamily: T.font }}>

      {/* 입력 폼 */}
      <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>주장 문장 입력</div>
        <div style={{ fontSize: 13, color: T.dim, marginBottom: 14 }}>
          논문 corpus에서 근거를 검색하고 5필드 초안을 생성합니다. 저장은 확인 후 직접 합니다.
        </div>
        <form onSubmit={handleAnalyze} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder='예: "이명 강도와 수면의 질은 관련이 있다"'
            rows={2}
            style={{
              flex: 1,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: '10px 14px',
              fontSize: 14,
              background: T.surface,
              color: T.body,
              outline: 'none',
              resize: 'none',
              fontFamily: T.font,
              lineHeight: 1.5,
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              background: T.primary,
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '0 20px',
              height: 44,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              flexShrink: 0,
              opacity: (loading || !input.trim()) ? 0.4 : 1,
              fontFamily: T.font,
            }}
          >
            {loading ? '분석 중…' : '근거 검색'}
          </button>
        </form>
      </div>

      {/* 결과 초안 */}
      {result && (
        <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>5필드 초안</div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <tbody>
              {[
                { label: '주장', value: result.claim },
                {
                  label: '근거#',
                  value: result.registry_numbers.length > 0
                    ? result.registry_numbers.join(', ')
                    : '매핑 필요',
                },
                { label: '출처', value: result.draft.source_summary },
                {
                  label: '근거강도',
                  value: (
                    <span style={{
                      background: STRENGTH_COLOR[result.draft.strength] + '22',
                      color: STRENGTH_COLOR[result.draft.strength],
                      border: `1px solid ${STRENGTH_COLOR[result.draft.strength]}44`,
                      borderRadius: 6,
                      padding: '2px 10px',
                      fontWeight: 600,
                      fontSize: 13,
                    }}>
                      {result.draft.strength}
                    </span>
                  ),
                },
                { label: '적용위치', value: result.draft.application_context || '—' },
                { label: '안전도', value: result.draft.safety_note || '—' },
              ].map(row => (
                <tr key={row.label} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '10px 12px 10px 0', color: T.dim, fontWeight: 500, width: 80, verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                    {row.label}
                  </td>
                  <td style={{ padding: '10px 0', lineHeight: 1.6, color: T.body }}>
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {result.registry_evidence.length > 0 && (
            <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
              {result.registry_evidence.map(ref => (
                <div key={ref.id} style={{ background: T.bg, borderRadius: 8, padding: '9px 12px', fontSize: 12, color: T.sub, lineHeight: 1.5 }}>
                  <strong style={{ color: T.body }}>#{ref.id}</strong> {ref.source} · 근거강도 {ref.strength} · 안전도 {ref.safety}
                  <div>{ref.claim}</div>
                </div>
              ))}
            </div>
          )}

          {result.registry_guidance.length > 0 && (
            <div style={{ marginTop: 12, color: T.warn, fontSize: 12, lineHeight: 1.6 }}>
              {result.registry_guidance.map(item => <div key={item}>{item}</div>)}
            </div>
          )}

          {/* 검색된 청크 */}
          {result.sources.length > 0 && (
            <details style={{ marginTop: 16 }}>
              <summary style={{ fontSize: 13, color: T.sub, cursor: 'pointer', userSelect: 'none' }}>
                검색된 청크 ({result.sources.length}개) ▾
              </summary>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.sources.map((s, i) => (
                  <div key={i} style={{ background: T.bg, borderRadius: 8, padding: '10px 12px', fontSize: 13 }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>
                      {s.doc_title} · p.{s.page_num}
                      <span style={{ marginLeft: 8, color: T.dim, fontWeight: 400 }}>유사도 {s.similarity}%</span>
                    </div>
                    <div style={{ color: T.sub, lineHeight: 1.5 }}>{s.excerpt}</div>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* 저장 */}
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              style={{
                background: saved ? '#EEF4EE' : T.primary,
                color: saved ? T.primary : '#fff',
                border: saved ? `1px solid ${T.border}` : 'none',
                borderRadius: 10,
                padding: '8px 20px',
                fontSize: 14,
                fontWeight: 500,
                cursor: (saving || saved) ? 'default' : 'pointer',
                opacity: saving ? 0.5 : 1,
                fontFamily: T.font,
              }}
            >
              {saved ? '✓ 레지스트리에 저장됨' : saving ? '저장 중…' : '레지스트리에 저장'}
            </button>
            <span style={{ fontSize: 12, color: T.dim }}>
              자동 저장 없음 — 검토 후 직접 저장하세요
            </span>
          </div>
        </div>
      )}

      {/* 레지스트리 목록 */}
      <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, padding: 24 }}>
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
          onClick={() => setShowRegistry(v => !v)}
        >
          <span style={{ fontWeight: 600, fontSize: 15 }}>근거태깅 레지스트리 ({registry.length})</span>
          <span style={{ fontSize: 12, color: T.dim }}>{showRegistry ? '▲ 접기' : '▼ 펼치기'}</span>
        </div>

        {showRegistry && (
          <div style={{ marginTop: 16 }}>
            {registry.length === 0 ? (
              <p style={{ fontSize: 13, color: T.dim, textAlign: 'center', padding: '20px 0' }}>
                저장된 주장이 없습니다
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {registry.map(c => (
                  <div key={c.id} style={{ background: T.bg, borderRadius: 10, padding: '12px 14px', fontSize: 13 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{
                        background: STRENGTH_COLOR[c.strength] + '22',
                        color: STRENGTH_COLOR[c.strength],
                        border: `1px solid ${STRENGTH_COLOR[c.strength]}44`,
                        borderRadius: 4,
                        padding: '1px 7px',
                        fontWeight: 600,
                        fontSize: 11,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        marginTop: 1,
                      }}>{c.strength}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, lineHeight: 1.4, marginBottom: 4 }}>{c.claim}</div>
                        {c.registry_numbers && c.registry_numbers.length > 0 && (
                          <div style={{ color: T.primary, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                            근거 {c.registry_numbers.join(', ')}
                          </div>
                        )}
                        {c.source_title && (
                          <div style={{ color: T.sub }}>
                            {c.source_title} {c.source_page ? `p.${c.source_page}` : ''}
                          </div>
                        )}
                        {c.safety_note && (
                          <div style={{ color: T.warn, marginTop: 3, fontSize: 12 }}>⚠️ {c.safety_note}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
