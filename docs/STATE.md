# CareFlow 프로젝트 단일 진실 상태판 (Single State of Truth)
**docs/STATE.md — GitHub Repository Master State Board**

- **문서 버전:** v2.4 (GitHub Sync Master)
- **최종 갱신 시각:** 2026-09-24 (KST)
- **단일 진실 공급원(SSOT) 관리:** Gemini Spark (CSO / System Architect)
- **최종 책임 및 임상 감수:** 정유진 CEO & 연구책임자 (Founder & Principal Clinical Validator)
- **동기화 대상 레포지토리:** Koryoss/Nursinurday (careflow-app, study-workspace, supabase)

---

## 1. 현재 활성 스프린트 (Current Active Sprint)
- **스프린트명:** Sprint 3: CareFlow AI Orchestrator 클라이언트 조립 및 임상 하네스 연동
- **작업 브랜치:** `feature/sprint3-orchestrator-client`
- **핵심 목표:**
  1. careflow-app 4대 서브 어시스턴트(Summary, Timeline, Context, Evidence/Guardrail) 런타임 연결
  2. 10대 임상 비넷 하네스 전원 통과 (합격선: 95점 이상 / 가드레일 위반 0건)
  3. Closed Beta 코호트(7~10인) 대상 14일 N-of-1 테스트 배포 준비

---

## 2. 4-AI 실시간 가용성 및 R&R
- 👑 정유진 CEO: 총괄 지휘 및 임상 타당성 최종 서명 날인(Sign-off)
- 🔬 Gemini Spark: 일일 연구 다이제스트, docs/STATE.md 관리, 하네스 채점 및 규제 감사
- 📱 Claude: CPO / Lead App Architect (금요일 10시 복귀 즉시: Context 센서 결합 및 모바일 화면 완성)
- ⚙️ Codex: CTO / Lead Data Engineer (10월 1일 복귀: Supabase RLS 및 백엔드 하네스 자동화)
- 🤖 Kiro: Lead Agentic Engineer (Active: 로컬 브랜치 위생, 스펙 주도 구현, 가드레일 린터 감시)

---

## 3. 비의료기기 4대 Red-Line 코드 검증 원칙 (CF-REG-2026-001)
1. 금지어(FORBIDDEN_TERMS: 진단, 확진, 완치, 병적 악화, 발작 예측, 비정상, 위험 상태, 처방 권고) UI 노출 엄금
2. 7일 이동 개인 기준선 상대적 밴드(낮음/보통/높음) 표현 강제
3. 처방 중립성 (약물 변경 금지 및 주치의 상담 리다이렉트)
4. 1393 위기 안전망 최우선 발동 (자살/자해 키워드 감지 시 즉시 핫라인 렌더링)
