import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

const axisPrompts: Record<string, string> = {
  body: '몸 영역 (이명, 어지러움, 피로감, 두통, 신체 에너지)',
  emotion: '감정 영역 (불안, 긴장, 예민함, 기분 기복, 두려움)',
  relation: '관계 영역 (사람들과의 연결감, 고립감, 대화의 어려움)',
  meaning: '의미 영역 (성취감, 보람, 계획 실행, 삶의 방향)',
}

export async function POST(req: NextRequest) {
  const { axis } = await req.json()
  const context = axisPrompts[axis] ?? axisPrompts.body

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 80,
    messages: [
      {
        role: 'user',
        content: `당신은 CareFlow 앱의 웰니스 탐색 AI입니다. 만성 이명·어지러움 환자가 오늘 하루 "${context}"을 탐색하고 있어요.

이 영역에서 오늘 경험했을 법한 작은 발견이나 관찰을 한국어로 딱 1문장만 생성해주세요.

규칙:
- 진단·조언 금지. "기록"·"경험"·"느낌" 중심 언어 사용
- 접두어 없이 문장만 (예: "오전에는 귀에서 높은 음이 맴돌았어요.")
- 20자 이내로 짧고 자연스럽게`,
      },
    ],
  })

  const text =
    message.content[0].type === 'text'
      ? message.content[0].text.trim()
      : '새로운 기록이 생겼어요.'

  return NextResponse.json({ text })
}
