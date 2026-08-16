# AI Flow

## 1. AI 목적
CareFlow의 AI는 사용자의 건강 기록을
- 정리하고
- 구조화하고
- 연결하여
장기적인 자기 이해를 지원하는 보조 시스템이다.

## 2. AI Orchestrator
사용자의 요청을 분석하여 필요한 Assistant를 선택하고 결과를 통합한다.

Assistant 구조
Health Record ↓
AI Orchestrator ↓
Summary Assistant ↓
Timeline Assistant ↓
Context Assistant ↓
Evidence Assistant ↓
Structured Record ↓

## 3. Assistant 역할
Record Summary Assistant, Timeline Assistant, Context Assistant, Evidence Assistant

**Record Summary Assistant**
목적 사용자가 작성한 건강 기록을 읽기 쉽고 관리하기 쉬운 형태로 정리합니다.
책임 
- 긴 기록 요약
- 핵심 증상 및 메모 추출
- 반복 내용 정리
- 기록 형식 통일

입력:  건강 기록, 자유 메모, 증상 기록
출력: 요약된 건강 기록, 구조화된 기록

**Timeline Assistant**
목적 건강 기록을 시간의 흐름에 따라 정리하여 장기적인 변화를 쉽게 확인할 수 있도록 지원합니다.
책임
- 일·주·월 단위 기록 정리
- 증상 발생 시점 연결
- 건강 변화 흐름 정리
- 반복 패턴 확인

입력: 현재 건강 기록, 과거 건강 기록
출력: 시간순 건강 기록, 건강 변화 타임라인

**Context Assistant**
목적 현재 기록과 이전 기록을 연결하여 사용자가 자신의 건강 맥락을 이해할 수 있도록 지원합니다.
책임
- 유사한 과거 기록 연결
- 관련 생활 습관 기록 연결
- 이전 메모 연결
- 동일·유사 증상 연결

입력: 현재 및 과거 건강 기록
출력: 관련 기록, 연결된 Context
원칙: 의료적 해석이나 원인 분석은 수행하지 않습니다.

**Evidence Assistant**
목적: 관리자가 참고할 수 있는 의료 근거와 학습 자료를 연결합니다.
책임
- LinkNote 검색
- Study Workspace 검색
- 관련 논문 연결
- 임상 가이드라인 제공

입력: 사용자 건강 기록, 검색 키워드
출력: 관련 의료 근거, 참고 자료, 논문 및 가이드라인
원칙: 의료 근거를 생성하거나 해석하지 않으며, 검토된 자료를 연결하는 역할만 수행합니다.

## 4. AI 처리 흐름
사용자 기록 ↓
Summary ↓
Timeline ↓
Evidence ↓
최종 기록 ↓
* AI가 하지 않는 일: 진단, 처방, 치료 추천, 의료 판단

## 5. 향후 확장
**OCR Assistant** 
목적: 의료 문서를 디지털 건강 기록으로 변환합니다.
예상 기능
- 검사 결과 OCR
- 처방전 OCR
- 의료 문서 텍스트 추출
주의: 의료기기 판정이 필요한 경우인지 명확하게 확인 후 진행할 것

**Voice Assistant**
목적: 음성을 건강 기록으로 변환하여 기록 과정을 간편하게 지원합니다.
예상 기능
- 음성 입력
- 음성 메모 저장
- 음성 → 텍스트 변환
- 기록 자동 정리

**Calendar Assistant**
목적: 건강 기록을 일정과 함께 관리하여 생활 패턴을 쉽게 확인할 수 있도록 지원합니다.
예상 기능
- 병원 방문 일정
- 복약 일정
- 증상 발생 일정
- 생활 습관 일정

**Reflection Assistant**
목적: 장기간의 건강 기록을 되돌아보며 사용자가 자신의 건강 변화를 스스로 이해할 수 있도록 지원합니다.
예상 기능
- 주간·월간 기록 요약
- 장기 변화 정리
- 자주 기록한 증상 확인
- 건강 기록 회고
원칙: 건강 상태를 평가하거나 판단하지 않고, 기록을 기반으로 관찰된 사실만 정리하여 제공합니다.
