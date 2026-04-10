import Link from 'next/link'

/* ── 디자인 토큰 ── */
const C = {
  bg:     '#FBFBFB',
  text:   '#2D2D2D',
  mid:    '#6B6B6B',
  light:  '#ABABAB',
  sage:   '#A3B18A',
  sageDk: '#7A9E6A',
  purple: '#B8A8D4',
  gold:   '#D4AF37',
  goldLt: '#E8C86E',
  body:   '#EE9FB8',
  relate: '#B8A8D4',
}

const FONT = "'Pretendard', -apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif"

/* ── 로고 SVG ── */
function CareFlowLogo({ width = 260 }: { width?: number }) {
  const h = width * 0.52
  return (
    <svg width={width} height={h} viewBox="0 0 500 260" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* 웨이브 메인 그라디언트: 세이지 → 골드 → 퍼플 */}
        <linearGradient id="lgWave" x1="0" y1="0" x2="500" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#6BAE96"/>
          <stop offset="30%"  stopColor="#A3B18A"/>
          <stop offset="55%"  stopColor="#C4B488"/>
          <stop offset="75%"  stopColor="#B8A8D4"/>
          <stop offset="100%" stopColor="#D4C896"/>
        </linearGradient>
        {/* 두번째 평행 커브 그라디언트 */}
        <linearGradient id="lgWave2" x1="0" y1="0" x2="500" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#B8A8D4" stopOpacity="0"/>
          <stop offset="30%"  stopColor="#B8A8D4" stopOpacity="0.6"/>
          <stop offset="70%"  stopColor="#C8B8D8"/>
          <stop offset="100%" stopColor="#D4C896"/>
        </linearGradient>
        <linearGradient id="lgWave3" x1="0" y1="0" x2="500" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#D4C896" stopOpacity="0"/>
          <stop offset="40%"  stopColor="#D4C896" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#E8D8A0"/>
        </linearGradient>
      </defs>

      {/* ECG + 웨이브 메인 라인 */}
      <path
        d="M18,105 L48,105 L60,38 L72,168 L80,58 L90,138 L98,78 L106,122 L116,95 L132,98
           C160,98 180,72 210,58 C240,44 268,82 290,50 C318,10 360,18 410,22 C440,24 470,14 490,8"
        stroke="url(#lgWave)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* 하단 평행 커브 (보라/라벤더) */}
      <path
        d="M200,118 C228,108 260,96 290,66 C318,32 358,38 408,42 C440,44 470,34 490,28"
        stroke="url(#lgWave2)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />

      {/* 상단 두번째 커브 (골드) */}
      <path
        d="M230,80 C260,64 295,46 330,32 C365,18 420,10 490,6"
        stroke="url(#lgWave3)"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

/* ── 섹션 데이터 ── */
const axes = [
  { color:'#F5A87C', bg:'rgba(245,168,124,0.08)', border:'rgba(245,168,124,0.25)', label:'몸',  sub:'신체 증상 · 에너지',
    items:['이명이 있었나요?','어지러움이 있었나요?','피로감을 느꼈나요?','두통이 있었나요?'] },
  { color:'#EE9FB8', bg:'rgba(238,159,184,0.08)', border:'rgba(238,159,184,0.25)', label:'감정', sub:'불안 · 긴장 · 감정 기복',
    items:['불안감을 느꼈나요?','예민하거나 짜증이 났나요?','두려움이 있었나요?','기분 변화가 심했나요?'] },
  { color:'#B8A8D4', bg:'rgba(184,168,212,0.08)', border:'rgba(184,168,212,0.25)', label:'관계', sub:'연결 · 고립 · 사회 참여',
    items:['사람들과 함께했나요?','고립감을 느꼈나요?','소통이 힘들었나요?'] },
  { color:'#E8C86E', bg:'rgba(232,200,110,0.08)', border:'rgba(232,200,110,0.25)', label:'의미', sub:'방향 · 성취 · 삶의 질',
    items:['성취감을 느꼈나요?','하루가 의미 있었나요?','계획한 일을 했나요?'] },
]

const features = [
  { icon:'💬', title:'AI 대화형 일기장',  desc:'짧은 대화로 오늘 하루를 4축으로 자동 분류해요.',      accent: C.sage   },
  { icon:'🔔', title:'스마트 복약 알림',  desc:'아침·점심·저녁 알림과 패턴 기반 리마인더.',          accent: C.goldLt },
  { icon:'📊', title:'주간·월간 리포트',  desc:'기록이 쌓일수록 나만의 패턴이 한눈에 보여요.',       accent: C.purple },
  { icon:'⌚', title:'Apple Watch 연동', desc:'손목에서 바로 기록. 증상 발생 즉시 남기세요.',       accent:'#F5A87C' },
]

const whyItems = [
  { icon:'🔄', title:'예측 불가능한 반복', desc:'언제 발생할지 모르는 증상, 일상 기록으로 내 패턴을 파악하고 더 나은 자기 관리를 할 수 있어요.' },
  { icon:'🏥', title:'진료실 밖의 시간',   desc:'증상은 대부분 일상에서 발생해요. 의사를 만나는 짧은 시간에 6개월치 패턴을 기억하긴 어렵죠.' },
  { icon:'📈', title:'기록이 패턴을 보여준다', desc:'어떤 상황에서 증상이 심해지는지 데이터로 파악하면 생활 습관 조정에 도움이 돼요.' },
]

export default function HomePage() {
  return (
    <div style={{ background:C.bg, minHeight:'100vh', fontFamily:FONT, color:C.text, overflowX:'hidden' }}>

      {/* ── 헤더 ── */}
      <header style={{
        position:'sticky', top:0, zIndex:100,
        background:'rgba(251,251,251,0.85)',
        backdropFilter:'blur(20px)',
        WebkitBackdropFilter:'blur(20px)',
        borderBottom:'1px solid rgba(163,177,138,0.12)',
      }}>
        <div style={{ maxWidth:1160, margin:'0 auto', padding:'0 32px', height:68, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          {/* 로고 텍스트 */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:30, height:30, borderRadius:9, background:`linear-gradient(135deg, ${C.sage}, ${C.sageDk})`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:15 }}>🌿</span>
            </div>
            <span style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.5px', color:C.text }}>CareFlow</span>
          </div>
          <nav style={{ display:'flex', gap:8, alignItems:'center' }}>
            <Link href="/explore"      style={{ fontSize:14, fontWeight:600, color:C.mid, textDecoration:'none', padding:'8px 14px', borderRadius:99 }}>기록</Link>
            <Link href="/notification" style={{ fontSize:14, fontWeight:600, color:C.mid, textDecoration:'none', padding:'8px 14px', borderRadius:99 }}>알림</Link>
            <Link href="/dashboard"    style={{ fontSize:14, fontWeight:600, color:C.mid, textDecoration:'none', padding:'8px 14px', borderRadius:99 }}>대시보드</Link>
            <Link href="/explore" style={{
              fontSize:14, fontWeight:700, color:'#fff', textDecoration:'none',
              padding:'9px 22px', borderRadius:99,
              background:`linear-gradient(135deg, ${C.sage}, ${C.sageDk})`,
              boxShadow:'0 4px 14px rgba(163,177,138,0.35)',
            }}>지금 시작하기</Link>
          </nav>
        </div>
      </header>

      {/* ── 히어로 ── */}
      <section style={{ maxWidth:1160, margin:'0 auto', padding:'80px 32px 100px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>

        {/* 로고 SVG */}
        <div style={{ marginBottom:24 }}>
          <CareFlowLogo width={320} />
        </div>

        {/* CareFlow 브랜드 네임 */}
        <h1 style={{ fontSize:'clamp(52px, 8vw, 96px)', fontWeight:800, letterSpacing:'-3px', lineHeight:1, margin:'0 0 24px', color:C.text }}>
          CareFlow
        </h1>

        {/* 핵심 태그라인 */}
        <p style={{ fontSize:'clamp(18px, 3vw, 26px)', fontWeight:500, color:C.mid, lineHeight:1.6, maxWidth:520, margin:'0 0 12px' }}>
          진료실 밖 당신의 일상을 연결합니다.
        </p>
        <p style={{ fontSize:'clamp(14px, 2vw, 17px)', color:C.light, lineHeight:1.8, maxWidth:540, margin:'0 0 52px' }}>
          어지럼증과 이명, 오늘부터 매일 기록하세요.<br/>
          내 몸·감정·관계·의미, 네 가지 축으로 삶의 패턴을 발견해요.
        </p>

        {/* CTA 버튼 */}
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' }}>
          <Link href="/explore" style={{
            fontSize:17, fontWeight:700, color:'#fff', textDecoration:'none',
            padding:'16px 40px', borderRadius:16,
            background:`linear-gradient(135deg, ${C.sage}, ${C.sageDk})`,
            boxShadow:'0 8px 28px rgba(163,177,138,0.40)',
            letterSpacing:'-0.3px',
          }}>
            지금 시작하기 →
          </Link>
          <Link href="/dashboard" style={{
            fontSize:17, fontWeight:600, color:C.text, textDecoration:'none',
            padding:'16px 40px', borderRadius:16,
            background:'rgba(163,177,138,0.08)',
            border:'1.5px solid rgba(163,177,138,0.25)',
            letterSpacing:'-0.3px',
          }}>
            대시보드 보기
          </Link>
        </div>

        {/* 장식 웨이브 라인 */}
        <div style={{ marginTop:80, width:'100%', maxWidth:700, opacity:0.15 }}>
          <CareFlowLogo width={700} />
        </div>
      </section>

      {/* ── 기능 4개 ── */}
      <section style={{ background:'rgba(163,177,138,0.05)', borderTop:'1px solid rgba(163,177,138,0.12)', borderBottom:'1px solid rgba(163,177,138,0.12)', padding:'80px 32px' }}>
        <div style={{ maxWidth:1160, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <div style={{ display:'inline-block', fontSize:12, fontWeight:700, letterSpacing:1.2, color:C.sage, textTransform:'uppercase', marginBottom:16, padding:'5px 14px', borderRadius:99, background:'rgba(163,177,138,0.12)' }}>
              주요 기능
            </div>
            <h2 style={{ fontSize:'clamp(26px, 4vw, 40px)', fontWeight:800, letterSpacing:'-1px', margin:0 }}>
              일상을 기록하는 더 스마트한 방법
            </h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(230px, 1fr))', gap:20 }}>
            {features.map((f, i) => (
              <div key={i} style={{
                background:'rgba(255,255,255,0.85)',
                backdropFilter:'blur(12px)',
                WebkitBackdropFilter:'blur(12px)',
                borderRadius:24,
                padding:'32px 28px',
                border:'1px solid rgba(255,255,255,0.9)',
                boxShadow:'0 4px 24px rgba(0,0,0,0.05)',
              }}>
                <div style={{
                  width:52, height:52, borderRadius:16, marginBottom:20,
                  background:`${f.accent}18`,
                  border:`1px solid ${f.accent}35`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:24,
                }}>{f.icon}</div>
                <div style={{ fontSize:17, fontWeight:700, marginBottom:10, letterSpacing:'-0.3px' }}>{f.title}</div>
                <div style={{ fontSize:14, color:C.mid, lineHeight:1.75 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 왜 필요한가 ── */}
      <section style={{ padding:'100px 32px' }}>
        <div style={{ maxWidth:1160, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <div style={{ display:'inline-block', fontSize:12, fontWeight:700, letterSpacing:1.2, color:C.purple, textTransform:'uppercase', marginBottom:16, padding:'5px 14px', borderRadius:99, background:'rgba(184,168,212,0.12)' }}>
              왜 CareFlow인가요
            </div>
            <h2 style={{ fontSize:'clamp(26px, 4vw, 40px)', fontWeight:800, letterSpacing:'-1px', margin:'0 0 16px' }}>
              갑작스러운 증상에 당황하지 않도록
            </h2>
            <p style={{ fontSize:17, color:C.mid, lineHeight:1.75, maxWidth:520, margin:'0 auto' }}>
              일상의 모든 변화를 꼼꼼히 기록하는 든든한 조력자가 되어 드릴게요.
            </p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:24 }}>
            {whyItems.map((w, i) => (
              <div key={i} style={{
                borderRadius:24, padding:'40px 32px',
                background:'rgba(255,255,255,0.9)',
                border:'1px solid rgba(0,0,0,0.06)',
                boxShadow:'0 2px 16px rgba(0,0,0,0.04)',
              }}>
                <div style={{
                  width:56, height:56, borderRadius:18, marginBottom:24,
                  background:'rgba(163,177,138,0.10)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:26,
                }}>{w.icon}</div>
                <div style={{ fontSize:19, fontWeight:700, marginBottom:12, letterSpacing:'-0.5px' }}>{w.title}</div>
                <div style={{ fontSize:15, color:C.mid, lineHeight:1.8 }}>{w.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4축 섹션 ── */}
      <section style={{ padding:'100px 32px', background:`linear-gradient(160deg, rgba(184,168,212,0.06) 0%, rgba(163,177,138,0.06) 100%)`, borderTop:'1px solid rgba(184,168,212,0.12)' }}>
        <div style={{ maxWidth:1160, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <div style={{ display:'inline-block', fontSize:12, fontWeight:700, letterSpacing:1.2, color:C.goldLt, textTransform:'uppercase', marginBottom:16, padding:'5px 14px', borderRadius:99, background:'rgba(232,200,110,0.15)' }}>
              4축 기록 모델
            </div>
            <h2 style={{ fontSize:'clamp(26px, 4vw, 40px)', fontWeight:800, letterSpacing:'-1px', margin:'0 0 16px' }}>
              4축으로 나를 기록해요
            </h2>
            <p style={{ fontSize:17, color:C.mid, lineHeight:1.75, maxWidth:500, margin:'0 auto' }}>
              증상뿐 아니라 <strong style={{ color:C.text }}>몸·감정·관계·의미</strong> 전체를 함께 들여다봐요
            </p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:20 }}>
            {axes.map((axis, i) => (
              <div key={i} style={{
                background:`rgba(255,255,255,0.85)`,
                backdropFilter:'blur(12px)',
                WebkitBackdropFilter:'blur(12px)',
                borderRadius:24, padding:'32px 28px',
                border:`1px solid ${axis.border}`,
                boxShadow:`0 4px 20px rgba(0,0,0,0.04)`,
                borderTop:`3px solid ${axis.color}`,
              }}>
                {/* 축 아이콘 */}
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
                  <div style={{ width:44, height:44, borderRadius:14, background:`${axis.color}20`, border:`1px solid ${axis.color}40`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <div style={{ width:20, height:20, borderRadius:'50%', background:axis.color, opacity:0.8 }}/>
                  </div>
                  <div>
                    <div style={{ fontSize:20, fontWeight:800, color:C.text, letterSpacing:'-0.5px' }}>{axis.label}</div>
                    <div style={{ fontSize:12, fontWeight:600, color:axis.color, marginTop:1 }}>{axis.sub}</div>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {axis.items.map((item, j) => (
                    <div key={j} style={{ display:'flex', alignItems:'center', gap:10, fontSize:14, color:C.mid }}>
                      <div style={{
                        width:18, height:18, borderRadius:5, flexShrink:0,
                        background:`${axis.color}20`, border:`1.5px solid ${axis.color}60`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:10, color:axis.color, fontWeight:800,
                      }}>✓</div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 하단 CTA ── */}
      <section style={{ padding:'100px 32px' }}>
        <div style={{ maxWidth:800, margin:'0 auto', textAlign:'center' }}>
          {/* 로고 */}
          <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
            <CareFlowLogo width={220} />
          </div>
          <h2 style={{ fontSize:'clamp(28px, 5vw, 52px)', fontWeight:800, letterSpacing:'-1.5px', margin:'0 0 16px', lineHeight:1.2 }}>
            오늘부터 기록을<br/>시작해보세요
          </h2>
          <p style={{ fontSize:17, color:C.mid, lineHeight:1.75, margin:'0 0 44px' }}>
            진료실 밖 당신의 일상을 연결합니다.
          </p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <Link href="/explore" style={{
              fontSize:18, fontWeight:700, color:'#fff', textDecoration:'none',
              padding:'18px 52px', borderRadius:18,
              background:`linear-gradient(135deg, ${C.sage}, ${C.sageDk})`,
              boxShadow:'0 10px 36px rgba(163,177,138,0.45)',
              letterSpacing:'-0.4px',
            }}>
              지금 시작하기 →
            </Link>
          </div>

          {/* 수치 하이라이트 */}
          <div style={{ display:'flex', gap:40, justifyContent:'center', marginTop:64, flexWrap:'wrap' }}>
            {[
              { num:'4', label:'가지 기록 축', color:C.sage   },
              { num:'3', label:'회 복약 알림',  color:C.goldLt },
              { num:'7', label:'일 주간 리포트', color:C.purple },
            ].map((s, i) => (
              <div key={i} style={{ textAlign:'center' }}>
                <div style={{ fontSize:44, fontWeight:800, color:s.color, letterSpacing:'-2px', lineHeight:1 }}>{s.num}</div>
                <div style={{ fontSize:13, color:C.light, marginTop:6, fontWeight:600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 면책 ── */}
      <div style={{ maxWidth:760, margin:'0 auto', padding:'0 32px 40px', fontSize:13, color:C.light, lineHeight:1.9, textAlign:'center' }}>
        본 서비스는 의료 기기가 아닙니다. 제공되는 기록과 시각화 데이터는 사용자의 자기 관리 및 진료 시 참고를 돕기 위한 정보일 뿐이며, 어떠한 의학적 진단이나 치료 결정도 대신하지 않습니다.
      </div>

      {/* ── 푸터 ── */}
      <footer style={{
        borderTop:'1px solid rgba(163,177,138,0.12)',
        padding:'28px 32px 40px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        flexWrap:'wrap', gap:16,
        maxWidth:1160, margin:'0 auto',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:24, height:24, borderRadius:7, background:`linear-gradient(135deg, ${C.sage}, ${C.sageDk})`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:12 }}>🌿</span>
          </div>
          <span style={{ fontSize:14, fontWeight:700, color:C.text }}>CareFlow</span>
        </div>
        <span style={{ fontSize:13, color:C.light }}>© 2026 CareFlow. 진료실 밖 일상을 연결합니다.</span>
        <div style={{ display:'flex', gap:20 }}>
          <Link href="/explore"   style={{ fontSize:13, color:C.light, textDecoration:'none' }}>기록</Link>
          <Link href="/notification" style={{ fontSize:13, color:C.light, textDecoration:'none' }}>알림</Link>
          <Link href="/dashboard" style={{ fontSize:13, color:C.light, textDecoration:'none' }}>대시보드</Link>
        </div>
      </footer>

      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #FBFBFB; }
        a:hover { opacity: 0.85; transition: opacity 0.18s; }
      `}</style>
    </div>
  )
}
