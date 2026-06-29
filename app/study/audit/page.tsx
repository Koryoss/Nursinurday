'use client'

import { useState } from 'react'

const T = {
  bg: '#F3F6F1',
  card: 'rgba(255,255,255,0.82)',
  body: '#26312A',
  sub: '#5F6D64',
  dim: '#8D9A91',
  primary: '#5C7A5E',
  border: '#e5ebe5',
  warn: '#C58F5B',
  err: '#b94a48',
  font: "Pretendard, -apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
}

type RegistryEvidence = {
  id: number
  claim: string
  source: string
  strength: string
  safety: string
  safetyNote: string
}

type CopyAuditFlag = {
  code: string
  message: string
}

type Finding = {
  file: string
  line: number
  col: number
  matched: string
  context: string
  ruleId: string
  label: string
  desc: string
  registry_numbers?: string[]
  registry_evidence?: RegistryEvidence[]
  unmapped_assertion?: boolean
}

type CoreCopyClaimAudit = {
  key: string
  phrase: string
  surface: string
  note: string
  registry_numbers: string[]
  registry_evidence: RegistryEvidence[]
  flags: CopyAuditFlag[]
}

type AuditResult = {
  scanned: number
  total: number
  violations: Finding[]
  rules: { id: string; label: string; count: number }[]
  core_copy_claims: CoreCopyClaimAudit[]
  core_copy_flagged: number
  run_at: string
}

const RULE_COLORS: Record<string, string> = {
  'DIAG-01':   '#9B4F4F',
  'PROG-01':   '#7A5C9B',
  'SEVE-01':   '#4F7F9B',
  'NORM-01':   '#9B7A4F',
  'PRESC-01':  '#4F9B6A',
  'CUTOFF-01': '#9B8A4F',
  'CAUSAL-01': '#7A4F9B',
  'ASSERT-01': '#B45E42',
}

export default function AuditPage() {
  const [result, setResult] = useState<AuditResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<string | null>(null)

  async function runAudit() {
    setLoading(true)
    setResult(null)
    setFilter(null)
    const res = await fetch('/api/study/audit')
    if (res.ok) setResult(await res.json())
    setLoading(false)
  }

  const shown = result
    ? (filter ? result.violations.filter(v => v.ruleId === filter) : result.violations)
    : []

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px', fontFamily: T.font }}>

      {/* 설명 + 실행 */}
      <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>경계 카피 린터</div>
        <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.6, marginBottom: 16 }}>
          <code style={{ background: T.bg, padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>app/**/*.tsx</code>의
          사용자 노출 문자열을 스캔해 SPEC §0 금지 패턴(진단·예후·중증도·정상/비정상·처방·임상 컷오프·인과 오표현)을 검출합니다.
          면책 문맥(<code style={{ background: T.bg, padding: '1px 4px', borderRadius: 4, fontSize: 11 }}>의료 자문이 아닙니다</code> 등)은 자동 제외.
          <strong style={{ color: T.body }}> 검출·보고만. 자동 수정 없음.</strong>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={runAudit}
            disabled={loading}
            style={{
              background: T.primary,
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '9px 22px',
              fontSize: 14,
              fontWeight: 500,
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.5 : 1,
              fontFamily: T.font,
            }}
          >
            {loading ? '스캔 중…' : '검사 실행'}
          </button>
          {result && (
            <span style={{ fontSize: 13, color: T.dim }}>
              {new Date(result.run_at).toLocaleString('ko-KR')} 기준 · {result.scanned}개 파일 스캔
            </span>
          )}
        </div>
      </div>

      {/* 요약 */}
      {result && (
        <>
          <div style={{
            background: result.total === 0 ? '#EEF4EE' : '#FEF9F0',
            border: `1px solid ${result.total === 0 ? T.border : '#f0d9b5'}`,
            borderRadius: 12,
            padding: '14px 20px',
            marginBottom: 20,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>{result.total === 0 ? '✓' : '⚠️'}</span>
            <div>
              <span style={{ fontWeight: 600, color: result.total === 0 ? T.primary : T.warn }}>
                {result.total === 0 ? '위반 후보 없음' : `위반 후보 ${result.total}건`}
              </span>
              {result.total > 0 && (
                <span style={{ color: T.sub, marginLeft: 8 }}>
                  — 각 항목을 검토해 실제 위반인지 판단하세요
                </span>
              )}
              <span style={{ color: T.sub, marginLeft: 8 }}>
                핵심 문구 {result.core_copy_claims.length}개 근거 매핑 · 제한 플래그 {result.core_copy_flagged}건
              </span>
            </div>
          </div>

          {/* 핵심 문구 근거 매핑 */}
          {result.core_copy_claims.length > 0 && (
            <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.border}`, padding: 18, marginBottom: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>핵심 문구 근거 매핑</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {result.core_copy_claims.map(item => (
                  <div key={item.key} style={{ background: T.bg, borderRadius: 8, padding: '10px 12px', fontSize: 12, lineHeight: 1.5 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
                      <strong style={{ color: T.body }}>{item.surface}</strong>
                      {item.registry_numbers.map(num => (
                        <span key={num} style={{ color: T.primary, fontWeight: 700 }}>{num}</span>
                      ))}
                      {item.flags.length > 0 && <span style={{ color: T.warn, fontWeight: 700 }}>제한 검토</span>}
                    </div>
                    <div style={{ color: T.body }}>{item.phrase}</div>
                    <div style={{ color: T.sub }}>{item.note}</div>
                    {item.flags.map(flag => (
                      <div key={`${item.key}-${flag.code}`} style={{ color: T.warn, marginTop: 3 }}>
                        {flag.code}: {flag.message}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 규칙별 필터 탭 */}
          {result.total > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              <button
                onClick={() => setFilter(null)}
                style={{
                  fontSize: 12,
                  padding: '4px 12px',
                  borderRadius: 999,
                  border: `1px solid ${!filter ? T.primary : T.border}`,
                  background: !filter ? '#EEF4EE' : 'transparent',
                  color: !filter ? T.primary : T.sub,
                  cursor: 'pointer',
                  fontFamily: T.font,
                }}
              >
                전체 ({result.total})
              </button>
              {result.rules.filter(r => r.count > 0).map(r => (
                <button
                  key={r.id}
                  onClick={() => setFilter(r.id)}
                  style={{
                    fontSize: 12,
                    padding: '4px 12px',
                    borderRadius: 999,
                    border: `1px solid ${filter === r.id ? RULE_COLORS[r.id] ?? T.primary : T.border}`,
                    background: filter === r.id ? (RULE_COLORS[r.id] ?? T.primary) + '18' : 'transparent',
                    color: filter === r.id ? RULE_COLORS[r.id] ?? T.primary : T.sub,
                    cursor: 'pointer',
                    fontFamily: T.font,
                  }}
                >
                  {r.label} ({r.count})
                </button>
              ))}
            </div>
          )}

          {/* 위반 목록 */}
          {shown.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {shown.map((v, i) => (
                <div key={i} style={{
                  background: T.card,
                  borderRadius: 12,
                  border: `1px solid ${T.border}`,
                  borderLeft: `4px solid ${RULE_COLORS[v.ruleId] ?? T.warn}`,
                  padding: '14px 18px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      background: (RULE_COLORS[v.ruleId] ?? T.warn) + '18',
                      color: RULE_COLORS[v.ruleId] ?? T.warn,
                      border: `1px solid ${(RULE_COLORS[v.ruleId] ?? T.warn) + '44'}`,
                      borderRadius: 4,
                      padding: '2px 8px',
                    }}>
                      {v.ruleId}
                    </span>
                    <span style={{ fontWeight: 500, fontSize: 13 }}>{v.label}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: T.dim, fontFamily: 'monospace' }}>
                      {v.file}:{v.line}:{v.col}
                    </span>
                  </div>

                  <div style={{
                    background: T.bg,
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontFamily: 'monospace',
                    fontSize: 13,
                    marginBottom: 8,
                    lineHeight: 1.5,
                    wordBreak: 'break-all',
                  }}>
                    {v.context.replace(v.matched, `⟦${v.matched}⟧`)}
                  </div>

                  <div style={{ fontSize: 12, color: T.sub }}>
                    <strong>매칭:</strong>{' '}
                    <code style={{ background: '#fde8e8', color: T.err, padding: '1px 5px', borderRadius: 3 }}>
                      {v.matched}
                    </code>
                    {'  '}
                    <strong>사유:</strong> {v.desc}
                    {v.registry_numbers && v.registry_numbers.length > 0 && (
                      <span style={{ marginLeft: 8 }}>
                        <strong>근거:</strong> {v.registry_numbers.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {shown.length === 0 && result.total > 0 && (
            <p style={{ fontSize: 13, color: T.dim, textAlign: 'center', padding: 20 }}>
              선택한 규칙의 위반 후보가 없습니다
            </p>
          )}
        </>
      )}

      {/* CLI 안내 */}
      <div style={{ marginTop: 24, background: T.bg, borderRadius: 12, border: `1px solid ${T.border}`, padding: '14px 18px', fontSize: 13, color: T.sub, lineHeight: 1.6 }}>
        CLI로도 실행 가능:{' '}
        <code style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4, padding: '2px 8px', fontSize: 12, color: T.body }}>
          npm run lint:boundary
        </code>
        {'  '}JSON 출력:{' '}
        <code style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4, padding: '2px 8px', fontSize: 12, color: T.body }}>
          npm run lint:boundary -- --json
        </code>
      </div>
    </div>
  )
}
