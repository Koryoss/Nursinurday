// =====================================================
// 채팅 말풍선 컴포넌트 v4 — NANDA 응답 렌더링
// user / assistant 두 가지 스타일
// NANDA 6단계 응답(진단→자극→경로→반응→정서→치료) 표시
// 마크다운 기본 처리: **bold** 텍스트 지원
// =====================================================
'use client'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

export default function MessageBubble({ role, content, timestamp }: MessageBubbleProps) {
  const isUser = role === 'user'

  return (
    <div className={`flex message-enter ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex gap-2 max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>

        {/* 아바타 */}
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
          style={isUser
            ? { background: '#3D2B1F', color: '#FFF8EC' }
            : { background: '#28C840', color: '#fff' }
          }
        >
          {isUser ? '나' : '💚'}
        </div>

        {/* 말풍선 */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser ? 'rounded-tr-sm' : 'rounded-tl-sm shadow-sm'}`}
          style={isUser
            ? { background: '#3D2B1F', color: '#FFF8EC' }
            : { background: '#FFF8EC', color: '#2C1C10', border: '1px solid #EAD9BA' }
          }
        >
          {/* 마크다운 기본 처리: **bold** */}
          {content.split('\n').map((line, i) => (
            <p key={i} className={i > 0 ? 'mt-2' : ''}>
              {line.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                part.startsWith('**') && part.endsWith('**')
                  ? <strong key={j}>{part.slice(2, -2)}</strong>
                  : part
              )}
            </p>
          ))}

          {/* 타임스탬프 */}
          {timestamp && (
            <p className="text-xs mt-1" style={{ color: isUser ? 'rgba(255,248,236,0.6)' : '#B89A6A' }}>
              {timestamp}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
