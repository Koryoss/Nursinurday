'use client'

import { useState, useRef, useEffect } from 'react'
import IPhoneFrame from '../components/IPhoneFrame'

const AXIS_COLOR: Record<string, string> = { 몸:'#F5A87C', 감정:'#EE9FB8', 관계:'#B8A8D4', 의미:'#E8C86E' }
const AXIS_TEXT:  Record<string, string> = { 몸:'#7A3A0A', 감정:'#7A1A40', 관계:'#3D2878', 의미:'#6B4A00' }

interface Msg { id: string; role: 'ai'|'user'; text: string; tags?: string[] }

const INIT: Msg[] = [
  {
    id: '0', role: 'ai',
    text: '안녕하세요 😊 오늘 하루 어떠셨나요? 편하게 이야기해 주세요. 몸 상태, 감정, 주변 사람들과의 관계, 오늘의 의미 — 어떤 것이든 괜찮아요.',
    tags: [],
  },
]

const AUTO_REPLIES: { keywords: string[]; reply: string; tags: string[] }[] = [
  { keywords:['이명','귀','소리','울림'],         reply:'이명이 느껴지셨군요. 오늘 소리가 특히 심한 시간대가 있었나요?',                         tags:['몸']          },
  { keywords:['어지','빙빙','균형','흔들'],        reply:'어지러움이 있었군요. 걸을 때 심했는지, 앉아 있을 때도 느껴졌는지 궁금해요.',              tags:['몸']          },
  { keywords:['피로','피곤','지쳐','힘들','졸'],   reply:'많이 피곤하셨겠어요. 오늘 수면은 어떠셨나요?',                                         tags:['몸','감정']   },
  { keywords:['불안','걱정','무서','두려'],        reply:'불안한 마음이 드셨군요. 어떤 순간에 그런 감정이 왔는지 기억나세요?',                     tags:['감정']        },
  { keywords:['예민','짜증','화','민감'],          reply:'예민하게 느껴지는 하루였군요. 주변 소리나 빛이 특히 거슬렸나요?',                        tags:['감정']        },
  { keywords:['외로','혼자','고립','연락'],        reply:'혼자라는 느낌이 드셨군요. 오늘 누군가와 대화하셨나요?',                                  tags:['관계']        },
  { keywords:['가족','친구','사람','만남'],        reply:'소중한 사람과 함께하는 시간이 있었군요. 어떤 감정이 느껴졌나요?',                        tags:['관계']        },
  { keywords:['성취','해냈','완료','끝냈','했어'], reply:'오늘 무언가를 해내셨군요! 어떤 일이었는지 더 이야기해 주시겠어요?',                      tags:['의미']        },
  { keywords:['좋아','괜찮','나쁘지'],            reply:'그나마 다행이에요. 오늘 특별히 기억에 남는 순간이 있었나요?',                            tags:['의미']        },
  { keywords:['두통','머리','통증'],              reply:'두통이 있으셨군요. 이명이나 어지러움이 함께 오진 않았나요?',                             tags:['몸']          },
]

function getReply(text: string): { reply: string; tags: string[] } {
  for (const r of AUTO_REPLIES) {
    if (r.keywords.some(k => text.includes(k))) return { reply: r.reply, tags: r.tags }
  }
  return { reply: '기록해 주셔서 감사해요. 오늘 하루를 한 줄로 표현한다면 어떻게 말씀하시겠어요?', tags: [] }
}

const TODAY = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })

export default function ChatPage() {
  const [msgs, setMsgs]     = useState<Msg[]>(INIT)
  const [input, setInput]   = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef           = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, typing])

  const send = () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    setMsgs(prev => [...prev, { id: Date.now().toString(), role: 'user', text }])
    setTyping(true)
    setTimeout(() => {
      const { reply, tags } = getReply(text)
      setTyping(false)
      setMsgs(prev => [...prev, { id: `ai-${Date.now()}`, role: 'ai', text: reply, tags }])
    }, 900)
  }

  const allTags = [...new Set(msgs.flatMap(m => m.tags ?? []))]

  return (
    <IPhoneFrame sub={`${TODAY} · AI 일기장`}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* 기록된 축 태그 */}
        {allTags.length > 0 && (
          <div style={{ padding:'8px 16px', display:'flex', gap:5, flexWrap:'wrap', borderBottom:'1px solid rgba(61,43,31,0.06)', flexShrink:0 }}>
            {allTags.map(t => (
              <span key={t} style={{ fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:99, background:`${AXIS_COLOR[t]}28`, color:AXIS_TEXT[t] }}>✓ {t}</span>
            ))}
          </div>
        )}

        {/* 메시지 영역 */}
        <div style={{ flex:1, overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:10, scrollbarWidth:'none' }}>
          {msgs.map(m => (
            <div key={m.id} style={{ display:'flex', flexDirection:'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', gap:4 }}>
              {m.role === 'ai' && (
                <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
                  <div style={{ width:22, height:22, borderRadius:'50%', background:'linear-gradient(135deg,#5BA88A,#7CC4A8)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontSize:11 }}>🌿</span>
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, color:'#5BA88A' }}>CareFlow</span>
                </div>
              )}
              <div style={{
                maxWidth:'82%', padding:'10px 13px',
                borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                background: m.role === 'user' ? '#5BA88A' : '#FFF8EC',
                color: m.role === 'user' ? '#fff' : '#3D2B1F',
                fontSize:13, lineHeight:1.6, fontWeight:500,
                border: m.role === 'ai' ? '1px solid #EAD9BA' : 'none',
                boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
              }}>
                {m.text}
              </div>
              {m.role === 'ai' && m.tags && m.tags.length > 0 && (
                <div style={{ display:'flex', gap:4, paddingLeft:4 }}>
                  {m.tags.map(t => (
                    <span key={t} style={{ fontSize:9.5, fontWeight:700, padding:'2px 7px', borderRadius:99, background:`${AXIS_COLOR[t]}28`, color:AXIS_TEXT[t] }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {typing && (
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:22, height:22, borderRadius:'50%', background:'linear-gradient(135deg,#5BA88A,#7CC4A8)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:11 }}>🌿</span>
              </div>
              <div style={{ background:'#FFF8EC', border:'1px solid #EAD9BA', borderRadius:'4px 18px 18px 18px', padding:'10px 14px', display:'flex', gap:4 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#C4B09A', animation:`dot 1.2s ease-in-out ${i*0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* 입력창 */}
        <div style={{ padding:'10px 12px 14px', borderTop:'1px solid rgba(61,43,31,0.08)', flexShrink:0, display:'flex', gap:8, alignItems:'flex-end' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="오늘 하루를 이야기해보세요..."
            rows={1}
            style={{ flex:1, resize:'none', border:'1.5px solid #EAD9BA', borderRadius:20, padding:'10px 14px', fontSize:13, color:'#3D2B1F', background:'#FFF8EC', outline:'none', fontFamily:'inherit', lineHeight:1.5, maxHeight:80, overflowY:'auto' }}
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            style={{ width:38, height:38, borderRadius:'50%', border:'none', cursor: input.trim() ? 'pointer' : 'default', background: input.trim() ? '#5BA88A' : '#EAD9BA', display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.2s', flexShrink:0 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes dot { 0%,80%,100%{transform:scale(1);opacity:.5} 40%{transform:scale(1.3);opacity:1} }
        textarea::placeholder { color:#C4B09A; }
        div::-webkit-scrollbar { display:none; }
      `}</style>
    </IPhoneFrame>
  )
}
