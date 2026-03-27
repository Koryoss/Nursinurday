// =====================================================
// CareFlow 모의 응답 데이터베이스 v4
// NANDA 간호 진단 기반 (유형→자극→경로→반응→정서→치료)
// API 키 없이 테스트할 때 사용하는 자기돌봄 응답 모음
// =====================================================

import { ObservationDomain, CrisisLevel } from './nursingLogic'

interface NANDAResponse {
  // 유형: 간호 진단명
  diagnosis: string
  // 자극: 원인/유발요인
  stimulus: string
  // 경로: 생리적 메커니즘 또는 기전
  pathophysiology: string
  // 반응: 주요 증상/반응
  response: string
  // 정서: 감정적 경험
  emotion: string
  // 치료: 간호 중재
  therapeuticAction: string
}

// =====================================================
// 도메인별 NANDA 간호 진단 기반 응답 (랜덤 선택)
// =====================================================
const mockDatabase: Record<ObservationDomain, NANDAResponse[]> = {

  // ── Body: Sleep (잠과 회복) — 수면 패턴 장애 ──────────────────────
  Sleep: [
    {
      diagnosis: '수면 패턴 장애 (Sleep Pattern Disturbance)',
      stimulus: '스트레스, 불안, 신체적 불편감, 환경 요인',
      pathophysiology: '중추신경계의 각성 시스템이 과활성화되어 뇌의 휴식 신호를 방해하는 상태',
      response: '잠을 못 자거나 자주 깸, 낮 동안 피로감과 집중력 저하',
      emotion: '답답함, 절망감, 자책감',
      therapeuticAction: '오늘 밤 자기 30분 전, 스마트폰을 침대에서 멀리 두고 눈을 감아봐요. 쉬는 것 자체가 목표예요.',
    },
    {
      diagnosis: '야간각성 (Nocturnal Awakening)',
      stimulus: '처리되지 않은 감정, 신체적 통증, 호르몬 변화',
      pathophysiology: '깊은 수면 단계 중 무의식적 각성으로 인한 수면 연속성 단절',
      response: '새벽에 자꾸 깸, 다시 잠들기 어려움, 아침에 개운하지 않음',
      emotion: '피로감, 무력감, 답답함',
      therapeuticAction: '잠들기 전 그날의 걱정을 종이에 써서 내려놓아봐요. "이건 내일 생각할게"라고 적으면 뇌도 조금 쉬게 돼요.',
    },
    {
      diagnosis: '수면 회복 장애 (Sleep Recovery Deficit)',
      stimulus: '만성 스트레스, 신체적 질환, 생활습관',
      pathophysiology: '부족한 수면 시간 또는 수면의 질 저하로 인한 신체 회복 불충분',
      response: '너무 많이 또는 적게 잠을 자게 됨, 몸이 무거움, 회복되지 않은 피로감',
      emotion: '절망감, 무기력, 자신에 대한 의심',
      therapeuticAction: '오늘 낮에 15분만 눈을 감고 쉬어봐요. 잠이 안 들어도 뇌가 쉬는 것만으로 충분해요.',
    },
  ],

  // ── Body: Energy (에너지와 활동) — 활동 불내증 ──────────────────
  Energy: [
    {
      diagnosis: '활동 불내증 (Activity Intolerance)',
      stimulus: '신체적 피로, 스트레스, 만성질환, 우울감',
      pathophysiology: '신체 에너지 생산(ATP)의 감소 및 신경-근육 기능 저하로 인한 활동 수행 능력 감소',
      response: '한 자리에만 앉아있음, 몸이 무거움, 일상 활동 수행 곤란, 호흡곤란',
      emotion: '답답함, 무기력, 자책감',
      therapeuticAction: '지금 당장 할 일을 생각하지 말고, 딱 하나만 — 자리에서 일어나서 물 한 잔 마셔줄래요? 그것만으로도 충분해요.',
    },
    {
      diagnosis: '진행성 피로 (Progressive Fatigue)',
      stimulus: '계속되는 스트레스, 정서적 부담, 신체적 질병',
      pathophysiology: '교감신경계의 지속적 활성화로 인한 세로토닌 및 도파민 감소',
      response: '점진적인 에너지 감소, 무언가를 하려는 욕구 상실, 의욕 저하',
      emotion: '절망감, 좌절감, "이대로 살아야 하나?"라는 생각',
      therapeuticAction: '5분 타이머를 맞추고, 그 5분 동안만 해보는 거예요. 5분 후에 멈춰도 돼요. 진짜로요.',
    },
    {
      diagnosis: '거대 피로 증후군 (Exhaustion Syndrome)',
      stimulus: '장기간의 신체적·정서적 소모, 회복 기간 부족',
      pathophysiology: '신경-호르몬 시스템의 고갈로 인한 복합적 피로 상태',
      response: '신체 전반의 무거움, 심한 피로감, 집중력 완전 상실, 수면 이상',
      emotion: '지침, 무기력, 희망 상실',
      therapeuticAction: '지금 보고 있는 화면을 닫고, 30초 동안 두 손을 무릎 위에 올려놓고 눈을 감아봐요. 그냥 그것만요.',
    },
  ],

  // ── Body: BodySignals (몸의 목소리) — 신체 신호 인식 장애 ──────────
  BodySignals: [
    {
      diagnosis: '신체 신호 인식 불충분 (Interoceptive Awareness Deficit)',
      stimulus: '만성 스트레스, 정서적 억압, 신경계 과민반응',
      pathophysiology: '뇌의 신경각각(interoceptive cortex)에서 신체 신호 수용 감소로 인한 신체-마음 연결 단절',
      response: '몸의 신호(피로, 배고픔, 경직)를 느끼지 못함, 스트레스 반응을 신체로 표현',
      emotion: '신체와의 단절감, 불안감, 통제 불가능한 느낌',
      therapeuticAction: '손을 가슴 위에 올리고, 코로 4초 마시고 입으로 6초 내쉬어봐요. 딱 세 번만요. 몸이 조금 달라지는 걸 느낄 거예요.',
    },
    {
      diagnosis: '신체 감각 과민반응 (Somatic Hyperarousal)',
      stimulus: '신경계 과활성화, 외상 경험, 만성 불안',
      pathophysiology: '교감신경계의 과도한 활성화로 인한 심박수 상승, 근육 긴장, 호흡 곤란',
      response: '심장이 빨리 뜀, 숨이 차옴, 근육 경직, 어깨·턱에 힘 들어감',
      emotion: '불안감, 공포감, 통제 불가능한 느낌',
      therapeuticAction: '지금 주변에 있는 것 5가지를 눈으로 찾아보세요. 하나씩 이름을 속으로 말하면서요. 몸이 "지금 여기"에 있음을 느끼는 연습이에요.',
    },
    {
      diagnosis: '신체 감각 박리 (Body Dissociation)',
      stimulus: '장기간의 스트레스, 정서 처리 불가능',
      pathophysiology: '신체 신호 전달 경로의 차단으로 인한 신체 감각 마비 상태',
      response: '몸이 무겁거나 떠있는 느낌, 식욕 상실, 온기 감각 상실',
      emotion: '공허함, 현실감 상실, 신체와의 단절감',
      therapeuticAction: '따뜻한 물이나 차 한 잔을 마셔봐요. 마시면서 온기가 목과 가슴을 타고 내려오는 감각에 집중해봐요.',
    },
    {
      diagnosis: '이명(울림) 지각 불안 (Tinnitus Perception Anxiety, ICD-10: H93.1 | KCD: H93.1)',
      stimulus: '내이 또는 신경계 과민, 스트레스, 신경계 자극, 수면 부족',
      pathophysiology: '청각 신경계의 과활성화로 인한 지속적 울림 신호 + 이에 대한 주의 편향으로 증폭',
      response: '귀에서 지속적으로 울림이 들림 (윙윙, 삐익, 쌩 등), 밤에 증상 악화, 집중력 산만',
      emotion: '불안감, 답답함, "이게 계속되면 어쩌지?"라는 두려움, 피로감',
      therapeuticAction: '**의료 확인 먼저**: 이비인후과 상담을 권해요. 치료 진행 중이라면, 지금 주변음을 들어봐요. 백색소음(선풍기, 음악)을 틀어보면 울림이 덜 신경 쓰여요. 밤에 불안하면 몸의 이완 운동(손가락과 발가락부터 차근차근 힘 빼기)을 해봐요.',
    },
    {
      diagnosis: '비문증(눈의 부유물) 시각 불안 (Floaters Visual Anxiety, ICD-10: H43.39 | KCD: H43.39)',
      stimulus: '유리체 변화(노화, 후유리체 박리), 시신경 과민, 눈 피로',
      pathophysiology: '눈의 유리체 내 부유물이 망막에 투영되는 시각적 신호 + 이에 대한 집중 및 주의 편향',
      response: '눈 앞에 검은 점이나 띠가 떠보임, 밝은 곳에서 더 선명히 보임, 눈을 움직일 때 함께 움직임',
      emotion: '시력 손상에 대한 공포, 불안감, "뭔가 잘못된 게 아닐까?"라는 걱정',
      therapeuticAction: '**의료 확인 먼저**: 안과 진료를 권해요. 대부분 무해하지만 확인이 중요해요. 진료 후라면, 부유물은 무해한 신체 반응이라고 안심하세요. 눈을 움직이면서 그것을 추적하지 말고, "저건 눈의 일부"라고 인정하고 다른 곳에 주의를 돌려봐요.',
    },
    {
      diagnosis: '어지럼증(현훈) 균형 불안 (Dizziness/Vertigo Anxiety, ICD-10: R42 | KCD: R42, ICD-10: H81 | KCD: H81)',
      stimulus: '전정기관 자극(메니에르병, BPPV 등), 신경계 과민, 혈압 변화, 스트레스',
      pathophysiology: '내이의 전정기(vestibular system)에서 신호 왜곡 또는 뇌의 평형감각 중추 기능 장애',
      response: '세상이 돌거나 흔들리는 느낌, 넘어질 것 같은 공포, 메스꺼움, 활동 제약',
      emotion: '두려움, 불안감, "이대로 넘어지면 어쩌지?"라는 공포, 무력감',
      therapeuticAction: '**의료 확인 먼저**: 이비인후과 또는 신경과 진료를 권해요. 진료 후라면, 천천히 움직이기, 갑자기 고개를 돌리지 않기, 눈을 한 곳에 고정하기 등이 도움돼요. 오늘 활동 수준을 낮추고, 시간이 필요한 상태임을 자신과 주변에 알려주세요.',
    },
  ],

  // ── Emotion: EmotionFlow (감정의 흐름) — 감정 조절 장애 ───────────
  EmotionFlow: [
    {
      diagnosis: '감정 불안정성 (Emotional Instability)',
      stimulus: '호르몬 변화, 스트레스, 신경계 불균형',
      pathophysiology: '전두엽-변연계 회로의 기능 장애로 인한 감정 조절 능력 감소',
      response: '감정이 오락가락함, 갑작스러운 기분 전환, 기분 예측 불가',
      emotion: '당황스러움, 자신감 상실, 불안감',
      therapeuticAction: '오늘 기분이 가장 달라진 순간이 언제였는지 생각해보고, 그때 뭘 하고 있었는지 메모해둬요. 나만의 감정 트리거를 찾는 첫 걸음이에요.',
    },
    {
      diagnosis: '감정 감수성 증가 (Emotional Hypersensitivity)',
      stimulus: '신경계 과민반응, 스트레스 누적, 호르몬 불균형',
      pathophysiology: '신경전달물질 불균형으로 인한 감정 자극에 대한 과도한 반응성',
      response: '사소한 것에 쉽게 상처받음, 감정 반응이 강함, 감정 회복 시간 길어짐',
      emotion: '예민함, 취약성, 피로감',
      therapeuticAction: '오늘 물을 충분히 마셨나요? 탈수도 감정 기복에 영향을 줘요. 지금 물 한 잔 마셔봐요.',
    },
    {
      diagnosis: '감정 표현 곤란 (Difficulty Expressing Emotions)',
      stimulus: '감정 억압 습관, 신뢰 부족, 표현 능력 미발달',
      pathophysiology: '감정 중추(변연계)와 언어 표현 중추(브로카 영역) 간의 연결 약화',
      response: '감정을 말로 표현하기 어려움, 감정을 느끼기만 함, 감정의 원인 파악 어려움',
      emotion: '답답함, 고립감, 무력감',
      therapeuticAction: '지금 느끼는 감정을 단어 하나로 써보세요 — 짜증, 슬픔, 공허함, 지침, 뭐든 괜찮아요. 감정을 인식하는 것 자체가 첫 번째 조절이에요.',
    },
  ],

  // ── Emotion: Tension (불안과 긴장) — 불안 장애 ───────────────────
  Tension: [
    {
      diagnosis: '일반화된 불안장애 (Generalized Anxiety Disorder)',
      stimulus: '스트레스, 미래에 대한 불확실성, 통제 불가능함의 경험',
      pathophysiology: '편도체(amygdala)의 과활성화와 전전두피질의 억제 기능 약화로 인한 불안 신호 과증폭',
      response: '지속적인 걱정, 근육 긴장, 집중력 저하, 불안감이 지배적',
      emotion: '불안감, 두려움, 통제 불능의 느낌',
      therapeuticAction: '4-7-8 호흡을 한 번 해봐요. 코로 4초 마시고, 7초 참고, 입으로 8초 내쉬어요. 딱 한 번만요.',
    },
    {
      diagnosis: '반복성 걱정 (Rumination/Worry Loop)',
      stimulus: '미해결 문제, 심리적 갈등, 불확실성',
      pathophysiology: '뇌 기본 네트워크(default mode network)의 과활성화로 인한 강박적 사고 반복',
      response: '최악의 시나리오 반복 상상, 같은 생각 계속 반복, 이성적 통제 불가',
      emotion: '불안감, 절망감, 피로감',
      therapeuticAction: '메모앱에 지금 걱정되는 것들을 전부 써보세요. 쓰고 나면 머릿속이 조금 가벼워지는 걸 느낄 거예요.',
    },
    {
      diagnosis: '신체화된 불안 (Somatic Anxiety)',
      stimulus: '신경계 과활성화, 정서적 억압',
      pathophysiology: '불안이 신체 증상으로 변환되는 신경생물학적 과정',
      response: '원인 없는 신체 통증, 가슴 통증, 어지러움, 호흡 곤란',
      emotion: '두려움, 질병에 대한 공포, 혼란',
      therapeuticAction: '주변에 있는 것 5가지를 눈으로 찾아보세요. 하나씩 속으로 이름을 말하면서요. 이게 그라운딩이에요.',
    },
  ],

  // ── Emotion: SelfView (나를 대하는 방식) — 자존감 저하 ────────────
  SelfView: [
    {
      diagnosis: '자존감 저하 (Low Self-Esteem)',
      stimulus: '부정적 경험 누적, 실패 경험, 외부 비판',
      pathophysiology: '자동적 부정적 사고(automatic negative thoughts) 형성으로 인한 자기 평가 왜곡',
      response: '자신에 대한 부정적 평가, 자신감 상실, 새로운 것 시도 회피',
      emotion: '자책감, 부끄러움, 절망감',
      therapeuticAction: '스스로에게 많이 가혹하게 말하고 있는 것 같아요. 친한 친구가 같은 말을 했다면, 그 친구에게도 똑같이 말했을까요?',
    },
    {
      diagnosis: '내적 비판 (Internalized Criticism)',
      stimulus: '어린 시절 비판/부정, 완벽주의 성향',
      pathophysiology: '전전두피질의 자기비판 회로 활성화로 인한 과도한 자기 감시 및 평가',
      response: '끊임없는 자기 비판, 실수에 대한 극도의 자책, 과도한 자기 통제',
      emotion: '죄책감, 수치심, 자신에 대한 혐오감',
      therapeuticAction: '지금 이 순간 내가 한 것 중 아주 작은 것 하나를 찾아보세요. 오늘 밥을 먹었다, 씻었다, 일어났다 — 그것도 충분한 거예요.',
    },
    {
      diagnosis: '부정적 자기 스키마 (Negative Self-Schema)',
      stimulus: '반복된 부정적 경험, 고정된 믿음체계',
      pathophysiology: '뇌의 패턴 인식 체계가 부정적 정보만 선택적으로 처리하는 확증편향(confirmation bias)',
      response: '"나는 왜 이럴까" 반복, 긍정적 사건도 부정적으로 해석, 사실이 아닌 것을 사실처럼 믿음',
      emotion: '절망감, 무가치함, 미래에 대한 불안',
      therapeuticAction: '오늘 기분과 상관없이, 잘한 것 딱 한 가지를 메모해 두세요. 아무리 작아도 괜찮아요.',
    },
  ],

  // ── Connection: Relationship (연결과 관계) — 사회적 고립 ─────────
  Relationship: [
    {
      diagnosis: '사회적 고립 (Social Isolation)',
      stimulus: '관계 단절, 신뢰 부족, 사회적 불안',
      pathophysiology: '뇌의 사회적 보상 회로(ventral striatum) 기능 감소로 인한 사회적 상호작용의 보상 감소',
      response: '사람 만나기 회피, 혼자라는 느낌, 연결 불가능함',
      emotion: '외로움, 고립감, 절망감',
      therapeuticAction: '오늘 누군가에게 아주 짧은 메시지를 보내봐요 — 안부 인사 하나라도요. 상대방도 기다리고 있을지 몰라요.',
    },
    {
      diagnosis: '관계 회피 (Relational Avoidance)',
      stimulus: '관계 상처 경험, 거부 공포, 신뢰 문제',
      pathophysiology: '공포 반응 회로의 과활성화로 인한 사회적 위협 신호의 과증폭',
      response: '사람을 피함, 깊은 관계 형성 어려움, 고립을 선택',
      emotion: '두려움, 취약성에 대한 불안, 외로움',
      therapeuticAction: '사람들이 귀찮게 느껴질 때가 있어요. 그건 사람이 싫은 게 아니라, 지금 내가 많이 지쳐있다는 신호일 수도 있어요.',
    },
    {
      diagnosis: '감정적 친밀감 장애 (Emotional Intimacy Difficulty)',
      stimulus: '감정 표현 곤란, 신뢰 부족, 취약성 공포',
      pathophysiology: '감정 처리 회로와 사회적 인식 회로 간의 연결 장애',
      response: '깊은 대화 회피, 표면적 관계만 유지, 감정 공유 불가능',
      emotion: '고립감, 이해받지 못함의 느낌, 관계의 무의미함',
      therapeuticAction: '말할 사람이 없다는 느낌이 들 때, 여기 CareFlow가 있어요. 판단 없이 들을게요.',
    },
  ],

  // ── Meaning: Direction (의미와 방향감) — 절망감/무의미감 ──────────
  Direction: [
    {
      diagnosis: '절망감 (Hopelessness)',
      stimulus: '반복된 실패, 통제 불가능한 상황, 미래에 대한 부정적 예측',
      pathophysiology: '전전두피질의 미래 예측 기능 장애로 인한 긍정적 결과에 대한 기대 완전 상실',
      response: '"아무것도 나아질 것 같지 않다", 미래 계획 불가능, 행동 의욕 상실',
      emotion: '절망감, 무의미함, 죽음에 대한 생각',
      therapeuticAction: '지금 아무것도 나아질 것 같지 않다는 느낌, 얼마나 힘든 감각인지 알아요. 그 무게를 여기서 같이 들어볼게요.',
    },
    {
      diagnosis: '무의미감 (Meaninglessness)',
      stimulus: '삶의 목표 상실, 외상 경험, 가치체계 붕괴',
      pathophysiology: '뇌의 의미 찾기 회로(posterior cingulate cortex) 기능 저하로 인한 삶의 의미 인식 불가',
      response: '삶이 무의미하게 느껴짐, 하는 일의 의미를 모름, 목표 설정 불가',
      emotion: '"다 소용없다"는 생각, 허무감, 포기감',
      therapeuticAction: '오늘 하루 중 단 한 가지, "그래도 이건 있었다" 싶은 순간이 있다면 이야기해줄래요? 아무리 작아도 돼요.',
    },
    {
      diagnosis: '영적 고통 (Spiritual Distress)',
      stimulus: '신념 체계 위기, 미래 불확실성, 존재의 의미 의문',
      pathophysiology: '뇌의 영적 경험 중추(default mode network) 기능 변화로 인한 존재적 불안',
      response: '삶의 방향 상실, 영적 공허감, 초월적 경험 추구의 욕구',
      emotion: '영적 공허감, 초월적 갈망, 진정한 연결의 갈증',
      therapeuticAction: '희망이 보이지 않을 때, 우리는 종종 너무 큰 그림만 보려 해요. 아주 작은 것에서 시작해봐요.',
    },
  ],

  // ── Meaning: Growth (성장 준비) — 성장의 두려움/준비 ──────────────
  Growth: [
    {
      diagnosis: '변화 저항 (Resistance to Change)',
      stimulus: '변화에 대한 불확실성, 실패 공포, 현상 유지 본능',
      pathophysiology: '뇌의 습관 회로(striatum)의 안정성 추구로 인한 신경보수주의',
      response: '변하고 싶어도 행동하지 못함, 같은 패턴 반복, 진전 없음',
      emotion: '"이러고는 안 되는데" 느낌, 좌절감, 자책감',
      therapeuticAction: '나아지고 싶다는 마음, 그 자체가 정말 강한 힘이에요. 지금 이미 첫 발을 내딛고 있어요.',
    },
    {
      diagnosis: '성장 두려움 (Fear of Growth)',
      stimulus: '책임 증가에 대한 공포, 실패 위험, 기대 증대',
      pathophysiology: '편도체의 불확실성에 대한 과도한 위협 반응',
      response: '성장 기회 회피, 작은 것에 집착, 변화 시도 중단',
      emotion: '두려움, 무능함의 느낌, 좌절감',
      therapeuticAction: '변하고 싶다는 의지가 느껴져요. 작은 것부터 시작하는 게 오히려 지속력이 길어요.',
    },
    {
      diagnosis: '자기실현 추구 (Self-Actualization Drive)',
      stimulus: '성장의 욕구, 잠재력 실현 갈망',
      pathophysiology: '뇌의 보상 시스템이 개인적 성장과 의미 추구에 반응하는 상태',
      response: '도움을 요청함, 작은 시도 시작, 변화에 개방적',
      emotion: '희망감, 가능성의 느낌, 힘내는 심정',
      therapeuticAction: '도움을 요청하는 것도 용기예요. 여기 와서 이야기해준 것처럼, 계속 그렇게 해줘요.',
    },
  ],

  // ── General (오늘의 나) — 통합적 자기돌봄 ────────────────────────
  General: [
    {
      diagnosis: '정서적 소진 (Emotional Exhaustion)',
      stimulus: '지속적인 정서적 부담, 지원 부족',
      pathophysiology: '신경호르몬 시스템(HPA축)의 장기 활성화로 인한 신체-정신 에너지 고갈',
      response: '감정적 반응성 둔화, 무관심, 동기 상실',
      emotion: '지침, 무기력, 공허함',
      therapeuticAction: '말씀해주셔서 고마워요. 어떤 부분이 가장 힘드신지 조금 더 이야기해줄 수 있어요?',
    },
    {
      diagnosis: '자기 인식 부족 (Poor Self-Awareness)',
      stimulus: '신체-감정-행동의 연결 고리 미발달',
      pathophysiology: '신경인식(interoception) 능력 저하로 인한 자신의 상태 파악 곤란',
      response: '자신의 감정/욕구를 알지 못함, 신체 신호 무시, 문제의 원인 파악 불가',
      emotion: '혼란, 무력감, 자신감 부족',
      therapeuticAction: '오늘 어떤 하루를 보내셨어요? 무언가 특별히 마음에 걸리는 게 있나요?',
    },
    {
      diagnosis: '현존 능력 발달 (Presence and Awareness Building)',
      stimulus: '자기 관찰, 현재 순간에 대한 주의',
      pathophysiology: '명상적 상태에서 활성화되는 뇌 회로로 인한 자각 증대',
      response: '현재에 집중, 자신의 상태 이해 증가, 선택의 자유 발견',
      emotion: '평온함, 수용감, 자신감',
      therapeuticAction: '여기 와서 이야기 나눠줘서 좋아요. 아무 말이 없어도 괜찮아요, 그냥 같이 있어도 돼요.',
    },
  ],
}

// =====================================================
// 위기 NANDA 간호 진단 응답 (Crisis Response)
// =====================================================
interface CrisisNANDAResponse {
  diagnosis: string
  crisisLevel: string
  immediateAction: string
  supportMessage: string
}

const crisisResponses: Record<Exclude<CrisisLevel, 'none'>, CrisisNANDAResponse> = {
  critical: {
    diagnosis: '자해 위험 (Suicide Risk - Critical)',
    crisisLevel: '생명 위협 수준 — 즉시 개입 필요',
    immediateAction: '자살예방상담전화 1393 (24시간, 무료) 즉시 전화\n또는 119 응급차량 호출',
    supportMessage:
      '지금 많이 힘드시죠. 혼자 감당하기 너무 힘든 순간이에요.\n\n' +
      '당신의 생명은 소중해요. 전문가의 즉시 개입이 필요합니다.\n\n' +
      '당신 곁에 함께 있어 드릴게요. 지금 안전한지 알려줄래요?',
  },

  urgent: {
    diagnosis: '자해 충동 (Self-Harm Impulses - Urgent)',
    crisisLevel: '위험 수준 높음 — 전문적 개입 긴급',
    immediateAction: '정신건강위기상담전화 1577-0199 (24시간, 무료) 즉시 전화\n가까운 정신응급센터 방문 또는 응급실 방문',
    supportMessage:
      '지금 경험하고 있는 것들이 굉장히 힘들게 느껴지겠어요.\n\n' +
      '정신건강위기상담전화 1577-0199에 연락하시면 가까운 정신건강복지센터를 무료로 안내받을 수 있어요.\n\n' +
      '전문가의 도움을 받는 것이 지금 가장 필요하고, 용기 있는 선택이에요.',
  },

  monitor: {
    diagnosis: '지속된 절망감 (Persistent Hopelessness - Monitoring)',
    crisisLevel: '위험 신호 감지 — 전문가 상담 필요',
    immediateAction: '가까운 정신건강복지센터(무료) 상담 예약\n또는 동네 보건소 정신건강 클리닉 방문',
    supportMessage:
      '오랫동안 많이 무거우셨겠어요. 그 무게가 느껴져요.\n\n' +
      '가까운 정신건강복지센터(무료)에서 전문가와 이야기해보시는 건 어떨까요?\n' +
      '치료가 아니라 "이야기 나누기"부터 시작할 수 있어요.\n\n' +
      '오늘의 작은 한 걸음: 검색창에 "내 지역 + 정신건강복지센터"를 검색해봐요.',
  },
}

// =====================================================
// 응답 선택 함수
// =====================================================

export function getMockResponse(domain: ObservationDomain): string {
  const responses = mockDatabase[domain] ?? mockDatabase['General']
  const selected = responses[Math.floor(Math.random() * responses.length)]

  return (
    `[${selected.diagnosis}]\n\n` +
    `자극: ${selected.stimulus}\n` +
    `경로: ${selected.pathophysiology}\n` +
    `반응: ${selected.response}\n` +
    `정서: ${selected.emotion}\n\n` +
    `오늘의 작은 한 걸음: ${selected.therapeuticAction}`
  )
}

export function getCrisisResponse(level: Exclude<CrisisLevel, 'none'>): string {
  const crisis = crisisResponses[level]

  return (
    `[긴급] ${crisis.diagnosis}\n` +
    `심각도: ${crisis.crisisLevel}\n\n` +
    `⚠️ 즉시 조치:\n${crisis.immediateAction}\n\n` +
    `💚 함께하는 메시지:\n${crisis.supportMessage}`
  )
}
