'use client'

import { useState, useEffect, useRef } from 'react'

type Doc = {
  id: string
  title: string
  source_file: string
  page_count: number
  chunk_count: number
  created_at: string
}

const HISTORY_KEY = 'careflow.study.chat'

const SUGGESTED_QUESTIONS = [
  '메니에르병의 병태생리에서 내림프수종은 어떤 역할을 하나요?',
  '어지럼 악화 요인으로 언급된 생활·환경 요소를 정리해주세요.',
  'DHI 점수와 삶의 질 지표의 관계를 다룬 내용이 있나요?',
  '임상 가이드라인에서 권고하는 자가관리 교육 내용은 무엇인가요?',
]

type Source = {
  doc_title: string
  page_num: number
  similarity: number
  excerpt: string
}

type Message = {
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
  question?: string
}

const T = {
  bg: '#F3F6F1',
  surface: '#FBFCFA',
  card: 'rgba(255,255,255,0.82)',
  body: '#26312A',
  sub: '#5F6D64',
  dim: '#8D9A91',
  primary: '#5C7A5E',
  primaryDark: '#3F5F46',
  warn: '#C58F5B',
  border: '#e5ebe5',
  font: "Pretendard, -apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
}

export default function StudyPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [question, setQuestion] = useState('')
  const [querying, setQuerying] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<{ text: string; ok: boolean } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetchDocs()
    try {
      const saved = localStorage.getItem(HISTORY_KEY)
      if (saved) setMessages(JSON.parse(saved) as Message[])
    } catch { /* 손상된 기록은 무시 */ }
  }, [])
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, querying])
  useEffect(() => {
    // 학습 대화를 브라우저에 보관해 다음 방문에도 이어서 볼 수 있게 한다 (최근 60개).
    try {
      if (messages.length > 0) localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-60)))
    } catch { /* 저장 공간 부족 시 무시 */ }
  }, [messages])

  function clearHistory() {
    if (!confirm('저장된 학습 대화를 지울까요?')) return
    localStorage.removeItem(HISTORY_KEY)
    setMessages([])
  }

  async function fetchDocs() {
    const res = await fetch('/api/study/docs')
    if (res.ok) setDocs((await res.json()).docs ?? [])
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadStatus({ text: `"${file.name}" 처리 중…`, ok: true })

    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', file.name.replace(/\.pdf$/i, ''))

    const res = await fetch('/api/study/ingest', { method: 'POST', body: fd })
    const data = await res.json()

    if (res.ok) {
      setUploadStatus({ text: `완료 — ${data.chunks}개 청크 저장됨`, ok: true })
      fetchDocs()
    } else {
      setUploadStatus({ text: `오류: ${data.error}`, ok: false })
    }

    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
    setTimeout(() => setUploadStatus(null), 5000)
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`"${title}" 삭제할까요?`)) return
    await fetch('/api/study/docs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setDocs(prev => prev.filter(d => d.id !== id))
  }

  async function ask(q: string) {
    if (!q || querying) return
    setQuestion('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setQuerying(true)

    const res = await fetch('/api/study/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q }),
    })
    const data = await res.json()

    setMessages(prev => [...prev, {
      role: 'assistant',
      content: data.answer ?? data.error ?? '오류가 발생했습니다.',
      sources: data.sources,
      question: q,
    }])
    setQuerying(false)
  }

  async function handleQuery(e: React.FormEvent) {
    e.preventDefault()
    ask(question.trim())
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleQuery(e as unknown as React.FormEvent)
    }
  }

  const canQuery = docs.length > 0 && !querying

  return (
    <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '20px 16px',
        display: 'flex',
        gap: 20,
        alignItems: 'flex-start',
        flexWrap: 'wrap',
      }}>

        {/* ── Left: paper list ── */}
        <aside style={{ flex: '0 0 260px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

          <div style={{
            background: T.card,
            borderRadius: 16,
            padding: 18,
            border: `1px solid ${T.border}`,
          }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>논문 목록 ({docs.length})</span>
              <label style={{ cursor: uploading ? 'default' : 'pointer' }}>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf"
                  hidden
                  onChange={handleUpload}
                  disabled={uploading}
                />
                <span style={{
                  fontSize: 12,
                  background: uploading ? T.dim : T.primary,
                  color: '#fff',
                  padding: '5px 12px',
                  borderRadius: 8,
                  display: 'inline-block',
                  transition: 'background 0.15s',
                }}>
                  {uploading ? '처리 중…' : '+ PDF 추가'}
                </span>
              </label>
            </div>

            {/* Upload status */}
            {uploadStatus && (
              <div style={{
                fontSize: 12,
                color: uploadStatus.ok ? T.sub : '#b94a48',
                background: uploadStatus.ok ? T.bg : '#fdf0f0',
                border: `1px solid ${uploadStatus.ok ? T.border : '#f5c6cb'}`,
                borderRadius: 8,
                padding: '7px 10px',
                marginBottom: 12,
                lineHeight: 1.4,
              }}>
                {uploadStatus.text}
              </div>
            )}

            {/* Doc list */}
            {docs.length === 0 ? (
              <p style={{ fontSize: 13, color: T.dim, textAlign: 'center', padding: '16px 0', lineHeight: 1.5 }}>
                PDF를 추가하면<br />여기에 논문이 표시됩니다
              </p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {docs.map(doc => (
                  <li key={doc.id} style={{
                    background: T.bg,
                    borderRadius: 10,
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13,
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }} title={doc.title}>
                        {doc.title}
                      </div>
                      <div style={{ fontSize: 11, color: T.dim, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{doc.page_count}p · {doc.chunk_count} chunks</span>
                        {doc.source_file.startsWith('linknote:') && (
                          <span style={{
                            background: '#EEF4EE',
                            color: T.primary,
                            border: `1px solid ${T.border}`,
                            borderRadius: 999,
                            padding: '1px 7px',
                            fontSize: 10,
                            fontWeight: 600,
                          }}>
                            LinkNote
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(doc.id, doc.title)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: T.dim,
                        fontSize: 16,
                        lineHeight: 1,
                        padding: '0 2px',
                        flexShrink: 0,
                      }}
                      aria-label={`${doc.title} 삭제`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Disclaimer */}
          <div style={{
            background: '#FEF9F0',
            border: '1px solid #f0d9b5',
            borderRadius: 12,
            padding: '12px 14px',
            fontSize: 12,
            color: '#8D6A3A',
            lineHeight: 1.6,
          }}>
            ⚠️ 논문 내용을 참조·인용하는 학습 도구입니다. 의료 진단·처방·예후 예측이 아닙니다. 증상은 전문 의료진과 상담하세요.
          </div>
        </aside>

        {/* ── Right: chat ── */}
        <section style={{
          flex: '1 1 300px',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100svh - 130px)',
          minHeight: 400,
        }}>
          <div style={{
            background: T.card,
            borderRadius: 16,
            border: `1px solid ${T.border}`,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
          }}>

            {/* Toolbar */}
            {messages.length > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                padding: '8px 12px',
                borderBottom: `1px solid ${T.border}`,
              }}>
                <button onClick={clearHistory} style={{
                  background: 'none',
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  padding: '3px 10px',
                  fontSize: 11,
                  color: T.dim,
                  cursor: 'pointer',
                  fontFamily: T.font,
                }}>
                  대화 지우기
                </button>
              </div>
            )}

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px' }}>
              {messages.length === 0 && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  gap: 10,
                  color: T.dim,
                  textAlign: 'center',
                }}>
                  <span style={{ fontSize: 36 }}>📚</span>
                  <span style={{ fontSize: 15, fontWeight: 500 }}>논문에 대해 질문해보세요</span>
                  <span style={{ fontSize: 13, maxWidth: 320, lineHeight: 1.6 }}>
                    병태생리·해부학·임상 가이드라인 자료를 근거로 답하고 출처를 인용합니다.
                    좋은 답변은 &ldquo;주장 근거화&rdquo;로 보내 근거강도를 정리해두세요.
                  </span>
                  {docs.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, width: '100%', maxWidth: 420 }}>
                      {SUGGESTED_QUESTIONS.map(sq => (
                        <button key={sq} onClick={() => ask(sq)} style={{
                          background: T.surface,
                          border: `1px solid ${T.border}`,
                          borderRadius: 10,
                          padding: '9px 14px',
                          fontSize: 13,
                          color: T.sub,
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontFamily: T.font,
                          lineHeight: 1.5,
                        }}>
                          {sq}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '82%',
                      background: msg.role === 'user' ? T.primary : T.bg,
                      color: msg.role === 'user' ? '#fff' : T.body,
                      borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      padding: '11px 15px',
                      fontSize: 14,
                      lineHeight: 1.65,
                      whiteSpace: 'pre-wrap',
                    }}>
                      {msg.content}

                      {msg.sources && msg.sources.length > 0 && (
                        <div style={{
                          marginTop: 12,
                          paddingTop: 10,
                          borderTop: msg.role === 'user' ? '1px solid rgba(255,255,255,0.2)' : `1px solid ${T.border}`,
                        }}>
                          <div style={{ fontSize: 11, color: msg.role === 'user' ? 'rgba(255,255,255,0.7)' : T.dim, marginBottom: 6, fontWeight: 500 }}>
                            검색된 출처 ({msg.sources.length}개)
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {msg.sources.map((s, j) => (
                              <div key={j} style={{
                                fontSize: 11,
                                background: msg.role === 'user' ? 'rgba(255,255,255,0.12)' : T.card,
                                border: `1px solid ${msg.role === 'user' ? 'rgba(255,255,255,0.15)' : T.border}`,
                                color: msg.role === 'user' ? 'rgba(255,255,255,0.85)' : T.sub,
                                borderRadius: 6,
                                padding: '5px 8px',
                                lineHeight: 1.4,
                              }}>
                                <span style={{ fontWeight: 500 }}>{s.doc_title}</span>
                                {' · '}p.{s.page_num}
                                {' · '}
                                <span style={{ opacity: 0.75 }}>유사도 {s.similarity}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {msg.role === 'assistant' && msg.question && msg.sources && msg.sources.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                          <a
                            href={`/study/claim?claim=${encodeURIComponent(msg.question)}`}
                            style={{
                              fontSize: 12,
                              color: T.primaryDark,
                              background: '#EEF4EE',
                              border: `1px solid ${T.border}`,
                              borderRadius: 8,
                              padding: '4px 10px',
                              textDecoration: 'none',
                              display: 'inline-block',
                            }}
                          >
                            이 주제를 주장 근거화로 정리 →
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {querying && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{
                      background: T.bg,
                      borderRadius: '16px 16px 16px 4px',
                      padding: '11px 15px',
                      fontSize: 13,
                      color: T.dim,
                    }}>
                      논문 검색 중…
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            </div>

            {/* Input area */}
            <form onSubmit={handleQuery} style={{
              padding: '12px 16px 16px',
              borderTop: `1px solid ${T.border}`,
              display: 'flex',
              gap: 10,
              alignItems: 'flex-end',
            }}>
              <textarea
                ref={inputRef}
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  docs.length === 0
                    ? '먼저 왼쪽에서 PDF를 추가하세요'
                    : '논문에 대해 질문하세요… (Enter 전송 · Shift+Enter 줄바꿈)'
                }
                disabled={!canQuery}
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
                  opacity: !canQuery ? 0.5 : 1,
                }}
              />
              <button
                type="submit"
                disabled={!canQuery || !question.trim()}
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
                  opacity: (!canQuery || !question.trim()) ? 0.4 : 1,
                  transition: 'opacity 0.15s',
                  fontFamily: T.font,
                }}
              >
                전송
              </button>
            </form>
          </div>
        </section>
    </div>
  )
}
