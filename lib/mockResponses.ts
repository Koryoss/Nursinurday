import { CrisisLevel, ObservationDomain } from './nursingLogic'

type ObservationReply = {
  opener: string
  question: string
}

const observationReplies: Record<ObservationDomain, ObservationReply[]> = {
  Sleep: [
    {
      opener: '수면 쪽 기록이 오늘 흐름에 함께 보였어요.',
      question: '잠들기 전이나 깬 뒤에 남기고 싶은 몸 신호가 있었나요?',
    },
    {
      opener: '잠과 회복에 대한 단서가 관찰됐어요.',
      question: '오늘 수면이 몸 상태와 어떻게 이어졌는지 함께 볼까요?',
    },
  ],
  Energy: [
    {
      opener: '에너지와 활동 쪽 이야기가 함께 보였어요.',
      question: '오늘 움직임이 부담스럽게 느껴진 순간이 있었나요?',
    },
    {
      opener: '활동 흐름에 남길 만한 단서가 있어 보여요.',
      question: '어느 시간대에 몸이 더 무겁거나 가벼웠는지 적어볼까요?',
    },
  ],
  BodySignals: [
    {
      opener: '몸 신호가 오늘 기록의 중심에 있어 보여요.',
      question: '어지럼, 이명, 두통 같은 신호 중 어떤 것이 가장 또렷했나요?',
    },
    {
      opener: '몸에서 느껴진 변화가 있었네요.',
      question: '0에서 10 사이로 기록한다면 어디에 가까웠나요?',
    },
  ],
  EmotionFlow: [
    {
      opener: '감정 흐름에 남길 만한 단서가 보여요.',
      question: '불안, 예민함, 두려움, 기분 변화 중 무엇이 가까웠나요?',
    },
    {
      opener: '오늘 감정 쪽 기록을 함께 볼 수 있어요.',
      question: '강할수록 10에 가깝게 적는다면 어느 정도였나요?',
    },
  ],
  Tension: [
    {
      opener: '불안이나 긴장 쪽 신호가 함께 보였어요.',
      question: '그 느낌이 어느 시간대에 더 또렷했나요?',
    },
    {
      opener: '긴장감과 관련된 기록을 남길 수 있어요.',
      question: '몸 신호와 같이 나타났는지도 함께 볼까요?',
    },
  ],
  SelfView: [
    {
      opener: '나를 대하는 말투와 관련된 단서가 보여요.',
      question: '오늘 스스로에게 가장 자주 했던 말이 있었나요?',
    },
    {
      opener: '오늘의 자기돌봄 기록으로 남겨볼 수 있어요.',
      question: '조금 덜 엄격하게 볼 수 있었던 순간이 있었나요?',
    },
  ],
  Relationship: [
    {
      opener: '관계와 연결감에 대한 기록이 함께 보였어요.',
      question: '사람들과 함께했는지, 고립감이나 소통의 어려움이 있었는지 함께 볼까요?',
    },
    {
      opener: '관계 축에 남길 수 있는 내용이 있어 보여요.',
      question: '오늘 누군가와 연결되어 있다고 느낀 순간이 있었나요?',
    },
  ],
  Direction: [
    {
      opener: '의미와 방향 쪽 기록으로 이어볼 수 있어요.',
      question: '성취감, 하루의 의미, 계획한 일 중 남기고 싶은 것이 있었나요?',
    },
    {
      opener: '오늘의 의미 축에 작은 단서가 보여요.',
      question: '하루 중 “그래도 이건 있었다” 싶은 순간이 있었나요?',
    },
  ],
  Growth: [
    {
      opener: '변화와 준비에 대한 이야기가 보였어요.',
      question: '지금 기록으로 남기고 싶은 작은 변화가 있나요?',
    },
    {
      opener: '다음 흐름을 함께 보기 좋은 내용이에요.',
      question: '오늘 해본 것 중 계속 지켜보고 싶은 것이 있었나요?',
    },
  ],
  General: [
    {
      opener: '오늘의 흐름을 기록으로 남길 수 있어요.',
      question: '몸, 감정, 관계, 의미 중 어디에 가장 가깝게 느껴졌나요?',
    },
    {
      opener: '말해준 내용을 자기돌봄 기록으로 이어볼 수 있어요.',
      question: '조금 더 남기고 싶은 몸 신호나 감정 신호가 있나요?',
    },
  ],
}

const crisisResponses: Record<Exclude<CrisisLevel, 'none'>, string> = {
  critical:
    '지금은 혼자 견디는 것보다 즉시 연결이 먼저예요.\n\n' +
    '자살예방상담전화 1393 또는 119에 바로 연락해 주세요. 가까운 사람에게 지금 혼자 있지 않겠다고 알려도 좋아요.',
  urgent:
    '지금 느끼는 위험 신호는 혼자만의 기록으로 두지 않는 편이 좋아요.\n\n' +
    '정신건강위기상담전화 1577-0199 또는 가까운 의료진, 지역 응급 자원과 함께 확인해 주세요.',
  monitor:
    '무거운 마음이 반복해서 남아 있다면 기록만으로 버티지 않아도 돼요.\n\n' +
    '가까운 정신건강복지센터나 신뢰할 수 있는 사람과 함께 이야기해볼까요?',
}

export function getMockResponse(domain: ObservationDomain): string {
  const responses = observationReplies[domain] ?? observationReplies.General
  const selected = responses[Math.floor(Math.random() * responses.length)]

  return `${selected.opener}\n${selected.question}`
}

export function getCrisisResponse(level: Exclude<CrisisLevel, 'none'>): string {
  return crisisResponses[level]
}
