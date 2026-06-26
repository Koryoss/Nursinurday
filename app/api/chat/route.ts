// =====================================================
// AI 채팅 API 라우트 — 기록 기반 자기돌봄 대화
// POST /api/chat
//
// ⚠️ 핵심 원칙: CareFlow는 의료 진단을 하지 않습니다
//    → 사용자의 몸·감정·관계·의미 흐름을 함께 관찰합니다
//    → 진단명, 예후, 치료·처방 표현을 응답 구조로 사용하지 않습니다
//
// 응답 구조: 관찰 문장 + 기록으로 이어지는 질문
//
// 우선순위:
//   0. 위기 감지 (Safety Layer) — 최우선 실행, 의료 전문가 연결
//      🔴 critical → 자살예방상담전화 1393 즉시 안내 + 전문 서비스 우선
//      🟠 urgent   → 정신건강위기상담전화 1577-0199 + 의료 상담 권유
//      🟡 monitor  → 정신건강복지센터 연결 권유 + 자기돌봄
//      🟢 none     → 일상 속 자기돌봄 지원
//   1. AI_MODE=mock  → mockResponses.ts 응답 (API 키 불필요, MVP용)
//   2. AI_MODE=openai → OpenAI GPT-4o + CareFlow 시스템 프롬프트
//   3. AI_MODE=claude → Anthropic Claude + CareFlow 시스템 프롬프트
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { assessMessage, buildSystemPrompt, CareflowAssessment, ConversationMode } from '@/lib/nursingLogic'
import { getMockResponse, getCrisisResponse } from '@/lib/mockResponses'

// ─── 요청/응답 타입 정의 ───

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  mode?: '친근' | '엄격'
}

export interface ChatResponse {
  reply: string                         // 관찰 문장 + 기록 질문
  primaryDomain?: string                // 관찰 영역: Sleep, Energy, BodySignals, EmotionFlow, Tension, SelfView, Relationship, Direction, Growth, General
  activeDomains?: string[]              // 복수 감지 도메인 (여러 영역이 동시에 활성화된 경우)
  axisScores?: Record<string, number>   // 4축 점수 (Body/Emotion/Connection/Meaning × 0-100)
  crisisLevel?: string                  // 위기 수준: 'none' | 'monitor' | 'urgent' | 'critical'
  mode: string                          // 응답 모드: 'mock' | 'openai' | 'claude' | 'crisis' | 'mock-fallback'
}

// ─── 메인 핸들러 (Main Handler) ───
// 들어온 메시지를 분석하여 자기돌봄 기록 질문으로 이어주는 역할
export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json()
    const { messages, mode: convMode = '엄격' } = body

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: '메시지가 없습니다.' }, { status: 400 })
    }

    // 마지막 사용자 메시지 추출 (최신 사용자 입력 분석용)
    const lastUserMessage = messages[messages.length - 1]?.content ?? ''

    // ─── STEP 0: 위기 감지 (Safety-First Layer) ───
    // 정신건강 위기 여부를 즉시 판단
    // crisis detection → 기록보다 외부 도움 연결을 우선 안내
    // 주요 키워드: 자살, 자해, 극단, 절망, 죽음 등
    const assessment: CareflowAssessment = assessMessage(lastUserMessage)
    const { primaryDomain, activeDomains, crisisLevel } = assessment

    if (crisisLevel === 'critical' || crisisLevel === 'urgent') {
      // ─── 즉각 위기 대응 (Immediate Crisis Intervention) ───
      // AI 모델 호출 없이 사전 작성된 안전 메시지 반환
      // critical: 1393(자살예방상담전화) 안내
      // urgent: 1577-0199(정신건강위기상담전화) 안내
      const reply = getCrisisResponse(crisisLevel)

      return NextResponse.json({
        reply,
        primaryDomain,
        activeDomains: activeDomains.map(d => d.domain),
        axisScores: assessment.axisScores,
        crisisLevel,
        mode: 'crisis',
      } as ChatResponse)
    }

    // AI 모드 결정 (.env.local의 AI_MODE 값: 'mock' | 'openai' | 'claude')
    const aiMode = process.env.AI_MODE ?? 'mock'

    // ─── Mock 모드 (API 키 없이 안전한 관찰 질문 제공) ───
    // MVP 테스트 및 API 키 없는 환경에서 사용
    if (aiMode === 'mock' || (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY)) {

      // primaryDomain 기반 관찰 질문 선택 (Sleep, Energy, BodySignals 등)
      let reply = getMockResponse(primaryDomain)

      // monitor 수준 케이스: 자기돌봄 권고 + 지역 정신건강복지센터 연결 정보 추가
      if (crisisLevel === 'monitor' && assessment.referralInfo) {
        reply += `\n\n---\n${assessment.referralInfo.message}`
      }

      return NextResponse.json({
        reply,
        primaryDomain,
        activeDomains: activeDomains.map(d => d.domain),
        axisScores: assessment.axisScores,
        crisisLevel,
        mode: 'mock',
      } as ChatResponse)
    }

    // ─── OpenAI 모드 (GPT-4o + CareFlow 안전 프롬프트) ───
    // buildSystemPrompt(assessment)에서 생성된 시스템 프롬프트:
    // - 검출된 관찰 영역(primaryDomain) 기반 컨텍스트
    // - 4축 신호(axisScores) 반영
    // - 진단·예후·처방 없이 질문형 응답
    if (aiMode === 'openai' && process.env.OPENAI_API_KEY) {
      const { default: OpenAI } = await import('openai')
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

      // 관찰 결과 기반 동적 시스템 프롬프트 생성
      const systemPrompt = buildSystemPrompt(assessment, convMode as ConversationMode)

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        max_tokens: 400,
        temperature: 0.7,  // 창의성과 안정성의 균형
      })

      let reply = completion.choices[0]?.message?.content ?? '응답을 생성하지 못했어요.'

      // monitor 수준: 기관 연결 정보 추가
      if (crisisLevel === 'monitor' && assessment.referralInfo) {
        reply += `\n\n---\n${assessment.referralInfo.message}`
      }

      return NextResponse.json({
        reply,
        primaryDomain,
        activeDomains: activeDomains.map(d => d.domain),
        axisScores: assessment.axisScores,
        crisisLevel,
        mode: 'openai',
      } as ChatResponse)
    }

    // ─── Claude 모드 (Claude Sonnet + CareFlow 안전 프롬프트) ───
    // buildSystemPrompt(assessment)에서 생성된 시스템 프롬프트:
    // - 검출된 관찰 영역(primaryDomain) 기반 컨텍스트
    // - 4축 신호(axisScores) 반영
    // - 진단·예후·처방 없이 질문형 응답
    if (aiMode === 'claude' && process.env.ANTHROPIC_API_KEY) {
      // 관찰 결과 기반 동적 시스템 프롬프트 생성
      const systemPrompt = buildSystemPrompt(assessment, convMode as ConversationMode)

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 400,
          system: systemPrompt,
          messages: messages,
        }),
      })

      if (!response.ok) {
        const err = await response.text()
        throw new Error(`Claude API 오류 ${response.status}: ${err}`)
      }
      const data = await response.json()
      let reply = data.content?.[0]?.text ?? '응답을 생성하지 못했어요.'

      // monitor 수준: 기관 연결 정보 추가
      if (crisisLevel === 'monitor' && assessment.referralInfo) {
        reply += `\n\n---\n${assessment.referralInfo.message}`
      }

      return NextResponse.json({
        reply,
        primaryDomain,
        activeDomains: activeDomains.map(d => d.domain),
        axisScores: assessment.axisScores,
        crisisLevel,
        mode: 'claude',
      } as ChatResponse)
    }

    // ─── 폴백 (Fallback) ───
    // 모드 설정 오류 또는 API 연결 불가 시 mock 모드로 안전하게 처리
    // 안전한 사전작성 관찰 질문 반환
    return NextResponse.json({
      reply: getMockResponse(primaryDomain),
      primaryDomain,
      crisisLevel,
      mode: 'mock-fallback',
    })

  } catch (error) {
    // ─── 에러 핸들링 ───
    console.error('[CareFlow API Error]', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했어요. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}
