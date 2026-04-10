'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import IPhoneFrame from '../components/IPhoneFrame'

const SAGE      = '#A3B18A'
const GOLD      = '#D4AF37'
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

const AXIS_COLOR: Record<string,string> = { 몸:'#F5A87C', 감정:'#EE9FB8', 관계:'#B8A8D4', 의미:'#E8C86E' }
const AXIS_TEXT:  Record<string,string> = { 몸:'#7A3A0A', 감정:'#7A1A40', 관계:'#3D2878', 의미:'#6B4A00' }

const MEDS = [
  { label:'아침', time:'08:00', hour:8  },
  { label:'점심', time:'13:00', hour:13 },
  { label:'저녁', time:'18:00', hour:18 },
]

const FEED = [
  { icon:'💊', text:'아침 복약 시간이에요',     time:'오전 8:00',  done:true,  axis:null,  dB:null   },
  { icon:'👂', text:'이명 기록됨',              time:'오전 10:23', done:true,  axis:'몸',  dB:'58dB' },
  { icon:'💊', text:'점심 복약 시간이에요',     time:'오후 1:00',  done:true,  axis:null,  dB:null   },
  { icon:'📋', text:'오후 체크인 시간이에요',   time:'오후 3:41',  done:false, axis:null,  dB:null   },
  { icon:'💊', text:'저녁 복약 시간이에요',     time:'오후 6:00',  done:false, axis:null,  dB:null   },
  { icon:'🌙', text:'수면 기록을 남겨보세요',   time:'오후 9:30',  done:false, axis:'의미', dB:null  },
]

const TODAY = new Date().toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'short'})
const CURRENT_HOUR = new Date().getHours()

export default function NotificationPage() {
  const [meds,    setMeds   ] = useState(true)
  const [checkin, setCheckin] = useState(true)
  const [sleep,   setSleep  ] = useState(false)
  const [weekly,  setWeekly ] = useState(true)

  return (
    <IPhoneFrame sub={`${TODAY} · 알림 설정 · 피드`}>
      <div style={{flex:1,minHeight:0,overflowY:'auto',padding:'14px 16px 0',scrollbarWidth:'none',display:'flex',flexDirection:'column',gap:14}}>

        {/* ① 복약 위젯 */}
        <div style={{...GLASS,overflow:'hidden',flexShrink:0}}>
          <div style={{padding:'13px 16px 10px',display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:18}}>💊</span>
            <span style={{fontSize:13,fontWeight:800,color:TEXT}}>오늘의 복약</span>
            <span style={{marginLeft:'auto',fontSize:10,fontWeight:600,color:TEXT_LIGHT}}>3회</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:1}}>
            {MEDS.map((m,i)=>{
              const passed = CURRENT_HOUR > m.hour
              const current = CURRENT_HOUR === m.hour
              return (
                <div key={m.label} style={{position:'relative',margin:'0 10px',marginBottom:i===MEDS.length-1?10:4,borderRadius:16,overflow:'hidden',background:'rgba(163,177,138,0.06)',border:`1px solid ${passed?'rgba(163,177,138,0.25)':'rgba(0,0,0,0.05)'}`}}>
                  {/* 채워지는 배경 */}
                  {passed && (
                    <motion.div
                      initial={{width:0}}
                      animate={{width:'100%'}}
                      transition={{duration:1.2,delay:i*0.15,ease:'easeOut'}}
                      style={{position:'absolute',inset:0,background:`rgba(163,177,138,0.18)`,borderRadius:16,zIndex:0}}
                    />
                  )}
                  <div style={{position:'relative',zIndex:1,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 14px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:32,height:32,borderRadius:10,background:passed?`rgba(163,177,138,0.25)`:'rgba(0,0,0,0.05)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <span style={{fontSize:15}}>💊</span>
                      </div>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:TEXT}}>{m.label} 복약</div>
                        <div style={{fontSize:10,color:TEXT_MID,marginTop:1}}>{m.time}</div>
                      </div>
                    </div>
                    {passed
                      ? <span style={{fontSize:11,fontWeight:700,color:SAGE,background:`rgba(163,177,138,0.15)`,padding:'3px 10px',borderRadius:99}}>✓ 완료</span>
                      : <span style={{fontSize:12,fontWeight:700,color:GOLD}}>{m.time}</span>
                    }
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ② 토글 설정 */}
        <div style={{...GLASS,overflow:'hidden',flexShrink:0}}>
          <div style={{padding:'13px 16px 8px',fontSize:10,fontWeight:700,color:TEXT_MID,letterSpacing:0.8,textTransform:'uppercase'}}>알림 설정</div>
          {[
            {icon:'💊',label:'복약 알림',   sub:'아침·점심·저녁 복약 시간',  val:meds,    set:setMeds   },
            {icon:'📋',label:'하루 체크인', sub:'오후 3시 기록 리마인더',     val:checkin, set:setCheckin},
            {icon:'🌙',label:'수면 기록',   sub:'취침 전 수면 패턴 기록',     val:sleep,   set:setSleep  },
            {icon:'📊',label:'주간 리포트', sub:'매주 월요일 지난 주 요약',   val:weekly,  set:setWeekly },
          ].map((item,i,arr)=>(
            <div key={item.label} style={{display:'flex',alignItems:'center',gap:10,padding:'11px 16px',borderBottom:i<arr.length-1?'1px solid rgba(0,0,0,0.04)':'none'}}>
              <span style={{fontSize:18,flexShrink:0}}>{item.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:700,color:TEXT}}>{item.label}</div>
                <div style={{fontSize:10,color:TEXT_LIGHT,marginTop:1}}>{item.sub}</div>
              </div>
              <motion.div
                onClick={()=>item.set((v:boolean)=>!v)}
                animate={{background:item.val?SAGE:'#D0D8DC'}}
                transition={{duration:0.25}}
                style={{width:44,height:26,borderRadius:13,position:'relative',cursor:'pointer',flexShrink:0}}
              >
                <motion.div
                  animate={{left:item.val?21:3}}
                  transition={{type:'spring',stiffness:500,damping:30}}
                  style={{position:'absolute',top:3,width:20,height:20,borderRadius:'50%',background:'#fff',boxShadow:'0 1px 4px rgba(0,0,0,0.18)'}}
                />
              </motion.div>
            </div>
          ))}
        </div>

        {/* ③ 오늘 알림 피드 */}
        <div style={{display:'flex',flexDirection:'column',gap:2}}>
          <div style={{fontSize:10,fontWeight:700,color:TEXT_MID,letterSpacing:0.8,textTransform:'uppercase',marginBottom:8,paddingLeft:2}}>오늘 알림</div>
          {FEED.map((n,i)=>(
            <motion.div
              key={i}
              initial={{opacity:0,y:10}}
              animate={{opacity:1,y:0}}
              transition={{delay:i*0.06,type:'spring',stiffness:280}}
              style={{...GLASS,padding:'12px 14px',display:'flex',alignItems:'center',gap:10,opacity:n.done?0.75:1,borderRadius:20}}
            >
              <div style={{width:38,height:38,borderRadius:13,background:n.axis?`${AXIS_COLOR[n.axis]}22`:`rgba(163,177,138,0.14)`,border:`1px solid ${n.axis?AXIS_COLOR[n.axis]+'35':'rgba(163,177,138,0.25)'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <span style={{fontSize:18}}>{n.icon}</span>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{fontSize:12,fontWeight:n.done?500:700,color:TEXT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{n.text}</span>
                  {n.dB && <span style={{fontSize:9,color:TEXT_LIGHT,flexShrink:0,background:'rgba(0,0,0,0.05)',padding:'1px 5px',borderRadius:99}}>{n.dB}</span>}
                </div>
                <div style={{fontSize:10,color:TEXT_LIGHT,marginTop:2}}>{n.time}</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
                {n.axis && <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:99,background:`${AXIS_COLOR[n.axis]}22`,color:AXIS_TEXT[n.axis]}}>{n.axis}</span>}
                {!n.done && <div style={{width:7,height:7,borderRadius:'50%',background:SAGE,boxShadow:`0 0 6px rgba(163,177,138,0.7)`}}/>}
              </div>
            </motion.div>
          ))}
        </div>

        <div style={{height:8}}/>
      </div>
    </IPhoneFrame>
  )
}
