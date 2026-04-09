'use client'

import IPhoneFrame from '../components/IPhoneFrame'

const TODAY = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })

const AXES = [
  { label:'몸',  sub:'신체 증상 · 에너지', color:'#F5A87C', textColor:'#7A3A0A', items:['이명이 있었나요?','어지러움이 있었나요?','피로감을 느꼈나요?','두통이 있었나요?'],            checked:[true,true,true,false] },
  { label:'감정', sub:'불안 · 긴장 · 감정 기복', color:'#EE9FB8', textColor:'#7A1A40', items:['불안감을 느꼈나요?','예민하거나 짜증이 났나요?','두려움이 있었나요?','기분 변화가 심했나요?'], checked:[true,true,true,true]  },
  { label:'관계', sub:'연결 · 고립 · 사회 참여', color:'#B8A8D4', textColor:'#3D2878', items:['사람들과 함께했나요?','고립감을 느꼈나요?','소통이 힘들었나요?'],                         checked:[false,true,false]     },
  { label:'의미', sub:'방향 · 성취 · 삶의 질', color:'#E8C86E', textColor:'#6B4A00', items:['성취감을 느꼈나요?','하루가 의미 있었나요?','계획한 일을 했나요?'],                       checked:[true,false,true]      },
]

const WEEK = [
  { day:'월', date:13, recorded:true,  dots:['#F5A87C','#EE9FB8'] },
  { day:'화', date:14, recorded:false, dots:[] },
  { day:'수', date:15, recorded:true,  dots:['#EE9FB8','#E8C86E'] },
  { day:'목', date:16, recorded:true,  dots:['#F5A87C'] },
  { day:'금', date:17, recorded:true,  dots:['#EE9FB8','#B8A8D4'] },
  { day:'토', date:18, recorded:false, dots:[] },
  { day:'일', date:19, recorded:true,  dots:['#F5A87C','#EE9FB8'], today:true },
]

export default function DashboardPage() {
  const totalChecked = AXES.reduce((s, a) => s + a.checked.filter(Boolean).length, 0)
  const totalMax     = AXES.reduce((s, a) => s + a.items.length, 0)

  return (
    <IPhoneFrame sub={`${TODAY} · 나의 기록`}>
      <div style={{ flex:1, overflowY:'auto', padding:'14px 16px 0', scrollbarWidth:'none' }}>

        {/* 오늘 총계 */}
        <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:14 }}>
          <span style={{ fontSize:13, fontWeight:600, color:'#3D2B1F' }}>오늘</span>
          <span style={{ fontSize:28, fontWeight:800, color:'#5BA88A' }}>{totalChecked}</span>
          <span style={{ fontSize:13, color:'#A08866' }}>/ {totalMax}개 항목 기록</span>
          <span style={{ marginLeft:'auto', fontSize:11, fontWeight:700, color:'#5BA88A', background:'rgba(91,168,138,0.12)', padding:'3px 10px', borderRadius:99 }}>✅ 기록 완료</span>
        </div>

        {/* 진행 바 */}
        <div style={{ height:5, background:'rgba(61,43,31,0.08)', borderRadius:3, overflow:'hidden', marginBottom:14 }}>
          <div style={{ height:'100%', width:`${(totalChecked/totalMax)*100}%`, background:'linear-gradient(90deg,#5BA88A,#7CC4A8)', borderRadius:3 }} />
        </div>

        {/* 4축 체크리스트 */}
        <div style={{ fontSize:10, fontWeight:700, color:'#A08866', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>오늘의 4축 기록</div>
        <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:14 }}>
          {AXES.map(a => {
            const cnt = a.checked.filter(Boolean).length
            return (
              <div key={a.label} style={{ background:'#FFF8EC', borderRadius:12, padding:'10px 12px', border:'1px solid #EAD9BA', borderLeft:`3px solid ${a.color}` }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <div>
                    <span style={{ fontSize:12, fontWeight:800, color:a.textColor }}>{a.label}</span>
                    <span style={{ fontSize:10, color:'#A08866', marginLeft:6 }}>{a.sub}</span>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:99, background:`${a.color}28`, color:a.textColor }}>{cnt}/{a.items.length}</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  {a.items.map((item, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:7 }}>
                      <span style={{ fontSize:11, fontWeight:700, color: a.checked[i] ? a.color : '#D4C4A8', width:14 }}>{a.checked[i] ? '✓' : '○'}</span>
                      <span style={{ fontSize:11, color: a.checked[i] ? '#3D2B1F' : '#C4B09A' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* 주간 스트립 */}
        <div style={{ fontSize:10, fontWeight:700, color:'#A08866', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>이번 주 기록</div>
        <div style={{ background:'#FFF8EC', borderRadius:14, border:'1px solid #EAD9BA', padding:'10px 8px', display:'flex', justifyContent:'space-between', marginBottom:14 }}>
          {WEEK.map(d => (
            <div key={d.date} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, flex:1 }}>
              <span style={{ fontSize:9.5, fontWeight:600, color: d.today ? '#5BA88A' : '#A08866' }}>{d.day}</span>
              <div style={{
                width:30, height:30, borderRadius:'50%',
                background: d.today ? '#5BA88A' : d.recorded ? 'rgba(91,168,138,0.15)' : 'transparent',
                border: d.today ? 'none' : d.recorded ? '1.5px solid rgba(91,168,138,0.4)' : '1.5px dashed #EAD9BA',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <span style={{ fontSize:10, fontWeight:700, color: d.today ? '#fff' : d.recorded ? '#5BA88A' : '#D4C4A8' }}>{d.date}</span>
              </div>
              <div style={{ display:'flex', gap:2 }}>
                {d.dots.map((c, i) => <div key={i} style={{ width:4, height:4, borderRadius:'50%', background:c }} />)}
              </div>
            </div>
          ))}
        </div>

        {/* 월간 통계 */}
        <div style={{ fontSize:10, fontWeight:700, color:'#A08866', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>3월 통계</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:7, marginBottom:16 }}>
          {[
            { val:'11일', label:'기록한 날', color:'#5BA88A' },
            { val:'감정',  label:'주요 축',   color:'#EE9FB8' },
            { val:'3일',  label:'🔥 연속 기록', color:'#5BA88A' },
          ].map(s => (
            <div key={s.label} style={{ background:'#FFF8EC', borderRadius:12, border:'1px solid #EAD9BA', padding:'12px 8px', textAlign:'center' }}>
              <div style={{ fontSize:20, fontWeight:800, color:s.color }}>{s.val}</div>
              <div style={{ fontSize:9.5, color:'#A08866', marginTop:3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </IPhoneFrame>
  )
}
