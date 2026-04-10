'use client'

import { useState, useRef, useEffect } from 'react'
import IPhoneFrame from '../components/IPhoneFrame'

const SAGE      = '#A3B18A'
const SAGE_DARK = '#7A9E6A'
const TEXT      = '#2D3436'
const TEXT_MID  = '#636E72'
const TEXT_LIGHT= '#B2BEC3'

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

// 4-axis background pattern SVG (5% opacity)
const BG_PATTERN = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><circle cx='20' cy='20' r='14' fill='none' stroke='%23F5A87C' stroke-width='2' opacity='0.5'/><path d='M60,10 C60,10 70,18 60,26 C50,18 60,10 60,10Z' fill='none' stroke='%23EE9FB8' stroke-width='2' opacity='0.5'/><polygon points='100,8 103,18 113,18 105,24 108,34 100,28 92,34 95,24 87,18 97,18' fill='none' stroke='%23E8C86E' stroke-width='1.5' opacity='0.5'/><circle cx='20' cy='95' r='8' fill='none' stroke='%23B8A8D4' stroke-width='2' opacity='0.4'/><circle cx='14' cy='100' r='8' fill='none' stroke='%23B8A8D4' stroke-width='2' opacity='0.4'/></svg>`

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
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', position:'relative' }}>

        {/* 4-axis background pattern */}
        <div style={{
          position:'absolute', inset:0, zIndex:0,
          backgroundImage:`url("${BG_PATTERN}")`,
          backgroundRepeat:'repeat',
          backgroundSize:120,
          opacity:0.05,
          pointerEvents:'none',
        }}/>

        {/* AI 프로필 헤더 */}
        <div style={{
          position:'relative', zIndex:1,
          padding:'12px 16px 10px',
          display:'flex', alignItems:'center', gap:12,
          borderBottom:'1px solid rgba(163,177,138,0.15)',
          background:'rgba(255,255,255,0.6)',
          backdropFilter:'blur(12px)',
          WebkitBackdropFilter:'blur(12px)',
          flexShrink:0,
        }}>
          {/* Avatar with glow */}
          <div style={{
            width:42, height:42, borderRadius:'50%',
            background:`linear-gradient(135deg, ${SAGE}, ${SAGE_DARK})`,
            display:'flex', alignItems:'center', justifyContent:'center',
            flexShrink:0,
            boxShadow:`0 0 0 3px rgba(163,177,138,0.25), 0 0 14px rgba(163,177,138,0.35)`,
          }}>
            <span style={{ fontSize:20 }}>🌿</span>
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:800, color:TEXT }}>CareFlow AI</div>
            <div style={{ fontSize:10, color:SAGE, fontWeight:600, marginTop:1 }}>온라인</div>
          </div>
          {/* Online indicator */}
          <div style={{
            marginLeft:'auto',
            width:8, height:8, borderRadius:'50%',
            background:SAGE,
            boxShadow:`0 0 6px rgba(163,177,138,0.7)`,
          }}/>
        </div>

        {/* 기록된 축 태그 */}
        {allTags.length > 0 && (
          <div style={{
            position:'relative', zIndex:1,
            padding:'7px 14px', display:'flex', gap:5, flexWrap:'wrap',
            borderBottom:'1px solid rgba(163,177,138,0.1)',
            background:'rgba(255,255,255,0.5)',
            flexShrink:0,
          }}>
            {allTags.map(t => (
              <span key={t} style={{
                fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:99,
                background:`${AXIS_COLOR[t]}28`, color:AXIS_TEXT[t],
              }}>✓ {t}</span>
            ))}
          </div>
        )}

        {/* 메시지 영역 */}
        <div style={{
          position:'relative', zIndex:1,
          flex:1, overflowY:'auto', padding:'14px 14px 8px',
          display:'flex', flexDirection:'column', gap:12,
          scrollbarWidth:'none',
        }}>
          {msgs.map((m, idx) => (
            <div
              key={m.id}
              style={{
                display:'flex', flexDirection:'column',
                alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
                gap:4,
                animation:`msgIn 0.28s ease-out ${idx===0?0:0.05}s both`,
              }}
            >
              {m.role === 'ai' && (
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                  <div style={{
                    width:24, height:24, borderRadius:'50%',
                    background:`linear-gradient(135deg, ${SAGE}, ${SAGE_DARK})`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow:`0 0 0 2px rgba(163,177,138,0.2), 0 0 8px rgba(163,177,138,0.3)`,
                  }}>
                    <span style={{ fontSize:12 }}>🌿</span>
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, color:SAGE }}>CareFlow AI</span>
                </div>
              )}

              <div style={{
                maxWidth:'82%', padding:'11px 14px',
                borderRadius: m.role === 'user'
                  ? '18px 18px 4px 18px'
                  : '4px 18px 18px 18px',
                background: m.role === 'user'
                  ? `linear-gradient(135deg, ${SAGE}, ${SAGE_DARK})`
                  : 'rgba(255,255,255,0.85)',
                color: m.role === 'user' ? '#fff' : TEXT,
                fontSize:13, lineHeight:1.65, fontWeight:500,
                border: m.role === 'ai' ? '1px solid rgba(163,177,138,0.25)' : 'none',
                boxShadow: m.role === 'user'
                  ? '0 4px 16px rgba(163,177,138,0.35)'
                  : '0 4px 16px rgba(0,0,0,0.06)',
                backdropFilter: m.role === 'ai' ? 'blur(10px)' : 'none',
                WebkitBackdropFilter: m.role === 'ai' ? 'blur(10px)' : 'none',
              }}>
                {m.text}
              </div>

              {m.role === 'ai' && m.tags && m.tags.length > 0 && (
                <div style={{ display:'flex', gap:4, paddingLeft:4 }}>
                  {m.tags.map(t => (
                    <span key={t} style={{
                      fontSize:9.5, fontWeight:700, padding:'2px 7px', borderRadius:99,
                      background:`${AXIS_COLOR[t]}28`, color:AXIS_TEXT[t],
                    }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* 타이핑 인디케이터 */}
          {typing && (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{
                width:24, height:24, borderRadius:'50%',
                background:`linear-gradient(135deg, ${SAGE}, ${SAGE_DARK})`,
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:`0 0 0 2px rgba(163,177,138,0.2), 0 0 8px rgba(163,177,138,0.3)`,
              }}>
                <span style={{ fontSize:12 }}>🌿</span>
              </div>
              <div style={{
                background:'rgba(255,255,255,0.85)',
                border:'1px solid rgba(163,177,138,0.25)',
                borderRadius:'4px 18px 18px 18px',
                padding:'12px 16px',
                display:'flex', gap:5, alignItems:'center',
                boxShadow:'0 4px 16px rgba(0,0,0,0.06)',
                backdropFilter:'blur(10px)',
                WebkitBackdropFilter:'blur(10px)',
              }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width:6, height:6, borderRadius:'50%',
                    background:SAGE,
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
          position:'relative', zIndex:1,
          padding:'10px 12px 14px',
          borderTop:'1px solid rgba(163,177,138,0.12)',
          flexShrink:0,
          display:'flex', gap:8, alignItems:'flex-end',
          background:'rgba(255,255,255,0.75)',
          backdropFilter:'blur(16px)',
          WebkitBackdropFilter:'blur(16px)',
        }}>
          {/* 마이크 아이콘 버튼 */}
          <button
            style={{
              width:38, height:38, borderRadius:'50%', border:'1px solid rgba(163,177,138,0.25)', cursor:'pointer',
              background:'rgba(163,177,138,0.12)',
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0, transition:'background 0.2s',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={SAGE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="2" width="6" height="13" rx="3"/>
              <path d="M5 10a7 7 0 0 0 14 0"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
              <line x1="9" y1="22" x2="15" y2="22"/>
            </svg>
          </button>

          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="오늘 하루를 이야기해보세요..."
            rows={1}
            style={{
              flex:1, resize:'none',
              border:'1.5px solid rgba(163,177,138,0.3)',
              borderRadius:20, padding:'10px 14px',
              fontSize:13, color:TEXT,
              background:'rgba(255,255,255,0.9)',
              outline:'none', fontFamily:'inherit',
              lineHeight:1.5, maxHeight:80, overflowY:'auto',
            }}
          />

          {/* 전송 버튼 */}
          <button
            onClick={send}
            disabled={!input.trim()}
            style={{
              width:38, height:38, borderRadius:'50%', border:'none',
              cursor: input.trim() ? 'pointer' : 'default',
              background: input.trim()
                ? `linear-gradient(135deg, ${SAGE}, ${SAGE_DARK})`
                : 'rgba(163,177,138,0.2)',
              display:'flex', alignItems:'center', justifyContent:'center',
              transition:'all 0.2s', flexShrink:0,
              boxShadow: input.trim() ? '0 4px 12px rgba(163,177,138,0.4)' : 'none',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes dot { 0%,80%,100%{transform:scale(1);opacity:0.5} 40%{transform:scale(1.35);opacity:1} }
        @keyframes msgIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        textarea::placeholder { color:${TEXT_LIGHT}; }
        div::-webkit-scrollbar { display:none; }
      `}</style>
    </IPhoneFrame>
  )
}
