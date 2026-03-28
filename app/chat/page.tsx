// =====================================================
// 채팅 페이지 v4 — CareFlow NANDA 간호 진단 기반
// POST /api/chat에서 받은 NANDA 6단계 응답을 사용자 친화적으로 표시
// 반응형: 모바일(전체 화면) / 데스크톱(중앙 카드)
//
// NANDA 응답 구조: 진단(diagnosis) → 자극(stimulus) → 경로(pathophysiology) →
//                  반응(response) → 정서(emotion) → 치료(therapeuticAction)
// MessageBubble 컴포넌트가 마크다운 포맷 응답을 렌더링
// =====================================================
'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import MessageBubble from '@/components/MessageBubble'
import TypingIndicator from '@/components/TypingIndicator'
import type { ChatMessage } from '@/app/api/chat/route'
import { saveSession } from '@/lib/sessionStorage'
import type { ObservationDomain, CareAxis, CrisisLevel, ConversationMode } from '@/lib/nursingLogic'

// 말투 모드별 초기 인사
const GREETING: Record<ConversationMode, string> = {
  '친근': '안녕 💚\n나 CareFlow야. 오늘 어떤 하루였어?\n편하게 얘기해줘, 판단 같은 거 없어.',
  '엄격': '안녕하세요 💚\n저는 CareFlow예요. 오늘 어떤 하루를 보내고 계신가요?\n편하게 이야기해주세요, 판단 없이 들을게요.',
}

// 빠른 입력 제안 (온보딩 UX)
const QUICK_PROMPTS = [
  '오늘 아무것도 못 했어요 😔',
  '불안하고 이유를 모르겠어요',
  '너무 지쳤어요',
  '기분이 자꾸 바뀌어요',
]

// 현재 시간 포맷
function getTime() {
  return new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatPage() {
  const [convMode, setConvMode] = useState<ConversationMode>('엄격')
  const [messages, setMessages] = useState<(ChatMessage & { time: string })[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  // 마지막으로 감지된 crisisLevel — 헤더 신호등 색상에 활용
  const [crisisLevel, setCrisisLevel] = useState<CrisisLevel>('none')

  // sessionStorage에서 말투 모드 읽기 (온보딩에서 저장된 값)
  useEffect(() => {
    const saved = (sessionStorage.getItem('careflow_mode') ?? '엄격') as ConversationMode
    setConvMode(saved)
    setMessages([{
      role: 'assistant',
      content: GREETING[saved],
      time: getTime(),
    }])
  }, [])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // 새 메시지 올 때 스크롤 아래로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // 헤더 신호등 색상 — macOS 트래픽 라이트
  const statusDotBg =
    crisisLevel === 'critical' ? '#FF5F57' :
    crisisLevel === 'urgent'   ? '#FF9F0A' :
    crisisLevel === 'monitor'  ? '#FEBC2E' :
                                 '#28C840'
  const statusDotPulse = crisisLevel !== 'critical'

  // 메시지 전송
  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: ChatMessage & { time: string } = {
      role: 'user',
      content: text.trim(),
      time: getTime(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      // ─── NANDA 간호 진단 API 호출 ───
      // /api/chat는 다음을 반환:
      // - reply: NANDA 6단계 포맷된 응답 (진단→자극→경로→반응→정서→치료)
      // - primaryDomain: 검출된 주요 관찰 영역 (Sleep, Energy, BodySignals 등)
      // - activeDomains: 복수 감지 도메인 배열
      // - axisScores: 4축 점수 (Body/Emotion/Connection/Meaning)
      // - crisisLevel: 위기 수준 ('none'|'monitor'|'urgent'|'critical')
      // - mode: 응답 생성 모드 ('mock'|'openai'|'claude'|'crisis')
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(({ role, content }) => ({ role, content })),
          mode: convMode,
        }),
      })

      if (!res.ok) throw new Error('API 오류')

      const data = await res.json()

      // NANDA 응답을 메시지로 추가 (MessageBubble에서 마크다운 렌더링)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply,
        time: getTime(),
      }])

      // ─── 위기 감지 신호등 업데이트 ───
      // crisisLevel: 🔴 critical | 🟠 urgent | 🟡 monitor | 🟢 none
      if (data.crisisLevel) {
        setCrisisLevel(data.crisisLevel as CrisisLevel)
      }

      // ─── 세션 자동 저장 (NANDA 평가 결과 기록) ───
      // 사용자의 관찰 영역(primaryDomain)과 4축 점수(axisScores)를 세션에 저장
      // 향후 대시보드의 트렌드 분석 및 패턴 추적에 활용
      if (data.primaryDomain) {
        saveSession({
          primaryDomain: data.primaryDomain as ObservationDomain,
          activeDomains: (data.activeDomains ?? [data.primaryDomain]) as ObservationDomain[],
          axisScores: (data.axisScores ?? {
            Body: 0, Emotion: 0, Connection: 0, Meaning: 0,
          }) as Record<CareAxis, number>,
          crisisLevel: (data.crisisLevel ?? 'none') as CrisisLevel,
          messageCount: 1,  // saveSession 내부에서 누적됨
        })
      }

    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '죄송해요, 잠시 문제가 생겼어요. 다시 시도해줄래요?',
        time: getTime(),
      }])
    } finally {
      setIsLoading(false)
      // 입력창으로 포커스
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  // Enter 키 처리 (Shift+Enter = 줄바꿈, Enter = 전송)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: '#FFFBF3' }}>

      {/* ── 상단 헤더 ── */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-4 py-3"
        style={{ background: '#FFF8EC', borderBottom: '1px solid #EAD9BA' }}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${statusDotPulse ? 'animate-pulse' : ''}`}
            style={{ backgroundColor: statusDotBg }}
          />
          <span className="font-semibold text-sm" style={{ color: '#2C1C10' }}>🌼 CareFlow</span>
          <span className="text-xs" style={{ color: '#B89A6A' }}>자기돌봄</span>
        </div>

        {/* 오른쪽: 히스토리 + 홈 */}
        <div className="flex items-center gap-3">
          <Link href="/history" style={{ color: '#B89A6A' }} className="hover:opacity-70 transition-opacity" title="기록 보기">
            {/* 캘린더 아이콘 */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </Link>
          <Link href="/" style={{ color: '#B89A6A' }} className="hover:opacity-70 transition-opacity" title="홈으로">
            {/* 집 아이콘 */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </Link>
        </div>
      </header>

      {/* ── 채팅 영역 ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">

          {/* 메시지 목록 */}
          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              role={msg.role}
              content={msg.content}
              timestamp={msg.time}
            />
          ))}

          {/* 타이핑 인디케이터 */}
          {isLoading && <TypingIndicator />}

          {/* 스크롤 앵커 */}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* ── 입력창 ── */}
      <footer
        className="flex-shrink-0 px-4 pt-3 pb-3"
        style={{ background: '#FFF8EC', borderTop: '1px solid #EAD9BA' }}
      >

        {/* 빠른 입력 제안 — 처음 메시지 전까지만 입력창 바로 위에 표시 */}
        {messages.length === 1 && (
          <div className="max-w-2xl mx-auto mb-2">
            <p className="text-xs mb-2" style={{ color: '#B89A6A' }}>자주 하는 이야기</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="rounded-full px-3 py-1.5 text-xs whitespace-nowrap transition-opacity hover:opacity-70"
                  style={{ background: '#FFFBF3', border: '1px solid #EAD9BA', color: '#5C3D1E' }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="오늘 어떤 하루였나요? 편하게 이야기해 주세요"
            rows={1}
            className="flex-1 resize-none rounded-2xl px-4 py-3 text-sm max-h-32 overflow-y-auto focus:outline-none transition-colors"
            style={{
              height: 'auto',
              background: '#FFFBF3',
              border: '1px solid #EAD9BA',
              color: '#2C1C10',
            }}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 128) + 'px'
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-opacity hover:opacity-80 shadow-sm disabled:cursor-not-allowed"
            style={{
              background: (!input.trim() || isLoading) ? '#EAD9BA' : '#28C840',
              color: '#FFFBF3',
            }}
          >
            {isLoading ? (
              <span className="text-lg">⏳</span>
            ) : (
              /* 연필 아이콘 */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            )}
          </button>
        </div>
        <p className="text-center text-xs mt-2" style={{ color: '#D4B896' }}>
          Shift+Enter = 줄바꿈 · Enter = 전송
        </p>
      </footer>
    </div>
  )
}
