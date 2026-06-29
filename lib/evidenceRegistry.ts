export type EvidenceStrength = '강' | '중' | '약'
export type EvidenceSafety = '안전' | '주의'

export type EvidenceRegistryEntry = {
  id: number
  claim: string
  source: string
  strength: EvidenceStrength
  application: string
  safety: EvidenceSafety
  safetyNote: string
  match: RegExp
}

export type EvidenceRef = Pick<
  EvidenceRegistryEntry,
  'id' | 'claim' | 'source' | 'strength' | 'safety' | 'safetyNote'
>

export type CopyEvidenceMapping = {
  key: string
  phrase: string
  evidenceIds: number[]
  surface: 'indicator_description' | 'band' | 'observation' | 'safety' | 'weekly_checkin' | 'voice_record'
  note: string
}

export type CopyAuditFlag = {
  code: 'NO_EVIDENCE' | 'CAUTION_LIMIT' | 'WEAK_ASSERTION' | 'UNSUPPORTED_ASSERTION'
  message: string
}

export const EVIDENCE_REGISTRY: EvidenceRegistryEntry[] = [
  {
    id: 1,
    claim: '어지럼(R42) 연 진료 약 100만, 이명 약 36만',
    source: 'HIRA 시장통계',
    strength: '강',
    application: '제안서 시장·홈',
    safety: '안전',
    safetyNote: '사실 진술',
    match: /어지럼|이명|진료|시장|HIRA|건강보험/,
  },
  {
    id: 2,
    claim: '메니에르 여성 69%·외래 99%, BPPV +28%',
    source: 'HIRA 질병세분류',
    strength: '강',
    application: '타겟·제안서',
    safety: '안전',
    safetyNote: '사실 진술',
    match: /메니에르|BPPV|외래|여성|질병세분류/,
  },
  {
    id: 3,
    claim: '전정질환 진료 92~99%가 외래(관리 공백)',
    source: 'HIRA',
    strength: '강',
    application: '문제 정의·비전',
    safety: '안전',
    safetyNote: '사실 진술',
    match: /전정질환|외래|관리\s*공백/,
  },
  {
    id: 4,
    claim: 'HRV가 이명 관련 스트레스의 추적 지표 가능성',
    source: 'Reinhart 2021 (DOI 10.1044/2021_JSLHR-20-00596)',
    strength: '중',
    application: '설계안 신호축·메커니즘 도면',
    safety: '안전',
    safetyNote: '설계 근거, 사용자 비노출',
    match: /HRV|심박|자율신경|스트레스|오늘의\s*여유/,
  },
  {
    id: 5,
    claim: 'IMU 보행 동적안정성으로 불균형 식별',
    source: 'Castiglia 2024 (10.3390/s24237627)',
    strength: '중',
    application: '걸음 안정도 지표·설계안',
    safety: '주의',
    safetyNote: '지표는 잠정·band만',
    match: /IMU|보행|걸음|걷기|안정도|불균형/,
  },
  {
    id: 6,
    claim: '수면장애가 어지럼 핸디캡·불안 증폭',
    source: 'Sugaya 2016 (10.1080/00016489.2016.1213418)',
    strength: '중',
    application: '수면 기록·SPEC §3',
    safety: '안전',
    safetyNote: '수면 기록 설계 근거',
    match: /수면|잠|어지럼|불안|긴장/,
  },
  {
    id: 7,
    claim: '메니에르 양측화 13%·평균 8.2년(조기개입 근거)',
    source: 'Hudson 2025 메타 (10.1097/MAO.0000000000004491)',
    strength: '강',
    application: '제안서 조기개입·비전',
    safety: '안전',
    safetyNote: '인용',
    match: /양측화|조기개입|8\.2|13%|메타/,
  },
  {
    id: 8,
    claim: '발작 빈도는 초기 최다 후 감소(반전)',
    source: 'Perez-Garrigues 2008 (10.1001/archotol.134.11.1149)',
    strength: '중',
    application: '설계안 부록·서사',
    safety: '안전',
    safetyNote: '인용',
    match: /발작|빈도|초기|감소/,
  },
  {
    id: 9,
    claim: '메니에르 QoL은 통제감·불안이 좌우',
    source: 'Yardley 2003 (Clin Otolaryngol)',
    strength: '중',
    application: '4축·비전',
    safety: '안전',
    safetyNote: '삶의 질·통제감 프레임 근거',
    match: /QoL|삶의\s*질|통제감|불안|4축|감정/,
  },
  {
    id: 10,
    claim: '외상 후 사회적응에 지지가 조절 효과',
    source: '김민성·우경미 2025 (보건사회연구)',
    strength: '중',
    application: '사회복귀 프레임·관계 축',
    safety: '안전',
    safetyNote: '사회복귀·관계 축 참고 근거',
    match: /사회복귀|사회적응|지지|관계|외부자원/,
  },
  {
    id: 11,
    claim: '자유텍스트→4축 분류(챗→기록)',
    source: 'Mitha·Woo·Topaz 2023 (10.1097/CIN.0000000000000967)',
    strength: '중',
    application: '음성/챗 초안·SPEC',
    safety: '주의',
    safetyNote: '분류는 보조',
    match: /자유텍스트|챗|대화|음성|기록\s*초안|분류|4축/,
  },
  {
    id: 12,
    claim: '개인 7일 기준선 대비 band(낮음/보통/높음)',
    source: '설계 정의(잠정)',
    strength: '약',
    application: '지표 화면·SPEC §2',
    safety: '주의',
    safetyNote: '임상 컷오프 아님 명시 필수',
    match: /7일|기준선|최근\s*기록|band|밴드|낮음|보통|높음|평소/,
  },
  {
    id: 13,
    claim: '오늘의 여유·걸음 안정성·활동 범위',
    source: '설계 정의(잠정)',
    strength: '약',
    application: '대시보드',
    safety: '주의',
    safetyNote: '잠정 표기·검증 전',
    match: /오늘의\s*여유|걸음\s*안정|활동\s*범위|대시보드|지표/,
  },
  {
    id: 14,
    claim: '보행 불안↔두통 동반, 오전 어지럼 최고',
    source: 'N-of-1 9주(n=9)',
    strength: '약',
    application: '추세·관찰된 연관·리포트',
    safety: '주의',
    safetyNote: '상관≠인과·소표본',
    match: /보행\s*불안|걷기\s*불안|두통|오전|함께\s*오르내|연관|상관/,
  },
  {
    id: 15,
    claim: 'DHI·THI·HADS·VSS-SF는 추세용(판정 아님)',
    source: '척도 원전',
    strength: '중',
    application: '주간 체크인',
    safety: '주의',
    safetyNote: '판정 금지·라이선스',
    match: /DHI|THI|HADS|VSS|주간\s*체크인|추세용|판정/,
  },
  {
    id: 16,
    claim: 'VRT는 처방이 아니라 수행 보조·기록',
    source: '설계안 부록 C',
    strength: '중',
    application: '해당 시 기록 보조',
    safety: '주의',
    safetyNote: '동작 처방 금지',
    match: /VRT|재활|수행\s*보조|동작/,
  },
  {
    id: 17,
    claim: '비의료기기 · 진단/예후/처방 미산출',
    source: '제품원칙·SPEC §0',
    strength: '강',
    application: '전 화면·면책',
    safety: '안전',
    safetyNote: '제품 원칙',
    match: /비의료기기|진단|예후|처방|의료진|외부자원|자기관찰|정상치/,
  },
]

// 앱 핵심 사용자 문구 -> 근거 # 매핑표. 지표 설명·band·관찰 문구는 여기서 추적한다.
export const CORE_COPY_EVIDENCE_MAP: CopyEvidenceMapping[] = [
  {
    key: 'indicator-band-recent-record',
    phrase: '개인 최근 기록보다 높게/낮게/비슷하게 관찰돼요. 오늘 기록을 함께 볼까요?',
    evidenceIds: [12, 13, 17],
    surface: 'band',
    note: 'band는 개인 7일 기준선 대비 잠정 지표이며 임상 컷오프가 아니다.',
  },
  {
    key: 'indicator-baseline-landing',
    phrase: '최근 기록을 기준으로 평소와의 차이를 관찰',
    evidenceIds: [12, 17],
    surface: 'indicator_description',
    note: '절대 정상치가 아니라 개인 기준선 대비 관찰로 제한한다.',
  },
  {
    key: 'indicator-no-cutoff',
    phrase: '개인 기준선 대비 band만 사용하고 절대 정상치나 예후 확률은 제공하지 않습니다',
    evidenceIds: [12, 17],
    surface: 'safety',
    note: 'SPEC §0·§2의 비의료기기 경계 문구다.',
  },
  {
    key: 'observed-correlation-gait-headache',
    phrase: '걷기 불안과 두통이 함께 오르내리는 흐름이 관찰돼요',
    evidenceIds: [14, 17],
    surface: 'observation',
    note: 'N-of-1 소표본 근거라 관찰·상관 표현으로만 제한한다.',
  },
  {
    key: 'observed-correlation-disclaimer',
    phrase: '상관(연관)일 뿐, 원인·진단 아님',
    evidenceIds: [14, 17],
    surface: 'safety',
    note: '상관을 인과로 표현하지 않도록 붙이는 제한 문구다.',
  },
  {
    key: 'weekly-checkin-trend-only',
    phrase: 'DHI · THI · HADS · VSS-SF는 추세용 · 판정 아님',
    evidenceIds: [15, 17],
    surface: 'weekly_checkin',
    note: '척도는 추세 확인에만 쓰고 판정하지 않는다.',
  },
  {
    key: 'voice-record-draft',
    phrase: '오늘 하루를 말하면 기록 초안을 함께 만들어요',
    evidenceIds: [11, 17],
    surface: 'voice_record',
    note: '자유텍스트 분류는 보조 초안으로만 사용한다.',
  },
  {
    key: 'safety-referral',
    phrase: '증상·불안이 클 땐 지표 대신 의료진·외부자원 연계를 우선 안내',
    evidenceIds: [10, 17],
    surface: 'safety',
    note: '위험 신호에서는 지표보다 외부 도움 연결을 우선한다.',
  },
]

const ASSERTIVE_RE = /입니다|합니다|됩니다|제공합니다|좌우|식별|증폭|예측|진단|처방|정상치|예후/
const LIMITED_RE = /관찰|함께\s*볼까요|고려|추세용|판정\s*아님|아님|제공하지\s*않습니다|대신|우선|초안|보조|잠정|예비|가능성|기준/

export function evidenceRefs(ids: number[]): EvidenceRef[] {
  return ids
    .map(id => EVIDENCE_REGISTRY.find(entry => entry.id === id))
    .filter((entry): entry is EvidenceRegistryEntry => Boolean(entry))
    .map(({ id, claim, source, strength, safety, safetyNote }) => ({ id, claim, source, strength, safety, safetyNote }))
}

export function matchEvidenceForClaim(text: string, limit = 5): EvidenceRef[] {
  const normalized = text.trim()
  if (!normalized) return []

  const matches = EVIDENCE_REGISTRY
    .map(entry => ({
      entry,
      score: entry.match.test(normalized) ? 2 : 0,
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.id - b.entry.id)
    .slice(0, limit)

  return evidenceRefs(matches.map(item => item.entry.id))
}

export function safetyGuidanceForEvidence(refs: EvidenceRef[]) {
  const hasCaution = refs.some(ref => ref.safety === '주의')
  const hasWeak = refs.some(ref => ref.strength === '약')
  const messages: string[] = []
  if (hasCaution) messages.push("안전도 '주의': 사용자 노출 시 관찰·질문형으로 제한하고 진단·예후·처방 표현을 피하세요.")
  if (hasWeak) messages.push("근거강도 '약': 단정하지 말고 '잠정', '예비', '관찰된' 표현으로 한정하세요.")
  return messages
}

export function auditCopyMapping(mapping: CopyEvidenceMapping): CopyAuditFlag[] {
  const refs = evidenceRefs(mapping.evidenceIds)
  const flags: CopyAuditFlag[] = []

  if (refs.length === 0) {
    flags.push({ code: 'NO_EVIDENCE', message: '핵심 사용자 문구에 연결된 근거 #번호가 없습니다.' })
  }

  const hasCaution = refs.some(ref => ref.safety === '주의')
  const hasWeak = refs.some(ref => ref.strength === '약')
  if (hasCaution && !LIMITED_RE.test(mapping.phrase)) {
    flags.push({ code: 'CAUTION_LIMIT', message: "안전도 '주의' 근거는 관찰·질문형·판정 아님 같은 제한 표현이 필요합니다." })
  }
  if (hasWeak && ASSERTIVE_RE.test(mapping.phrase) && !LIMITED_RE.test(mapping.phrase)) {
    flags.push({ code: 'WEAK_ASSERTION', message: "근거강도 '약' 문구는 단정 표현을 피해야 합니다." })
  }
  if (refs.length === 0 && ASSERTIVE_RE.test(mapping.phrase)) {
    flags.push({ code: 'UNSUPPORTED_ASSERTION', message: '근거 없는 단정 표현 후보입니다.' })
  }

  return flags
}

const COPY_LINE_MATCHERS: Record<string, RegExp> = {
  'indicator-band-recent-record': /개인\s*최근\s*기록|오늘\s*기록을\s*함께/,
  'indicator-baseline-landing': /최근\s*기록.*(기준|평소|차이)|7.*일.*기준|평소와의\s*차이/,
  'indicator-no-cutoff': /개인\s*기준선|절대\s*정상치|예후\s*확률|band만/,
  'observed-correlation-gait-headache': /걷기\s*불안.*두통|함께\s*오르내리는\s*흐름/,
  'observed-correlation-disclaimer': /상관.*원인.*진단|원인·진단\s*아님/,
  'weekly-checkin-trend-only': /DHI|THI|HADS|VSS-SF|추세용.*판정/,
  'voice-record-draft': /하루를\s*말하면|기록\s*초안|초안\s*확인/,
  'safety-referral': /의료진|외부자원|비의료기기|자기관찰\s*도구/,
}

export function findCopyMappingsForLine(line: string) {
  return CORE_COPY_EVIDENCE_MAP.filter(mapping => {
    const matcher = COPY_LINE_MATCHERS[mapping.key]
    if (matcher?.test(line)) return true
    return line.includes(mapping.phrase) || line.includes(mapping.key)
  })
}
