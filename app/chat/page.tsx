'use client'

import { useState, useRef, useEffect } from 'react'
import IPhoneFrame from '../components/IPhoneFrame'

const SAGE      = '#A3B18A'
const SAGE_DARK = '#7A9E6A'
const TEXT      = '#2D3436'
const TEXT_MID  = '#636E72'
const TEXT_LIGHT= '#B2BEC3'

const AXIS_COLOR: Record<string, string> = { 몸:'#F5A87C', 감정:'#EE9FB8', 관계:'#B8A8D4', 의미:'#E8C86E' }

interface Msg {
  id: string
  role: 'ai' | 'user' | 'system'
  text: string
  tags?: string[]
}

const INIT: Msg[] = [
  {
    id: '0', role: 'ai',
    text: '안녕하세요 🌿 오늘 어떤 하루를 보내고 계신가요? 편하게 이야기해주세요.',
  },
]

const AUTO_REPLIES: { keywords: string[]; reply: string; tags: string[] }[] = [
  { keywords:['이명','귀','소리','울림'],         reply:'이명이 느껴지셨군요. 더 이야기해주실 게 있나요?',           tags:['몸']        },
  { keywords:['어지','빙빙','균형','흔들'],        reply:'어지러움도 함께 오셨군요. 추가로 기록하고 싶은 게 있나요?', tags:['몸']        },
  { keywords:['피로','피곤','지쳐','힘들','졸'],   reply:'많이 피곤하셨겠어요. 더 기록하고 싶은 게 있나요?',         tags:['몸','감정']  },
  { keywords:['불안','걱정','무서','두려'],        reply:'불안한 마음이 드셨군요. 추가로 기록할 게 있나요?',         tags:['감정']      },
  { keywords:['예민','짜증','화','민감'],          reply:'예민하게 느껴지는 하루였군요. 더 나누고 싶은 게 있나요?',  tags:['감정']      },
  { keywords:['외로','혼자','고립','연락'],        reply:'혼자라는 느낌이 드셨군요. 추가로 기록할 게 있나요?',       tags:['관계']      },
  { keywords:['가족','친구','사람','만남'],        reply:'소중한 분과의 시간이 있었군요. 더 기록하고 싶은 게 있나요?',tags:['관계']     },
  { keywords:['성취','해냈','완료','끝냈','했어'], reply:'오늘 무언가를 해내셨군요! 추가로 기록할 게 있나요?',       tags:['의미']      },
  { keywords:['좋아','괜찮','나쁘지'],            reply:'그나마 다행이에요. 더 이야기해주실 게 있나요?',            tags:['의미']      },
  { keywords:['두통','머리','통증'],              reply:'두통이 있으셨군요. 추가로 기록하고 싶은 게 있나요?',       tags:['몸']        },
]

function getReply(text: string): { reply: string; tags: string[] } {
  for (const r of AUTO_REPLIES) {
    if (r.keywords.some(k => text.includes(k))) return { reply: r.reply, tags: r.tags }
  }
  return { reply: '기록해 주셔서 감사해요. 추가로 기록하고 싶은 게 있나요?', tags: [] }
}

const TODAY = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })

export default function ChatPage() {
  const [msgs, setMsgs]     = useState<Msg[]>(INIT)
  const [input, setInput]   = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef           = useRef<HTMLDivElement>(null)
  const sendingRef          = useRef(false)

  const userCount = msgs.filter(m => m.role === 'user').length

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, typing])

  const send = () => {
    if (sendingRef.current) return
    const text = input.trim()
    if (!text) return
    sendingRef.current = true
    setInput('')
    setMsgs(prev => [...prev, { id: Date.now().toString(), role: 'user', text }])
    setTyping(true)
    setTimeout(() => {
      const { reply, tags } = getReply(text)
      setTyping(false)
      setMsgs(prev => [
        ...prev,
        { id: `sys-${Date.now()}`,  role: 'system', text: '', tags },
        { id: `ai-${Date.now()+1}`, role: 'ai',     text: reply },
      ])
      sendingRef.current = false
    }, 900)
  }

  const placeholder = userCount === 0
    ? '오늘 하루를 기록해보세요'
    : userCount === 1
    ? '계속 기록하거나 마칠 수 있어요'
    : '추가로 기록하고 싶은 게 있나요?'

  const disclaimer = userCount === 0
    ? '기록한 내용은 의료적 판단에 사용되지 않아요'
    : '이 내용은 리포트에도 활용됩니다'

  return (
    <IPhoneFrame sub={`${TODAY} · AI 일기장`}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* 날짜 구분선 */}
        <div style={{ textAlign:'center', padding:'12px 0 8px', fontSize:11, color:TEXT_LIGHT, fontWeight:600, flexShrink:0 }}>
          {TODAY}
        </div>

        {/* 메시지 영역 */}
        <div style={{
          flex:1, minHeight:0, overflowY:'auto', padding:'0 16px 8px',
          display:'flex', flexDirection:'column', gap:10,
          scrollbarWidth:'none',
        }}>
          {msgs.map(m => {
            /* 시스템: 기록 확인 */
            if (m.role === 'system') return (
              <div key={m.id} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, padding:'4px 0' }}>
                <div style={{ fontSize:12, fontWeight:700, color:SAGE_DARK }}>기록되었습니다 ✅</div>
                {m.tags && m.tags.length > 0 && (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                    <div style={{ fontSize:10, color:TEXT_LIGHT, fontWeight:600 }}>자동 분류된 축</div>
                    <div style={{ display:'flex', gap:5 }}>
                      {m.tags.map(t => (
                        <span key={t} style={{
                          fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99,
                          background:`${AXIS_COLOR[t]}30`, color:AXIS_COLOR[t],
                        }}>{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )

            /* AI / 유저 메시지 */
            return (
              <div key={m.id} style={{
                display:'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth:'82%', padding:'11px 14px',
                  borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                  background: m.role === 'user'
                    ? `linear-gradient(135deg, ${SAGE}, ${SAGE_DARK})`
                    : 'rgba(255,255,255,0.92)',
                  color: m.role === 'user' ? '#fff' : TEXT,
                  fontSize:13, lineHeight:1.7, fontWeight:500,
                  border: m.role === 'ai' ? '1px solid rgba(163,177,138,0.2)' : 'none',
                  boxShadow: m.role === 'user'
                    ? '0 4px 16px rgba(163,177,138,0.3)'
                    : '0 2px 10px rgba(0,0,0,0.05)',
                }}>
                  {m.text}
                </div>
              </div>
            )
          })}

          {/* 타이핑 인디케이터 */}
          {typing && (
            <div style={{ display:'flex', justifyContent:'flex-start' }}>
              <div style={{
                background:'rgba(255,255,255,0.92)',
                border:'1px solid rgba(163,177,138,0.2)',
                borderRadius:'4px 18px 18px 18px',
                padding:'12px 16px',
                display:'flex', gap:5, alignItems:'center',
                boxShadow:'0 2px 10px rgba(0,0,0,0.05)',
              }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width:5, height:5, borderRadius:'50%', background:SAGE,
                    animation:`dot 1.2s ease-in-out ${i*0.2}s infinite`,
                  }}/>
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* 입력창 */}
        <div style={{
          flexShrink:0,
          padding:'8px 12px 0',
          borderTop:'1px solid rgba(163,177,138,0.12)',
          background:'rgba(255,255,255,0.9)',
          backdropFilter:'blur(16px)',
          WebkitBackdropFilter:'blur(16px)',
        }}>
          <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder={placeholder}
              rows={1}
              style={{
                flex:1, resize:'none',
                border:'1.5px solid rgba(163,177,138,0.28)',
                borderRadius:20, padding:'9px 14px',
                fontSize:13, color:TEXT,
                background:'rgba(255,255,255,0.95)',
                outline:'none', fontFamily:'inherit',
                lineHeight:1.5, maxHeight:72, overflowY:'auto',
              }}
            />
            <button
              onClick={send}
              disabled={!input.trim()}
              style={{
                width:36, height:36, borderRadius:'50%', border:'none',
                cursor: input.trim() ? 'pointer' : 'default',
                background: input.trim()
                  ? `linear-gradient(135deg, ${SAGE}, ${SAGE_DARK})`
                  : 'rgba(163,177,138,0.2)',
                display:'flex', alignItems:'center', justifyContent:'center',
                flexShrink:0, transition:'all 0.2s',
                boxShadow: input.trim() ? '0 4px 12px rgba(163,177,138,0.4)' : 'none',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>

          {/* 면책 문구 */}
          <div style={{ textAlign:'center', fontSize:10, color:TEXT_LIGHT, padding:'6px 0 10px', fontWeight:500 }}>
            {disclaimer}
          </div>
        </div>

      </div>

      <style>{`
        @keyframes dot { 0%,80%,100%{transform:scale(1);opacity:0.5} 40%{transform:scale(1.35);opacity:1} }
        textarea::placeholder { color:${TEXT_LIGHT}; }
        div::-webkit-scrollbar { display:none; }
      `}</style>
    </IPhoneFrame>
  )
}
