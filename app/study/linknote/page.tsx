'use client'

import { useState, useEffect } from 'react'

type LinkNoteUser = {
  email: string
  display_name: string
}

type LibraryFile = { filename: string; title: string }
type LibraryCourse = { course: string; files: LibraryFile[] }
type LibrarySemester = { semester: string; courses: LibraryCourse[] }
type Library = { total_chunks: number; semesters: LibrarySemester[] }

type ImportResult = { filename: string; ok: boolean; chunks?: number; message?: string }

const T = {
  bg: '#F3F6F1',
  surface: '#FBFCFA',
  card: 'rgba(255,255,255,0.82)',
  body: '#26312A',
  sub: '#5F6D64',
  dim: '#8D9A91',
  primary: '#5C7A5E',
  border: '#e5ebe5',
  font: "Pretendard, -apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
}

const STORAGE_KEY = 'careflow.linknote.session'

type Session = { serverUrl: string; token: string; user: LinkNoteUser }

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: `1px solid ${T.border}`,
  borderRadius: 10,
  padding: '9px 12px',
  fontSize: 14,
  background: T.surface,
  color: T.body,
  outline: 'none',
  fontFamily: T.font,
  boxSizing: 'border-box',
}

export default function StudyLinkNotePage() {
  const [session, setSession] = useState<Session | null>(null)
  const [serverUrl, setServerUrl] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [library, setLibrary] = useState<Library | null>(null)
  const [imported, setImported] = useState<Set<string>>(new Set())
  const [loadingLibrary, setLoadingLibrary] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<ImportResult[] | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const saved = loadSession()
    if (saved) {
      setSession(saved)
      setServerUrl(saved.serverUrl)
    }
  }, [])

  useEffect(() => {
    if (session) fetchLibrary(session)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    setConnecting(true)
    setError(null)
    const res = await fetch('/api/study/linknote/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serverUrl, email, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'LinkNote 로그인에 실패했습니다.')
    } else {
      const next: Session = { serverUrl: data.serverUrl, token: data.token, user: data.user }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setSession(next)
      setPassword('')
    }
    setConnecting(false)
  }

  function handleDisconnect() {
    localStorage.removeItem(STORAGE_KEY)
    setSession(null)
    setLibrary(null)
    setSelected(new Set())
    setResults(null)
  }

  async function fetchLibrary(s: Session) {
    setLoadingLibrary(true)
    setError(null)
    const res = await fetch('/api/study/linknote/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serverUrl: s.serverUrl, token: s.token }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'LinkNote 서재 조회에 실패했습니다.')
      if (res.status === 401) handleDisconnect()
    } else {
      setLibrary(data.library)
      setImported(new Set(data.imported ?? []))
    }
    setLoadingLibrary(false)
  }

  function toggleFile(filename: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(filename)) next.delete(filename)
      else next.add(filename)
      return next
    })
  }

  async function handleImport() {
    if (!session || selected.size === 0 || importing) return
    setImporting(true)
    setResults(null)
    setError(null)
    const res = await fetch('/api/study/linknote/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serverUrl: session.serverUrl,
        token: session.token,
        filenames: Array.from(selected),
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? '가져오기에 실패했습니다.')
    } else {
      setResults(data.results ?? [])
      setSelected(new Set())
      fetchLibrary(session)
    }
    setImporting(false)
  }

  async function handleExport() {
    setExporting(true)
    setError(null)
    const res = await fetch('/api/study/linknote/export')
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? '내보내기에 실패했습니다.')
    } else {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'careflow-study-linknote-export.json'
      a.click()
      URL.revokeObjectURL(url)
    }
    setExporting(false)
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* 연결 상태 / 로그인 */}
      <section style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, padding: 20 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>LinkNote 연결</h2>
        <p style={{ margin: '6px 0 16px', fontSize: 13, color: T.sub, lineHeight: 1.6 }}>
          LinkNote 계정으로 로그인하면 LinkNote에 올린 자료를 스터디로 가져오거나,
          스터디 논문을 LinkNote 형식으로 내보낼 수 있습니다.
        </p>

        {session ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 13, background: '#EEF4EE', color: T.primary,
              padding: '6px 12px', borderRadius: 999, fontWeight: 500,
            }}>
              ✓ {session.user.display_name || session.user.email} 로 연결됨
            </span>
            <span style={{ fontSize: 12, color: T.dim }}>{session.serverUrl}</span>
            <button onClick={handleDisconnect} style={{
              marginLeft: 'auto', background: 'none', border: `1px solid ${T.border}`,
              borderRadius: 8, padding: '5px 12px', fontSize: 12, color: T.sub,
              cursor: 'pointer', fontFamily: T.font,
            }}>
              연결 해제
            </button>
          </div>
        ) : (
          <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              type="url"
              value={serverUrl}
              onChange={e => setServerUrl(e.target.value)}
              placeholder="LinkNote 서버 주소 (예: https://linknote.onrender.com)"
              required
              style={inputStyle}
            />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="LinkNote 이메일"
                required
                style={{ ...inputStyle, flex: '1 1 200px' }}
              />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="비밀번호"
                required
                style={{ ...inputStyle, flex: '1 1 160px' }}
              />
            </div>
            <p style={{ margin: 0, fontSize: 12, color: T.dim, lineHeight: 1.5 }}>
              비밀번호는 토큰 발급에만 사용되며 저장되지 않습니다. 구글 로그인 계정은 LinkNote에서 비밀번호를 먼저 설정해주세요.
            </p>
            <button type="submit" disabled={connecting} style={{
              alignSelf: 'flex-start', background: T.primary, color: '#fff',
              border: 'none', borderRadius: 10, padding: '9px 20px',
              fontSize: 14, fontWeight: 500, cursor: 'pointer',
              opacity: connecting ? 0.5 : 1, fontFamily: T.font,
            }}>
              {connecting ? '연결 중…' : 'LinkNote 로그인'}
            </button>
          </form>
        )}

        {error && (
          <div style={{
            marginTop: 12, fontSize: 12, color: '#b94a48', background: '#fdf0f0',
            border: '1px solid #f5c6cb', borderRadius: 8, padding: '7px 10px',
          }}>
            {error}
          </div>
        )}
      </section>

      {/* LinkNote → 스터디 가져오기 */}
      {session && (
        <section style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>LinkNote → 스터디 가져오기</h2>
            <button onClick={() => fetchLibrary(session)} disabled={loadingLibrary} style={{
              background: 'none', border: `1px solid ${T.border}`, borderRadius: 8,
              padding: '4px 10px', fontSize: 12, color: T.sub, cursor: 'pointer', fontFamily: T.font,
            }}>
              {loadingLibrary ? '불러오는 중…' : '새로고침'}
            </button>
          </div>
          <p style={{ margin: '2px 0 14px', fontSize: 13, color: T.sub, lineHeight: 1.6 }}>
            가져온 자료는 스터디에서 다시 임베딩되어 논문 질문에 함께 검색됩니다.
          </p>

          {!library ? (
            <p style={{ fontSize: 13, color: T.dim }}>서재를 불러오는 중…</p>
          ) : library.semesters.length === 0 ? (
            <p style={{ fontSize: 13, color: T.dim }}>LinkNote에 업로드된 자료가 없습니다.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {library.semesters.map(sem => (
                <div key={sem.semester}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.dim, marginBottom: 6 }}>{sem.semester}</div>
                  {sem.courses.map(course => (
                    <div key={course.course} style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: T.sub, marginBottom: 4 }}>{course.course}</div>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {course.files.map(file => {
                          const done = imported.has(file.filename)
                          return (
                            <li key={file.filename}>
                              <label style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                background: T.bg, borderRadius: 8, padding: '8px 10px',
                                fontSize: 13, cursor: done ? 'default' : 'pointer',
                                opacity: done ? 0.55 : 1,
                              }}>
                                <input
                                  type="checkbox"
                                  checked={selected.has(file.filename)}
                                  onChange={() => toggleFile(file.filename)}
                                  disabled={done || importing}
                                />
                                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {file.title || file.filename}
                                </span>
                                {done && <span style={{ fontSize: 11, color: T.primary, flexShrink: 0 }}>가져옴 ✓</span>}
                              </label>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={selected.size === 0 || importing}
            style={{
              marginTop: 14, background: T.primary, color: '#fff', border: 'none',
              borderRadius: 10, padding: '9px 20px', fontSize: 14, fontWeight: 500,
              cursor: 'pointer', opacity: selected.size === 0 || importing ? 0.4 : 1,
              fontFamily: T.font,
            }}
          >
            {importing ? '가져오는 중… (임베딩 처리)' : `선택한 ${selected.size}개 자료 가져오기`}
          </button>

          {results && (
            <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {results.map(r => (
                <li key={r.filename} style={{
                  fontSize: 12, borderRadius: 8, padding: '7px 10px',
                  color: r.ok ? T.sub : '#b94a48',
                  background: r.ok ? T.bg : '#fdf0f0',
                  border: `1px solid ${r.ok ? T.border : '#f5c6cb'}`,
                }}>
                  {r.filename} — {r.ok ? `완료 (${r.chunks}개 청크)` : r.message}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* 스터디 → LinkNote 내보내기 */}
      <section style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, padding: 20 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>스터디 → LinkNote 내보내기</h2>
        <p style={{ margin: '6px 0 14px', fontSize: 13, color: T.sub, lineHeight: 1.6 }}>
          스터디에 올린 논문 텍스트를 LinkNote가 읽을 수 있는 페이지 형식(JSON)으로 내려받습니다.
          LinkNote에서 가져온 자료는 중복을 막기 위해 제외됩니다.
        </p>
        <button onClick={handleExport} disabled={exporting} style={{
          background: '#fff', color: T.primary, border: `1px solid ${T.primary}`,
          borderRadius: 10, padding: '9px 20px', fontSize: 14, fontWeight: 500,
          cursor: 'pointer', opacity: exporting ? 0.5 : 1, fontFamily: T.font,
        }}>
          {exporting ? '내보내는 중…' : 'JSON 내려받기'}
        </button>
      </section>

      {/* 안내 */}
      <div style={{
        background: '#FEF9F0', border: '1px solid #f0d9b5', borderRadius: 12,
        padding: '12px 14px', fontSize: 12, color: '#8D6A3A', lineHeight: 1.6,
      }}>
        ⚠️ 가져온 자료도 논문 참조·인용 학습 도구로만 사용됩니다. 의료 진단·처방·예후 예측이 아닙니다.
      </div>
    </div>
  )
}
