'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

/* ── 디자인 토큰 ─────────────────────────── */
const SAGE       = '#A3B18A'
const SAGE_DARK  = '#7A9E6A'
const CLOUD      = '#F8F9FA'
const GOLD       = '#D4AF37'
const TEXT       = '#2D3436'
const TEXT_MID   = '#636E72'
const TEXT_LIGHT = '#B2BEC3'

const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.70)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.85)',
  borderRadius: 24,
  boxShadow: '0 8px 32px rgba(0,0,0,0.07), 0 2px 8px rgba(0,0,0,0.04)',
}

/* ── 데이터 ──────────────────────────────── */
const AXES = [
  { key:'body',     label:'몸',  sub:'신체 증상 · 에너지',      color:'#F5A87C', textColor:'#7A3A0A',
    items:[ {emoji:'👂',question:'이명이 있었나요?',checked:true}, {emoji:'🌀',question:'어지러움이 있었나요?',checked:true}, {emoji:'😴',question:'피로감을 느꼈나요?',checked:true}, {emoji:'🤕',question:'두통이 있었나요?',checked:false} ], score:3, max:4 },
  { key:'emotion',  label:'감정', sub:'불안 · 긴장 · 감정 기복',   color:'#EE9FB8', textColor:'#7A1A40',
    items:[ {emoji:'😰',question:'불안감을 느꼈나요?',checked:true}, {emoji:'😤',question:'예민하거나 짜증이 났나요?',checked:true}, {emoji:'😨',question:'두려움이 있었나요?',checked:true}, {emoji:'🎭',question:'기분 변화가 심했나요?',checked:true} ], score:4, max:4 },
  { key:'relation', label:'관계', sub:'연결 · 고립 · 사회 참여',   color:'#B8A8D4', textColor:'#3D2878',
    items:[ {emoji:'🤝',question:'사람들과 함께했나요?',checked:false}, {emoji:'🏝️',question:'고립감을 느꼈나요?',checked:true}, {emoji:'💭',question:'소통이 힘들었나요?',checked:false} ], score:1, max:3 },
  { key:'meaning',  label:'의미', sub:'방향 · 성취 · 삶의 질',     color:'#E8C86E', textColor:'#6B4A00',
    items:[ {emoji:'⭐',question:'성취감을 느꼈나요?',checked:true}, {emoji:'✨',question:'하루가 의미 있었나요?',checked:false}, {emoji:'📌',question:'계획한 일을 했나요?',checked:true} ], score:2, max:3 },
]

const TOTAL_SCORE = AXES.reduce((s,a)=>s+a.score, 0)
const TOTAL_MAX   = AXES.reduce((s,a)=>s+a.max, 0)

const WEEK = [
  {day:'월',date:13,done:true, dots:['#F5A87C','#EE9FB8']},
  {day:'화',date:14,done:false,dots:[]},
  {day:'수',date:15,done:true, dots:['#EE9FB8','#E8C86E']},
  {day:'목',date:16,done:true, dots:['#F5A87C']},
  {day:'금',date:17,done:true, dots:['#EE9FB8','#B8A8D4']},
  {day:'토',date:18,done:false,dots:[]},
  {day:'일',date:19,done:true, dots:['#F5A87C','#EE9FB8'],today:true},
]

const TABS = [
  {label:'기록',    href:'/explore'},
  {label:'알림',    href:'/notification'},
  {label:'채팅',    href:'/chat'},
  {label:'대시보드',href:'/dashboard'},
]

const TODAY_STR = new Date().toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'short'})

/* ── Liquid Blob path ────────────────────── */
function blobPath(scores:number[], maxes:number[], wobble=0) {
  const cx=100, cy=100, minR=32, maxR=72
  const r = scores.map((s,i)=> minR + (maxR-minR)*(s/maxes[i]) + wobble)
  const top   =[cx,        cy-r[0]]
  const right =[cx+r[1],   cy     ]
  const bot   =[cx,        cy+r[2]]
  const left  =[cx-r[3],   cy     ]
  const t = 38
  return `M ${top[0]},${top[1]}
    C ${top[0]+t},${top[1]}   ${right[0]},${right[1]-t} ${right[0]},${right[1]}
    C ${right[0]},${right[1]+t} ${bot[0]+t},${bot[1]}   ${bot[0]},${bot[1]}
    C ${bot[0]-t},${bot[1]}   ${left[0]},${left[1]+t}  ${left[0]},${left[1]}
    C ${left[0]},${left[1]-t} ${top[0]-t},${top[1]}    ${top[0]},${top[1]} Z`
}

function TabIcon({label,active}:{label:string;active:boolean}) {
  const c = active ? SAGE : TEXT_LIGHT
  const s = 1.8
  if (label==='기록')     return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={s} strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="12" y2="16"/></svg>
  if (label==='알림')     return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={s} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
  if (label==='채팅')     return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={s} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  if (label==='대시보드') return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={s} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
  return null
}

/* ══════════════════════════════════════════ */
export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(()=>{ setMounted(true) },[])

  const p1 = blobPath(AXES.map(a=>a.score), AXES.map(a=>a.max), 0)
  const p2 = blobPath(AXES.map(a=>a.score), AXES.map(a=>a.max), 3)

  return (
    <div style={{ minHeight:'100dvh', background:'linear-gradient(160deg,#E8EDE4,#F0F4EE,#EAF0E8)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px 16px', fontFamily:"-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif" }}>

      <div style={{ width:390, height:844, borderRadius:54, background:'linear-gradient(160deg,#EEF2EB 0%,#F8F9FA 55%,#F0F4EE 100%)', border:'1.5px solid rgba(255,255,255,0.9)', boxShadow:'0 40px 100px rgba(0,0,0,0.13),0 8px 32px rgba(163,177,138,0.12),inset 0 1px 0 rgba(255,255,255,0.95)', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column', userSelect:'none' }}>

        {/* 배경 글로우 오브 */}
        <div style={{position:'absolute',top:-50,right:-30,width:200,height:200,borderRadius:'50%',background:'rgba(163,177,138,0.10)',filter:'blur(60px)',pointerEvents:'none',zIndex:0}}/>
        <div style={{position:'absolute',bottom:80,left:-50,width:180,height:180,borderRadius:'50%',background:'rgba(212,175,55,0.07)',filter:'blur(50px)',pointerEvents:'none',zIndex:0}}/>

        {/* Dynamic Island */}
        <div style={{position:'absolute',top:14,left:'50%',transform:'translateX(-50%)',width:120,height:36,background:'#1C1C1E',borderRadius:18,zIndex:20}}/>

        {/* 상태바 */}
        <div style={{height:56,flexShrink:0,display:'flex',alignItems:'flex-end',justifyContent:'space-between',padding:'0 28px 8px',zIndex:10,position:'relative'}}>
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
        <div style={{padding:'0 20px 14px',flexShrink:0,borderBottom:'1px solid rgba(163,177,138,0.15)',position:'relative',zIndex:10}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:7}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:SAGE,animation:'cfPulse 2s infinite'}}/>
                <span style={{fontSize:20,fontWeight:800,color:TEXT}}>CareFlow</span>
              </div>
              <div style={{fontSize:11,color:TEXT_MID,marginTop:3}}>{TODAY_STR} · 대시보드</div>
            </div>
            <div style={{...GLASS,padding:'6px 14px',borderRadius:99}}>
              <span style={{fontSize:12,fontWeight:700,color:SAGE}}>{TOTAL_SCORE}<span style={{color:TEXT_LIGHT,fontWeight:500}}>/{TOTAL_MAX} 기록</span></span>
            </div>
          </div>
        </div>

        {/* 스크롤 콘텐츠 */}
        <div style={{flex:1,overflowY:'auto',padding:'14px 20px 8px',display:'flex',flexDirection:'column',gap:12,scrollbarWidth:'none',position:'relative',zIndex:10}}>

          {/* ① 오늘의 통찰 */}
          <motion.div initial={{opacity:0,y:14}} animate={{opacity:mounted?1:0,y:mounted?0:14}} transition={{duration:0.45}} style={{...GLASS,padding:'14px 16px'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
              <div style={{width:40,height:40,borderRadius:14,background:`rgba(163,177,138,0.18)`,border:`1px solid rgba(163,177,138,0.3)`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <span style={{fontSize:18}}>🌿</span>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:10,fontWeight:700,color:SAGE,letterSpacing:0.8,textTransform:'uppercase',marginBottom:4}}>오늘의 통찰</div>
                <div style={{fontSize:12.5,color:TEXT,lineHeight:1.65,fontWeight:500}}>
                  오늘 감정 기복이 많았던 것 같아요. 잠시 조용한 곳에서 귀를 쉬게 해보세요.
                </div>
              </div>
            </div>
            <div style={{marginTop:10,padding:'8px 12px',background:`rgba(212,175,55,0.08)`,borderRadius:12,border:`1px solid rgba(212,175,55,0.2)`,display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:14}}>🔊</span>
              <span style={{fontSize:11,color:'#A08020',fontWeight:500}}>주변이 다소 소란스럽네요, 귀를 쉬게 해주세요 <span style={{opacity:0.7}}>(62dB)</span></span>
            </div>
          </motion.div>

          {/* ② 액체형 차트 */}
          <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:mounted?1:0,scale:mounted?1:0.95}} transition={{duration:0.5,delay:0.08,ease:[0.34,1.56,0.64,1]}} style={{...GLASS,padding:'16px'}}>
            <div style={{fontSize:10,fontWeight:700,color:TEXT_MID,letterSpacing:0.8,textTransform:'uppercase',marginBottom:12}}>4축 밸런스</div>
            <div style={{display:'flex',justifyContent:'center'}}>
              <div style={{position:'relative',width:170,height:170}}>
                <svg width="170" height="170" viewBox="-10 -10 220 220" overflow="visible">
                  {/* 배경 그리드 */}
                  {[20,40,60].map(r=><circle key={r} cx="100" cy="100" r={r} fill="none" stroke="rgba(163,177,138,0.15)" strokeWidth="1"/>)}
                  <line x1="100" y1="35" x2="100" y2="165" stroke="rgba(163,177,138,0.12)" strokeWidth="1"/>
                  <line x1="35"  y1="100" x2="165" y2="100" stroke="rgba(163,177,138,0.12)" strokeWidth="1"/>

                  {/* 액체 블롭 */}
                  <path fill={`rgba(163,177,138,0.18)`} stroke={`rgba(163,177,138,0.55)`} strokeWidth="1.5">
                    <animate attributeName="d" dur="4s" repeatCount="indefinite"
                      values={`${p1};${p2};${p1}`}
                      calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                  </path>

                  {/* 중앙 Sage 구 */}
                  <defs>
                    <radialGradient id="sphere" cx="38%" cy="35%">
                      <stop offset="0%" stopColor="#C8D8B8"/>
                      <stop offset="100%" stopColor={SAGE_DARK}/>
                    </radialGradient>
                    <filter id="glow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                  </defs>
                  <circle cx="100" cy="100" r="22" fill="url(#sphere)" filter="url(#glow)">
                    <animate attributeName="r" values="22;24;22" dur="3s" repeatCount="indefinite"/>
                  </circle>

                  {/* 축 끝점 */}
                  {AXES.map((a,i)=>{
                    const r = 32+(72-32)*(a.score/a.max)
                    const pos=[[100,100-r],[100+r,100],[100,100+r],[100-r,100]][i]
                    return <circle key={a.key} cx={pos[0]} cy={pos[1]} r="5.5" fill={a.color} opacity="0.9" style={{filter:`drop-shadow(0 0 4px ${a.color})`}}/>
                  })}

                  {/* 레이블 */}
                  {[['몸','#F5A87C',100,22],['감정','#EE9FB8',188,100],['관계','#B8A8D4',100,186],['의미','#E8C86E',12,100]].map(([l,c,x,y])=>(
                    <text key={l as string} x={x as number} y={y as number} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="700" fill={c as string}>{l as string}</text>
                  ))}
                </svg>
              </div>
            </div>

            {/* 점수 바 */}
            <div style={{display:'flex',flexDirection:'column',gap:7,marginTop:14}}>
              {AXES.map((a,i)=>(
                <div key={a.key} style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:11,fontWeight:700,color:TEXT,width:24}}>{a.label}</span>
                  <div style={{flex:1,height:4,background:'rgba(163,177,138,0.12)',borderRadius:2,overflow:'hidden'}}>
                    <motion.div initial={{width:0}} animate={{width:`${(a.score/a.max)*100}%`}} transition={{duration:0.9,delay:0.3+i*0.08,ease:[0.34,1.56,0.64,1]}} style={{height:'100%',background:a.color,borderRadius:2}}/>
                  </div>
                  <span style={{fontSize:11,fontWeight:700,color:a.color,width:24,textAlign:'right'}}>{a.score}/{a.max}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ③ 4축 체크리스트 */}
          <motion.div initial={{opacity:0,y:14}} animate={{opacity:mounted?1:0,y:mounted?0:14}} transition={{duration:0.45,delay:0.15}} style={{display:'flex',flexDirection:'column',gap:8}}>
            <div style={{fontSize:10,fontWeight:700,color:TEXT_MID,letterSpacing:0.8,textTransform:'uppercase'}}>오늘의 4축 기록</div>
            {AXES.map((a,ai)=>(
              <motion.div key={a.key} whileTap={{scale:0.97}} transition={{type:'spring',stiffness:400,damping:18}} style={{...GLASS,padding:'12px 14px',borderLeft:`3px solid ${a.color}`}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                  <div>
                    <span style={{fontSize:13,fontWeight:800,color:a.textColor}}>{a.label}</span>
                    <span style={{fontSize:10,color:TEXT_LIGHT,marginLeft:6}}>{a.sub}</span>
                  </div>
                  <motion.span animate={{scale:1}} style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:99,background:`${a.color}22`,color:a.textColor,border:`1px solid ${a.color}35`}}>
                    {a.score}/{a.max}
                  </motion.span>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:5,borderTop:'1px solid rgba(0,0,0,0.04)',paddingTop:9}}>
                  {a.items.map((item,i)=>(
                    <motion.div key={i} initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}} transition={{delay:0.2+ai*0.05+i*0.04,type:'spring',stiffness:280}} style={{display:'flex',alignItems:'center',gap:9,padding:'7px 10px',borderRadius:12,background:item.checked?`${a.color}14`:'rgba(0,0,0,0.02)',border:`1px solid ${item.checked?a.color+'30':'rgba(0,0,0,0.04)'}`}}>
                      <span style={{fontSize:13,fontWeight:800,color:item.checked?a.color:'#C8D0D3',width:14,textAlign:'center',flexShrink:0}}>{item.checked?'✓':'○'}</span>
                      <span style={{fontSize:16,flexShrink:0}}>{item.emoji}</span>
                      <span style={{fontSize:12,fontWeight:item.checked?600:400,color:item.checked?TEXT:TEXT_LIGHT,flex:1}}>{item.question}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* ④ 주간 스트립 */}
          <motion.div initial={{opacity:0,y:14}} animate={{opacity:mounted?1:0,y:mounted?0:14}} transition={{duration:0.45,delay:0.22}} style={{...GLASS,padding:'14px 12px'}}>
            <div style={{fontSize:10,fontWeight:700,color:TEXT_MID,letterSpacing:0.8,textTransform:'uppercase',marginBottom:12}}>이번 주</div>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              {WEEK.map(d=>(
                <div key={d.date} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,flex:1}}>
                  <span style={{fontSize:9.5,fontWeight:600,color:d.today?SAGE:TEXT_LIGHT}}>{d.day}</span>
                  <motion.div whileTap={{scale:0.88}} style={{width:30,height:30,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',background:d.today?SAGE:d.done?`rgba(163,177,138,0.15)`:'transparent',border:d.today?'none':d.done?`1.5px solid rgba(163,177,138,0.4)`:`1.5px dashed rgba(0,0,0,0.10)`,boxShadow:d.today?`0 0 12px rgba(163,177,138,0.5)`:'none'}}>
                    <span style={{fontSize:10,fontWeight:700,color:d.today?'#fff':d.done?SAGE_DARK:TEXT_LIGHT}}>{d.date}</span>
                  </motion.div>
                  <div style={{display:'flex',gap:2}}>
                    {d.dots.map((c,i)=><div key={i} style={{width:4,height:4,borderRadius:'50%',background:c}}/>)}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ⑤ 월간 통계 */}
          <motion.div initial={{opacity:0,y:14}} animate={{opacity:mounted?1:0,y:mounted?0:14}} transition={{duration:0.45,delay:0.28}} style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,paddingBottom:4}}>
            {[{val:'11일',label:'기록한 날',color:SAGE},{val:'3일',label:'🔥 연속',color:'#E8915A'},{val:'감정',label:'주요 축',color:'#EE9FB8'}].map(s=>(
              <motion.div key={s.label} whileTap={{scale:0.93}} transition={{type:'spring',stiffness:400,damping:15}} style={{...GLASS,padding:'14px 8px',textAlign:'center',cursor:'pointer'}}>
                <div style={{fontSize:20,fontWeight:800,color:s.color}}>{s.val}</div>
                <div style={{fontSize:9.5,color:TEXT_LIGHT,marginTop:4}}>{s.label}</div>
              </motion.div>
            ))}
          </motion.div>

        </div>

        {/* Floating Bottom Tab Bar */}
        <div style={{flexShrink:0,margin:'0 12px 18px',borderRadius:28,background:'rgba(255,255,255,0.82)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.9)',boxShadow:'0 4px 20px rgba(0,0,0,0.07)',display:'grid',gridTemplateColumns:'repeat(4,1fr)',padding:'10px 4px 14px',zIndex:20,position:'relative'}}>
          {TABS.map(tab=>{
            const active=tab.href==='/dashboard'
            return (
              <Link key={tab.label} href={tab.href} style={{textDecoration:'none',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                <motion.div whileTap={{scale:0.85}} transition={{type:'spring',stiffness:500,damping:15}} style={{width:44,height:28,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',background:active?`rgba(163,177,138,0.18)`:'transparent',border:active?`1px solid rgba(163,177,138,0.3)`:'1px solid transparent'}}>
                  <TabIcon label={tab.label} active={active}/>
                </motion.div>
                <span style={{fontSize:9.5,fontWeight:active?700:500,color:active?SAGE:TEXT_LIGHT}}>{tab.label}</span>
              </Link>
            )
          })}
        </div>

      </div>

      <style>{`
        @keyframes cfPulse{0%,100%{opacity:1}50%{opacity:.3}}
        div::-webkit-scrollbar{display:none}
      `}</style>
    </div>
  )
}
