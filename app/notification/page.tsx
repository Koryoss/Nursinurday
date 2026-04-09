'use client'

import { useState } from 'react'
import IPhoneFrame from '../components/IPhoneFrame'

const TODAY = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })

const RECENT = [
  { time: '오전 8:00',  icon: '💊', text: '아침 복약 시간이에요',          axis: null,       read: true  },
  { time: '오전 10:23', icon: '📋', text: '오늘 이명 기록을 남겼어요',      axis: '몸',       read: true  },
  { time: '오후 1:00',  icon: '💊', text: '점심 복약 시간이에요',           axis: null,       read: true  },
  { time: '오후 3:41',  icon: '💬', text: '오후 체크인 시간이에요',         axis: null,       read: false },
  { time: '오후 6:00',  icon: '💊', text: '저녁 복약 시간이에요',           axis: null,       read: false },
  { time: '오후 9:30',  icon: '🌙', text: '오늘 수면 기록을 남겨보세요',    axis: '의미',     read: false },
]

const AXIS_COLOR: Record<string, string> = {
  몸: '#F5A87C', 감정: '#EE9FB8', 관계: '#B8A8D4', 의미: '#E8C86E',
}
const AXIS_TEXT: Record<string, string> = {
  몸: '#7A3A0A', 감정: '#7A1A40', 관계: '#3D2878', 의미: '#6B4A00',
}

export default function NotificationPage() {
  const [meds, setMeds]     = useState(true)
  const [checkin, setCheckin] = useState(true)
  const [sleep, setSleep]   = useState(false)
  const [weekly, setWeekly] = useState(true)

  return (
    <IPhoneFrame sub={`${TODAY} · 알림 설정`}>
      <div style={{ flex:1, overflowY:'auto', padding:'14px 16px 0', scrollbarWidth:'none' }}>

        {/* 설정 섹션 */}
        <div style={{ fontSize:10, fontWeight:700, color:'#A08866', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>알림 설정</div>

        <div style={{ background:'#FFF8EC', borderRadius:16, border:'1px solid #EAD9BA', overflow:'hidden', marginBottom:14 }}>
          {[
            { label:'복약 알림',       sub:'아침·점심·저녁 복약 시간',  val:meds,    set:setMeds,    icon:'💊' },
            { label:'하루 체크인',     sub:'오후 3시 기록 리마인더',    val:checkin, set:setCheckin, icon:'📋' },
            { label:'수면 기록',       sub:'취침 전 수면 패턴 기록',    val:sleep,   set:setSleep,   icon:'🌙' },
            { label:'주간 리포트',     sub:'매주 월요일 지난 주 요약',  val:weekly,  set:setWeekly,  icon:'📊' },
          ].map((item, i, arr) => (
            <div key={item.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 14px', borderBottom: i < arr.length-1 ? '1px solid rgba(61,43,31,0.06)' : 'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:18 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#3D2B1F' }}>{item.label}</div>
                  <div style={{ fontSize:10, color:'#A08866', marginTop:1 }}>{item.sub}</div>
                </div>
              </div>
              {/* 토글 */}
              <div onClick={() => item.set(v => !v)} style={{ width:44, height:26, borderRadius:13, background: item.val ? '#5BA88A' : '#D4C4A8', position:'relative', cursor:'pointer', transition:'background 0.3s', flexShrink:0 }}>
                <div style={{ position:'absolute', top:3, left: item.val ? 21 : 3, width:20, height:20, borderRadius:'50%', background:'#fff', boxShadow:'0 1px 4px rgba(0,0,0,0.15)', transition:'left 0.3s' }} />
              </div>
            </div>
          ))}
        </div>

        {/* 복약 시간 설정 */}
        {meds && (
          <>
            <div style={{ fontSize:10, fontWeight:700, color:'#A08866', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>복약 시간</div>
            <div style={{ background:'#FFF8EC', borderRadius:16, border:'1px solid #EAD9BA', overflow:'hidden', marginBottom:14 }}>
              {[['아침', '08:00'], ['점심', '13:00'], ['저녁', '18:00']].map(([label, time], i, arr) => (
                <div key={label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderBottom: i < arr.length-1 ? '1px solid rgba(61,43,31,0.06)' : 'none' }}>
                  <span style={{ fontSize:12, fontWeight:600, color:'#3D2B1F' }}>{label}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'#5BA88A', background:'rgba(91,168,138,0.1)', padding:'4px 12px', borderRadius:99 }}>{time}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 오늘 알림 이력 */}
        <div style={{ fontSize:10, fontWeight:700, color:'#A08866', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>오늘 알림</div>
        <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:16 }}>
          {RECENT.map((n, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background: n.read ? '#FFF8EC' : 'rgba(91,168,138,0.08)', borderRadius:12, border: n.read ? '1px solid #EAD9BA' : '1px solid rgba(91,168,138,0.25)', opacity: n.read ? 0.7 : 1 }}>
              <span style={{ fontSize:18, flexShrink:0 }}>{n.icon}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight: n.read ? 500 : 700, color:'#3D2B1F', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{n.text}</div>
                <div style={{ fontSize:10, color:'#A08866', marginTop:2 }}>{n.time}</div>
              </div>
              {n.axis && (
                <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:99, background:`${AXIS_COLOR[n.axis]}28`, color:AXIS_TEXT[n.axis], flexShrink:0 }}>{n.axis}</span>
              )}
              {!n.read && <div style={{ width:6, height:6, borderRadius:'50%', background:'#5BA88A', flexShrink:0 }} />}
            </div>
          ))}
        </div>
      </div>
    </IPhoneFrame>
  )
}
