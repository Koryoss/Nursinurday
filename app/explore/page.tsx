'use client'

import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import IPhoneFrame from '../components/IPhoneFrame'

const SAGE      = '#A3B18A'
const TEXT      = '#2D3436'
const TEXT_MID  = '#636E72'
const TEXT_LIGHT= '#B2BEC3'

const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.70)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.85)',
  borderRadius: 24,
  boxShadow: '0 8px 32px rgba(0,0,0,0.07), 0 2px 8px rgba(0,0,0,0.04)',
}

/* ── 4축 선형 SVG 아이콘 ── */
function AxisIcon({ axisKey, color }: { axisKey: string; color: string }) {
  const s = { width:20, height:20, viewBox:'0 0 24 24', fill:'none', stroke:color, strokeWidth:2, strokeLinecap:'round' as const, strokeLinejoin:'round' as const }
  if (axisKey === 'body')     return <svg {...s}><circle cx="12" cy="6" r="3"/><path d="M12 9v6M9 15l3 3 3-3M9 12H6M18 12h-3"/></svg>
  if (axisKey === 'emotion')  return <svg {...s}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
  if (axisKey === 'relation') return <svg {...s}><circle cx="9" cy="8" r="3"/><circle cx="17" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6h2M11 20c0-3.3 2.7-6 6-6"/></svg>
  if (axisKey === 'meaning')  return <svg {...s}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  return null
}

/* ── 오른쪽 셰브론 ── */
function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT_LIGHT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  )
}

const AXES = [
  { key:'body',     label:'몸',  sub:'신체 증상 · 에너지',      color:'#F5A87C', textColor:'#7A3A0A',
    items:[
      { emoji:'👂', word:'이명',     question:'이명이 있었나요?'         },
      { emoji:'🌀', word:'어지러움', question:'어지러움이 있었나요?'      },
      { emoji:'😴', word:'피로',     question:'피로감을 느꼈나요?'        },
      { emoji:'🤕', word:'두통',     question:'두통이 있었나요?'          },
    ]},
  { key:'emotion',  label:'감정', sub:'불안 · 긴장 · 감정 기복',   color:'#EE9FB8', textColor:'#7A1A40',
    items:[
      { emoji:'😰', word:'불안',      question:'불안감을 느꼈나요?'        },
      { emoji:'😤', word:'예민·짜증', question:'예민하거나 짜증이 났나요?' },
      { emoji:'😨', word:'두려움',    question:'두려움이 있었나요?'        },
      { emoji:'🎭', word:'기분 기복', question:'기분 변화가 심했나요?'     },
    ]},
  { key:'relation', label:'관계', sub:'연결 · 고립 · 사회 참여',   color:'#B8A8D4', textColor:'#3D2878',
    items:[
      { emoji:'🤝', word:'함께함',     question:'사람들과 함께했나요?'    },
      { emoji:'🏝️', word:'고립감',     question:'고립감을 느꼈나요?'      },
      { emoji:'💭', word:'소통 어려움', question:'소통이 힘들었나요?'      },
    ]},
  { key:'meaning',  label:'의미', sub:'방향 · 성취 · 삶의 질',     color:'#E8C86E', textColor:'#6B4A00',
    items:[
      { emoji:'⭐', word:'성취감',    question:'성취감을 느꼈나요?'       },
      { emoji:'✨', word:'의미 있음', question:'하루가 의미 있었나요?'    },
      { emoji:'📌', word:'계획 실행', question:'계획한 일을 했나요?'      },
    ]},
]

const TOTAL = AXES.reduce((s,a)=>s+a.items.length, 0)

interface Bubble { id:string; text:string; x:number; y:number; color:string; textColor:string; removing:boolean }
interface Ripple  { id:string; x:number; y:number; color:string }

const TODAY = new Date().toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'short'})

export default function ExplorePage() {
  const [checked, setChecked] = useState<Record<string,boolean[]>>(
    Object.fromEntries(AXES.map(a=>[a.key, Array(a.items.length).fill(false)]))
  )
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [ripples, setRipples] = useState<Ripple[]>([])
  const [allDone, setAllDone] = useState(false)
  const phoneRef  = useRef<HTMLDivElement>(null)
  const cooldown  = useRef(false)

  const totalChecked = Object.values(checked).reduce((s,arr)=>s+arr.filter(Boolean).length, 0)
  const pct = (totalChecked/TOTAL)*100

  const handleItem = useCallback((axisKey:string, idx:number, e:React.MouseEvent) => {
    if (cooldown.current || checked[axisKey][idx]) return
    cooldown.current = true
    setTimeout(()=>{ cooldown.current = false }, 350)

    const phoneRect = phoneRef.current?.getBoundingClientRect()
    const btnRect   = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = btnRect.left + btnRect.width/2  - (phoneRect?.left ?? 0)
    const y = btnRect.top  + btnRect.height/2 - (phoneRect?.top  ?? 0)

    const axis = AXES.find(a=>a.key===axisKey)!

    const rid = Date.now().toString()
    setRipples(r=>[...r,{id:rid,x,y,color:axis.color}])
    setTimeout(()=>setRipples(r=>r.filter(p=>p.id!==rid)), 900)

    const newChecked = {...checked,[axisKey]:checked[axisKey].map((v,i)=>i===idx?true:v)}
    setChecked(newChecked)
    const newTotal = Object.values(newChecked).reduce((s,arr)=>s+arr.filter(Boolean).length,0)
    if (newTotal>=TOTAL) setTimeout(()=>setAllDone(true),600)

    const id = `${Date.now()}-${Math.random()}`
    setBubbles(prev=>[...prev.slice(-4),{id,text:axis.items[idx].question,x,y,color:axis.color,textColor:axis.textColor,removing:false}])
    setTimeout(()=>{
      setBubbles(prev=>prev.map(b=>b.id===id?{...b,removing:true}:b))
      setTimeout(()=>setBubbles(prev=>prev.filter(b=>b.id!==id)),700)
    },3200)
  },[checked])

  return (
    <div style={{minHeight:'100dvh',background:'linear-gradient(160deg,#E8EDE4,#F0F4EE,#EAF0E8)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px 16px',fontFamily:"-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif"}}>
      <div ref={phoneRef} style={{width:390,height:844,borderRadius:54,background:'linear-gradient(160deg,#F0F4EE 0%,#F8F9FA 100%)',border:'1.5px solid rgba(255,255,255,0.9)',boxShadow:'0 40px 100px rgba(0,0,0,0.13),0 8px 32px rgba(163,177,138,0.12),inset 0 1px 0 rgba(255,255,255,0.95)',position:'relative',overflow:'hidden',display:'flex',flexDirection:'column',userSelect:'none'}}>

        {/* Dynamic Island */}
        <div style={{position:'absolute',top:14,left:'50%',transform:'translateX(-50%)',width:120,height:36,background:'#1C1C1E',borderRadius:18,zIndex:20,pointerEvents:'none'}}/>

        {/* 상태바 */}
        <div style={{height:56,flexShrink:0,display:'flex',alignItems:'flex-end',justifyContent:'space-between',padding:'0 28px 8px',zIndex:10}}>
          <span style={{fontSize:15,fontWeight:600,color:TEXT}}>9:41</span>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <svg width="17" height="12" viewBox="0 0 17 12" fill={TEXT}>
              <rect x="0" y="4" width="3" height="8" rx="1" opacity="0.35"/>
              <rect x="4.5" y="2.5" width="3" height="9.5" rx="1" opacity="0.55"/>
              <rect x="9" y="1" width="3" height="11" rx="1"/>
              <rect x="13.5" y="0" width="3" height="12" rx="1"/>
            </svg>
            <div style={{display:'flex',alignItems:'center',gap:1}}>
              <div style={{width:24,height:12,border:'1.5px solid rgba(45,52,54,0.4)',borderRadius:3,padding:'2px',display:'flex',alignItems:'center'}}>
                <div style={{height:'100%',width:'75%',background:TEXT,borderRadius:1}}/>
              </div>
              <div style={{width:2,height:6,background:'rgba(45,52,54,0.35)',borderRadius:'0 1px 1px 0'}}/>
            </div>
          </div>
        </div>

        {/* 헤더 */}
        <div style={{padding:'0 22px 14px',flexShrink:0,borderBottom:'1px solid rgba(163,177,138,0.15)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:7}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:SAGE,animation:'cfPulse 2s infinite'}}/>
                <span style={{fontSize:20,fontWeight:800,color:TEXT}}>CareFlow</span>
              </div>
              <div style={{fontSize:11,color:TEXT_MID,marginTop:3}}>{TODAY} · {allDone?'기록 완료 🎉':`${totalChecked}/${TOTAL} 항목`}</div>
            </div>
            <div style={{display:'flex',gap:4}}>
              {AXES.map(a=>{
                const cnt=checked[a.key].filter(Boolean).length
                const done=cnt===a.items.length
                return <div key={a.key} style={{width:8,height:8,borderRadius:'50%',background:done?a.color:cnt>0?`${a.color}70`:'rgba(0,0,0,0.08)',transition:'all 0.4s',boxShadow:done?`0 0 5px ${a.color}`:'none'}}/>
              })}
            </div>
          </div>

          {/* 진행 바 */}
          <div style={{marginTop:10,height:4,background:'rgba(163,177,138,0.12)',borderRadius:2,overflow:'hidden'}}>
            <motion.div animate={{width:`${pct}%`}} transition={{duration:0.5,ease:'easeOut'}} style={{height:'100%',background:`linear-gradient(90deg,${SAGE},#7AC9A0)`,borderRadius:2}}/>
          </div>
        </div>

        {/* 체크리스트 */}
        <div style={{flex:1,overflowY:'auto',padding:'12px 16px',display:'flex',flexDirection:'column',gap:10,scrollbarWidth:'none'}}>
          {AXES.map((a,ai)=>{
            const cnt=checked[a.key].filter(Boolean).length
            const done=cnt===a.items.length
            return (
              <div key={a.key} style={{...GLASS,overflow:'hidden',borderLeft:`3px solid ${a.color}`,boxShadow:done?`0 0 0 1.5px ${a.color}50, 0 8px 32px rgba(0,0,0,0.07)`:'0 8px 32px rgba(0,0,0,0.07)'}}>
                {/* 축 헤더 */}
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px 8px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <AxisIcon axisKey={a.key} color={a.color}/>
                    <span style={{fontSize:13,fontWeight:800,color:a.textColor}}>{a.label}</span>
                    <span style={{fontSize:10,color:TEXT_LIGHT}}>{a.sub}</span>
                  </div>
                  <span style={{fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:99,background:done?`${a.color}25`:'rgba(0,0,0,0.05)',color:done?a.textColor:TEXT_LIGHT}}>
                    {done?'✓ 완료':`${cnt}/${a.items.length}`}
                  </span>
                </div>

                {/* 항목 리스트 */}
                <div style={{borderTop:'1px solid rgba(0,0,0,0.04)'}}>
                  {a.items.map((item,i)=>{
                    const isChecked=checked[a.key][i]
                    return (
                      <motion.div
                        key={i}
                        onClick={e=>handleItem(a.key,i,e)}
                        whileTap={isChecked?{}:{scale:0.98}}
                        transition={{type:'spring',stiffness:400,damping:20}}
                        style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderBottom:i<a.items.length-1?'1px solid rgba(0,0,0,0.04)':'none',cursor:isChecked?'default':'pointer',background:isChecked?`${a.color}10`:'transparent',transition:'background 0.3s'}}
                      >
                        <span style={{fontSize:13,fontWeight:800,color:isChecked?a.color:'#D0D8DC',width:15,textAlign:'center',flexShrink:0,transition:'color 0.3s'}}>
                          {isChecked?'✓':'○'}
                        </span>
                        <span style={{fontSize:17,flexShrink:0}}>{item.emoji}</span>
                        <span style={{fontSize:12,fontWeight:isChecked?600:400,color:isChecked?TEXT:TEXT_LIGHT,flex:1,transition:'all 0.3s'}}>
                          {item.word}
                        </span>
                        {!isChecked && <Chevron/>}
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* 완료 카드 */}
          {allDone && (
            <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} style={{...GLASS,padding:'18px',textAlign:'center'}}>
              <div style={{fontSize:30,marginBottom:8}}>🎉</div>
              <div style={{fontSize:14,fontWeight:800,color:TEXT,marginBottom:4}}>오늘 기록 완료!</div>
              <div style={{fontSize:11,color:TEXT_MID,lineHeight:1.7,marginBottom:14}}>{TOTAL}개 항목이 모두 기록됐어요.</div>
              <Link href="/dashboard" style={{background:SAGE,color:'#fff',fontSize:12,fontWeight:700,padding:'9px 22px',borderRadius:99,textDecoration:'none',display:'inline-block'}}>
                대시보드 보기 →
              </Link>
            </motion.div>
          )}
          <div style={{height:8}}/>
        </div>

        {/* 플로팅 버블 */}
        {bubbles.map(b=>(
          <div key={b.id} style={{position:'absolute',left:b.x,top:b.y,transform:'translateX(-50%)',pointerEvents:'none',zIndex:30,animation:b.removing?'cfOut 0.7s ease-out forwards':'cfFloat 3.9s ease-out forwards'}}>
            <div style={{background:'rgba(255,255,255,0.92)',backdropFilter:'blur(12px)',border:`1.5px solid ${b.color}`,borderRadius:14,padding:'8px 13px',boxShadow:`0 6px 24px rgba(0,0,0,0.10),0 0 0 4px ${b.color}15`,maxWidth:210}}>
              <div style={{fontSize:9.5,fontWeight:700,color:b.textColor,opacity:0.7,marginBottom:3}}>기록됨</div>
              <div style={{fontSize:12.5,color:TEXT,fontWeight:700,lineHeight:1.5}}>✓ {b.text}</div>
            </div>
            <div style={{width:0,height:0,borderLeft:'6px solid transparent',borderRight:'6px solid transparent',borderTop:`6px solid ${b.color}`,margin:'0 auto'}}/>
          </div>
        ))}

        {/* 리플 */}
        {ripples.map(r=>(
          <div key={r.id} style={{position:'absolute',left:r.x,top:r.y,transform:'translate(-50%,-50%)',width:56,height:56,borderRadius:'50%',border:`2px solid ${r.color}`,animation:'cfRipple 0.9s ease-out forwards',pointerEvents:'none',zIndex:25}}/>
        ))}

        {/* 탭 바 */}
        <div style={{flexShrink:0,padding:'10px 0 30px',borderTop:'1px solid rgba(163,177,138,0.15)',display:'grid',gridTemplateColumns:'repeat(4,1fr)',background:'rgba(255,255,255,0.85)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)'}}>
          {[{label:'기록',href:'/explore'},{label:'알림',href:'/notification'},{label:'채팅',href:'/chat'},{label:'대시보드',href:'/dashboard'}].map(tab=>{
            const active=tab.href==='/explore'
            const c=active?SAGE:TEXT_LIGHT
            const sw=1.8
            let icon=null
            if(tab.label==='기록')     icon=<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="12" y2="16"/></svg>
            if(tab.label==='알림')     icon=<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            if(tab.label==='채팅')     icon=<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            if(tab.label==='대시보드') icon=<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            return (
              <Link key={tab.label} href={tab.href} style={{textDecoration:'none',display:'flex',flexDirection:'column',alignItems:'center',gap:3,paddingTop:2}}>
                {icon}
                <span style={{fontSize:10,fontWeight:active?700:500,color:active?SAGE:TEXT_LIGHT}}>{tab.label}</span>
                {active&&<div style={{width:4,height:4,borderRadius:2,background:SAGE}}/>}
              </Link>
            )
          })}
        </div>

        <style>{`
          @keyframes cfPulse{0%,100%{opacity:1}50%{opacity:.3}}
          @keyframes cfRipple{0%{opacity:.7;transform:translate(-50%,-50%) scale(0)}100%{opacity:0;transform:translate(-50%,-50%) scale(3)}}
          @keyframes cfFloat{0%{opacity:0;transform:translateX(-50%) translateY(6px)}12%{opacity:1;transform:translateX(-50%) translateY(0)}78%{opacity:1;transform:translateX(-50%) translateY(-26px)}100%{opacity:0;transform:translateX(-50%) translateY(-46px)}}
          @keyframes cfOut{0%{opacity:1;transform:translateX(-50%) translateY(-26px)}100%{opacity:0;transform:translateX(-50%) translateY(-52px)}}
          div::-webkit-scrollbar{display:none}
        `}</style>
      </div>
    </div>
  )
}
