// LinkNote(FastAPI + ChromaDB) 서버와 통신하는 서버 사이드 클라이언트.
// LinkNote 계정(이메일 로그인 → HMAC 토큰)으로 사용자 자료를 조회해
// CareFlow 스터디(study_docs/study_chunks)와 데이터를 주고받는다.

export type LinkNoteUser = {
  id: string
  email: string
  display_name: string
  data_user_id: string
  auth_provider: string
}

export type LinkNoteLibrary = {
  total_chunks: number
  semesters: {
    semester: string
    courses: {
      course: string
      files: { filename: string; title: string }[]
    }[]
  }[]
}

export type LinkNoteChunk = {
  id: string
  user_id: string
  semester: string
  course: string
  title: string
  filename: string
  page: number
  chunk_index: number
  unit: string
  text: string
}

export class LinkNoteError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function normalizeServerUrl(raw: string): string {
  const url = (raw || '').trim().replace(/\/+$/, '')
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new LinkNoteError('LinkNote 서버 주소가 올바르지 않습니다.', 400)
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new LinkNoteError('LinkNote 서버 주소는 http(s)만 지원합니다.', 400)
  }
  return url
}

async function request<T>(
  serverUrl: string,
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${serverUrl}${path}`, { ...init, headers, cache: 'no-store' })
  } catch {
    throw new LinkNoteError('LinkNote 서버에 연결할 수 없습니다. 주소와 서버 상태를 확인하세요.', 502)
  }

  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const detail =
      (body && typeof body.detail === 'string' && body.detail) ||
      `LinkNote 요청 실패 (HTTP ${res.status})`
    throw new LinkNoteError(detail, res.status)
  }
  return body as T
}

export async function linknoteLogin(serverUrl: string, email: string, password: string) {
  return request<{ token: string; user: LinkNoteUser }>(serverUrl, '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
}

export async function linknoteMe(serverUrl: string, token: string) {
  return request<{ user: LinkNoteUser }>(serverUrl, '/auth/me', {}, token)
}

export async function linknoteLibrary(serverUrl: string, token: string) {
  return request<LinkNoteLibrary>(serverUrl, '/library', {}, token)
}

// /chunks 는 offset/limit 페이지네이션이라 전량 수집한다.
export async function linknoteChunksByFile(
  serverUrl: string,
  token: string,
  filename: string,
): Promise<LinkNoteChunk[]> {
  const PAGE = 200
  const chunks: LinkNoteChunk[] = []
  let offset = 0
  for (;;) {
    const params = new URLSearchParams({
      full: 'true',
      limit: String(PAGE),
      offset: String(offset),
      filename,
    })
    const page = await request<{ total: number; items: LinkNoteChunk[] }>(
      serverUrl,
      `/chunks?${params.toString()}`,
      {},
      token,
    )
    chunks.push(...(page.items ?? []))
    offset += PAGE
    if (chunks.length >= page.total || (page.items ?? []).length === 0) break
  }
  chunks.sort((a, b) => (a.page - b.page) || (a.chunk_index - b.chunk_index))
  return chunks
}
