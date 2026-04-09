'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion'
import Link from 'next/link'

/* ── 데이터 ──────────────────────────────── */
const AXES = [
  { key:'body',     label:'몸',  sub:'신체 증상 · 에너지',   color:'#F5A87C', textColor:'#7A3A0A', glow:'rgba(245,168,124,0.45)', items:['이명','어지러움','피로','두통'],       checked:[true,true,true,false],  score:3, max:4  },
  { key:'emotion',  label:'감정', sub:'불안 · 긴장 · 감정 기복', color:'#EE9FB8', textColor:'#7A1A40', glow:'rgba(238,159,184,0.45)', items:['불안','예민·짜증','두려움','기분기복'],  checked:[true,true,true,true],   score:4, max:4  },
  { key:'relation', label:'관계', sub:'연결 · 고립 · 사회 참여', color:'#B8A8D4', textColor:'#3D2878', glow:'rgba(184,168,212,0.45)', items:['함께함','고립감','소통어려움'],       checked:[false,true,false],      score:1, max:3  },
  { key:'meaning',  label:'의미', sub:'방향 · 성취 · 삶의 질',  color:'#E8C86E', textColor:'#6B4A00', glow:'rgba(232,200,110,0.45)', items:['성취감','의미있음','계획실행'],       checked:[true,false,true],       score:2, max:3  },
]
const TOTAL_SCORE = AXES.reduce((s,a)=>s+a.score,0)   // 10
const TOTAL_MAX   = AXES.reduce((s,a)=>s+a.max,0)     // 14

const WEEK = [
  { day:'월', date:13, done:true,  dots:['#F5A87C','#EE9FB8'] },
  { day:'화', date:14, done:false, dots:[] },
  { day:'수', date:15, done:true,  dots:['#EE9FB8','#E8C86E'] },
  { day:'목', date:16, done:true,  dots:['#F5A87C'] },
  { day:'금', date:17, done:true,  dots:['#EE9FB8','#B8A8D4'] },
  { day:'토', date:18, done:false, dots:[] },
  { day:'일', date:19, done:true,  dots:['#F5A87C','#EE9FB8'], today:true },
]

// 감정 비율로 배경 결정: 감정 score높고 관계 낮으면 cool
const emotionRatio = AXES[1].score / AXES[1].max  // 1.0 = all anxious
const BG = emotionRatio >= 0.75
  ? 'linear-gradient(160deg,#2D1B4E 0%,#1a3a5c 60%,#0f2a3a 100%)'   // deep blue (안정 필요)
  : 'linear-gradient(160deg,#3D2B1F 0%,#5B3A28 50%,#7A5038 100%)'    // warm (보통)

const TODAY_STR = new Date().toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'short'})

/* ── 탭 ─────────────────────────────────── */
const TABS = [
  { icon:'📋', label:'기록',     href:'/explore'      },
  { icon:'🔔', label:'알림',     href:'/notification' },
  { icon:'💬', label:'채팅',     href:'/chat'         },
  { icon:'📊', label:'대시보드', href:'/dashboard'    },
]

/* ── Blob SVG 계산 ───────────────────────── */
function buildBlobPath(scores: number[], maxes: number[]) {
  const cx=100, cy=100
  const base=28, range=42
  const rs = scores.map((s,i)=> base + range*(s/maxes[i]))
  // top(몸) right(감정) bottom(관계) left(의미)
  const pts = [
    [cx,       cy-rs[0]],  // 상 몸
    [cx+rs[1], cy      ],  // 우 감정
    [cx,       cy+rs[2]],  // 하 관계
    [cx-rs[3], cy      ],  // 좌 의미
  ]
  const t=38
  return `M ${pts[0][0]},${pts[0][1]}
    C ${pts[0][0]+t},${pts[0][1]}   ${pts[1][0]},${pts[1][1]-t}  ${pts[1][0]},${pts[1][1]}
    C ${pts[1][0]},${pts[1][1]+t}   ${pts[2][0]+t},${pts[2][1]}  ${pts[2][0]},${pts[2][1]}
    C ${pts[2][0]-t},${pts[2][1]}   ${pts[3][0]},${pts[3][1]+t}  ${pts[3][0]},${pts[3][1]}
    C ${pts[3][0]},${pts[3][1]-t}   ${pts[0][0]-t},${pts[0][1]}  ${pts[0][0]},${pts[0][1]} Z`
}

/* ── GLASS 카드 스타일 ────────────────────── */
const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.10)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.20)',
  borderRadius: 24,
  boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
}

const GLASS_WARM: React.CSSProperties = {
  ...GLASS,
  background: 'rgba(255,255,255,0.13)',
}

/* ══════════════════════════════════════════ */
export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const [tappedAxis, setTappedAxis] = useState<string|null>(null)
  const blobPath = buildBlobPath(AXES.map(a=>a.score), AXES.map(a=>a.max))

  useEffect(()=>{ setMounted(true) },[])

  const handleAxisTap = (key:string) => {
    setTappedAxis(key)
    setTimeout(()=>setTappedAxis(null), 400)
  }

  return (
    <div style={{ minHeight:'100dvh', background:'linear-gradient(145deg,#EDE0CC,#E8D8C0)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px 16px', fontFamily:"-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif" }}>

      {/* ── 아이폰 프레임 ── */}
      <div style={{ width:390, height:844, borderRadius:54, border:'2px solid rgba(255,255,255,0.15)', boxShadow:'0 60px 120px rgba(0,0,0,0.35)', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column', userSelect:'none' }}>

        {/* 동적 배경 */}
        <div style={{ position:'absolute', inset:0, background:BG, transition:'background 1.5s ease', zIndex:0 }} />

        {/* 배경 글로우 오브 */}
        <div style={{ position:'absolute', top:-60, right:-40, width:220, height:220, borderRadius:'50%', background: emotionRatio>=0.75 ? 'rgba(100,120,255,0.12)' : 'rgba(245,168,124,0.12)', filter:'blur(60px)', pointerEvents:'none', zIndex:1 }} />
        <div style={{ position:'absolute', bottom:80, left:-60, width:200, height:200, borderRadius:'50%', background:'rgba(91,168,138,0.10)', filter:'blur(50px)', pointerEvents:'none', zIndex:1 }} />

        {/* Dynamic Island */}
        <div style={{ position:'absolute', top:14, left:'50%', transform:'translateX(-50%)', width:120, height:36, background:'#000', borderRadius:18, zIndex:20 }} />

        {/* 상태바 */}
        <div style={{ height:56, flexShrink:0, display:'flex', alignItems:'flex-end', justifyContent:'space-between', padding:'0 28px 8px', zIndex:10, position:'relative' }}>
          <span style={{ fontSize:15, fontWeight:600, color:'rgba(255,255,255,0.9)' }}>9:41</span>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            <svg width="17" height="12" viewBox="0 0 17 12" fill="rgba(255,255,255,0.9)">
              <rect x="0" y="4" width="3" height="8" rx="1" opacity="0.4"/>
              <rect x="4.5" y="2.5" width="3" height="9.5" rx="1" opacity="0.6"/>
              <rect x="9" y="1" width="3" height="11" rx="1"/>
              <rect x="13.5" y="0" width="3" height="12" rx="1"/>
            </svg>
            <div style={{ display:'flex', alignItems:'center', gap:1 }}>
              <div style={{ width:24, height:12, border:'1.5px solid rgba(255,255,255,0.5)', borderRadius:3, padding:'2px', display:'flex', alignItems:'center' }}>
                <div style={{ height:'100%', width:'75%', background:'rgba(255,255,255,0.9)', borderRadius:1 }} />
              </div>
              <div style={{ width:2, height:6, background:'rgba(255,255,255,0.4)', borderRadius:'0 1px 1px 0' }} />
            </div>
          </div>
        </div>

        {/* 헤더 */}
        <div style={{ padding:'0 20px 16px', flexShrink:0, position:'relative', zIndex:10 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:'#5BA88A', boxShadow:'0 0 8px #5BA88A', animation:'glow 2s ease-in-out infinite' }} />
                <span style={{ fontSize:21, fontWeight:800, color:'#fff' }}>CareFlow</span>
              </div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)', marginTop:3 }}>{TODAY_STR} · 대시보드</div>
            </div>
            <div style={{ ...GLASS, padding:'6px 13px', borderRadius:99 }}>
              <span style={{ fontSize:12, fontWeight:700, color:'#fff' }}>
                {TOTAL_SCORE}/{TOTAL_MAX} <span style={{ opacity:0.6 }}>기록</span>
              </span>
            </div>
          </div>
        </div>

        {/* ── 스크롤 콘텐츠 ── */}
        <div style={{ flex:1, overflowY:'auto', padding:'0 20px 12px', position:'relative', zIndex:10, scrollbarWidth:'none', display:'flex', flexDirection:'column', gap:14 }}>

          {/* ① 오늘의 간호학적 통찰 */}
          <motion.div
            initial={{ opacity:0, y:16 }} animate={{ opacity:mounted?1:0, y:mounted?0:16 }}
            transition={{ duration:0.5, ease:'easeOut' }}
            style={{ ...GLASS_WARM, padding:'14px 16px' }}
          >
            <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
              <div style={{ width:38, height:38, borderRadius:12, background:'rgba(91,168,138,0.25)', border:'1px solid rgba(91,168,138,0.4)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:18 }}>🌿</span>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:1, textTransform:'uppercase', marginBottom:4 }}>오늘의 통찰</div>
                <div style={{ fontSize:12.5, color:'rgba(255,255,255,0.9)', lineHeight:1.65, fontWeight:500 }}>
                  {emotionRatio >= 0.75
                    ? '오늘 감정 기복이 많았던 것 같아요. 잠시 조용한 곳에서 귀를 쉬게 해보세요.'
                    : '보행 안정성이 평소보다 낮게 기록됐어요. 오늘은 천천히 걸어보는 건 어떨까요?'}
                </div>
              </div>
            </div>
            {/* 소음 경고 */}
            <div style={{ marginTop:10, padding:'8px 12px', background:'rgba(232,200,110,0.12)', borderRadius:12, border:'1px solid rgba(232,200,110,0.2)', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:14 }}>🔊</span>
              <span style={{ fontSize:11, color:'rgba(232,200,110,0.95)', fontWeight:500 }}>주변이 다소 소란스럽네요, 귀를 쉬게 해주세요 (62dB)</span>
            </div>
          </motion.div>

          {/* ② Blob 차트 */}
          <motion.div
            initial={{ opacity:0, scale:0.94 }} animate={{ opacity:mounted?1:0, scale:mounted?1:0.94 }}
            transition={{ duration:0.6, delay:0.1, ease:[0.34,1.56,0.64,1] }}
            style={{ ...GLASS, padding:'16px', display:'flex', flexDirection:'column', alignItems:'center' }}
          >
            <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:1, textTransform:'uppercase', marginBottom:12, alignSelf:'flex-start' }}>4축 밸런스</div>

            <div style={{ position:'relative', width:170, height:170 }}>
              {/* 배경 그리드 원 */}
              <svg width="170" height="170" viewBox="0 0 200 200" style={{ position:'absolute', inset:0 }}>
                {[20,40,60].map(r=>(
                  <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
                ))}
                <line x1="100" y1="30" x2="100" y2="170" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
                <line x1="30" y1="100" x2="170" y2="100" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>

                {/* Blob */}
                <path d={blobPath} fill="rgba(91,168,138,0.18)" stroke="rgba(91,168,138,0.5)" strokeWidth="1.5" style={{ filter:'url(#glow)' }}>
                  <animate attributeName="d" dur="4s" repeatCount="indefinite"
                    values={`${blobPath};${buildBlobPath(AXES.map(a=>a.score*0.88+0.12), AXES.map(a=>a.max))};${blobPath}`}
                    calcMode="spline" keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"/>
                </path>

                {/* 축 점 */}
                {AXES.map((a,i)=>{
                  const r=28+42*(a.score/a.max)
                  const pos=[[100,100-r],[100+r,100],[100,100+r],[100-r,100]][i]
                  return <circle key={a.key} cx={pos[0]} cy={pos[1]} r="5" fill={a.color} style={{ filter:`drop-shadow(0 0 4px ${a.color})` }}/>
                })}

                <defs>
                  <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                </defs>

                {/* 축 레이블 */}
                <text x="100" y="16" textAnchor="middle" fontSize="10" fontWeight="700" fill={AXES[0].color}>{AXES[0].label}</text>
                <text x="186" y="104" textAnchor="start"  fontSize="10" fontWeight="700" fill={AXES[1].color}>{AXES[1].label}</text>
                <text x="100" y="196" textAnchor="middle" fontSize="10" fontWeight="700" fill={AXES[2].color}>{AXES[2].label}</text>
                <text x="14"  y="104" textAnchor="end"    fontSize="10" fontWeight="700" fill={AXES[3].color}>{AXES[3].label}</text>
              </svg>
            </div>

            {/* 축 점수 범례 */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 16px', width:'100%', marginTop:14 }}>
              {AXES.map(a=>(
                <div key={a.key} style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:a.color, boxShadow:`0 0 6px ${a.color}`, flexShrink:0 }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.85)' }}>{a.label}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:a.color }}>{a.score}/{a.max}</span>
                    </div>
                    <div style={{ height:3, background:'rgba(255,255,255,0.1)', borderRadius:2, marginTop:3, overflow:'hidden' }}>
                      <motion.div
                        initial={{ width:0 }}
                        animate={{ width:`${(a.score/a.max)*100}%` }}
                        transition={{ duration:1, delay:0.4+AXES.indexOf(a)*0.1, ease:[0.34,1.56,0.64,1] }}
                        style={{ height:'100%', background:a.color, borderRadius:2, boxShadow:`0 0 6px ${a.color}60` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ③ 4축 체크리스트 카드 */}
          <motion.div
            initial={{ opacity:0, y:16 }} animate={{ opacity:mounted?1:0, y:mounted?0:16 }}
            transition={{ duration:0.5, delay:0.2 }}
            style={{ display:'flex', flexDirection:'column', gap:8 }}
          >
            <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', letterSpacing:1, textTransform:'uppercase' }}>오늘의 4축 기록</div>
            {AXES.map((a,ai)=>(
              <motion.div
                key={a.key}
                whileTap={{ scale:0.97 }}
                transition={{ type:'spring', stiffness:400, damping:17 }}
                onClick={()=>handleAxisTap(a.key)}
                style={{ ...GLASS, padding:'13px 15px', borderLeft:`3px solid ${a.color}`, cursor:'pointer' }}
              >
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:9 }}>
                  <div>
                    <span style={{ fontSize:13, fontWeight:800, color:a.color }}>{a.label}</span>
                    <span style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginLeft:6 }}>{a.sub}</span>
                  </div>
                  <motion.span
                    animate={{ scale: tappedAxis===a.key ? [1,1.3,1] : 1 }}
                    transition={{ duration:0.3 }}
                    style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99, background:`${a.color}28`, color:a.color, border:`1px solid ${a.color}40` }}
                  >
                    {a.score}/{a.max}
                  </motion.span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:`repeat(${a.max},1fr)`, gap:5 }}>
                  {a.items.map((item,i)=>(
                    <motion.div
                      key={i}
                      initial={{ opacity:0, scale:0.8 }}
                      animate={{ opacity:1, scale:1 }}
                      transition={{ delay:0.3+ai*0.08+i*0.05, type:'spring', stiffness:300 }}
                      style={{ padding:'5px 4px', borderRadius:10, background: a.checked[i] ? `${a.color}25` : 'rgba(255,255,255,0.05)', border:`1px solid ${a.checked[i] ? a.color+'50' : 'rgba(255,255,255,0.08)'}`, textAlign:'center' }}
                    >
                      <div style={{ fontSize:9.5, fontWeight:700, color: a.checked[i] ? a.color : 'rgba(255,255,255,0.3)' }}>
                        {a.checked[i] ? '✓' : '○'}
                      </div>
                      <div style={{ fontSize:8.5, color: a.checked[i] ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)', marginTop:1, lineHeight:1.3 }}>{item}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* ④ 주간 스트립 */}
          <motion.div
            initial={{ opacity:0, y:16 }} animate={{ opacity:mounted?1:0, y:mounted?0:16 }}
            transition={{ duration:0.5, delay:0.3 }}
            style={{ ...GLASS, padding:'14px 15px' }}
          >
            <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', letterSpacing:1, textTransform:'uppercase', marginBottom:12 }}>이번 주</div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              {WEEK.map(d=>(
                <div key={d.date} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flex:1 }}>
                  <span style={{ fontSize:9.5, fontWeight:600, color: d.today ? '#5BA88A' : 'rgba(255,255,255,0.35)' }}>{d.day}</span>
                  <motion.div
                    whileTap={{ scale:0.9 }}
                    style={{ width:30, height:30, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                      background: d.today ? '#5BA88A' : d.done ? 'rgba(91,168,138,0.2)' : 'rgba(255,255,255,0.05)',
                      border: d.today ? 'none' : d.done ? '1.5px solid rgba(91,168,138,0.4)' : '1.5px dashed rgba(255,255,255,0.15)',
                      boxShadow: d.today ? '0 0 12px rgba(91,168,138,0.6)' : 'none',
                    }}
                  >
                    <span style={{ fontSize:10, fontWeight:700, color: d.today ? '#fff' : d.done ? 'rgba(91,168,138,0.9)' : 'rgba(255,255,255,0.2)' }}>{d.date}</span>
                  </motion.div>
                  <div style={{ display:'flex', gap:2 }}>
                    {d.dots.map((c,i)=>(
                      <div key={i} style={{ width:4, height:4, borderRadius:'50%', background:c, boxShadow:`0 0 4px ${c}` }}/>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ⑤ 월간 통계 */}
          <motion.div
            initial={{ opacity:0, y:16 }} animate={{ opacity:mounted?1:0, y:mounted?0:16 }}
            transition={{ duration:0.5, delay:0.35 }}
            style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}
          >
            {[
              { val:'11일', label:'기록한 날', icon:'📅', color:'#5BA88A' },
              { val:'3일',  label:'🔥 연속',   icon:'🔥', color:'#F5A87C' },
              { val:'감정',  label:'주요 축',   icon:'💜', color:'#EE9FB8' },
            ].map(s=>(
              <motion.div
                key={s.label}
                whileTap={{ scale:0.93 }}
                transition={{ type:'spring', stiffness:400, damping:15 }}
                style={{ ...GLASS, padding:'14px 10px', textAlign:'center', cursor:'pointer' }}
              >
                <div style={{ fontSize:22, fontWeight:800, color:s.color, textShadow:`0 0 16px ${s.color}80` }}>{s.val}</div>
                <div style={{ fontSize:9.5, color:'rgba(255,255,255,0.45)', marginTop:4 }}>{s.label}</div>
              </motion.div>
            ))}
          </motion.div>

          <div style={{ height:4 }} />
        </div>

        {/* ── Floating Bottom Tab Bar ── */}
        <div style={{ position:'relative', zIndex:20, margin:'0 12px 18px', borderRadius:28, overflow:'hidden' }}>
          <div style={{ ...GLASS, padding:'10px 8px 12px', display:'grid', gridTemplateColumns:'repeat(4,1fr)' }}>
            {TABS.map(tab=>{
              const active = tab.href==='/dashboard'
              return (
                <Link key={tab.label} href={tab.href} style={{ textDecoration:'none', display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                  <motion.div
                    whileTap={{ scale:0.85 }}
                    transition={{ type:'spring', stiffness:500, damping:15 }}
                    style={{ width:46, height:30, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', background: active ? 'rgba(91,168,138,0.25)' : 'transparent', border: active ? '1px solid rgba(91,168,138,0.4)' : '1px solid transparent' }}
                  >
                    <span style={{ fontSize:18 }}>{tab.icon}</span>
                  </motion.div>
                  <span style={{ fontSize:9.5, fontWeight: active ? 700 : 500, color: active ? '#5BA88A' : 'rgba(255,255,255,0.35)' }}>{tab.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

      </div>

      <style>{`
        @keyframes glow { 0%,100%{box-shadow:0 0 6px #5BA88A} 50%{box-shadow:0 0 14px #5BA88A} }
        div::-webkit-scrollbar { display:none; }
      `}</style>
    </div>
  )
}
