import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  CORE_COPY_EVIDENCE_MAP,
  auditCopyMapping,
  evidenceRefs,
  findCopyMappingsForLine,
  type CopyAuditFlag,
  type EvidenceRef,
} from '@/lib/evidenceRegistry'
import { readdir, readFile } from 'fs/promises'
import { join, resolve, relative } from 'path'

export const runtime = 'nodejs'
export const maxDuration = 30

// ── 금지 패턴 레지스트리 ─────────────────────────────────────
const RULES = [
  {
    id: 'DIAG-01', label: '진단 표현',
    re: /진단(입니다|합니다|됩니다|결과|서|명\b|적\s|을\s*내|받았)/,
    desc: 'SPEC §0: 비의료기기 — 진단 표현 금지',
  },
  {
    id: 'PROG-01', label: '예후·예측',
    re: /예후(가|는|를|입니다)|예측됩니다|예상됩니다|호전될\s*것|악화될\s*것/,
    desc: 'SPEC §0: 예후 예측 금지',
  },
  {
    id: 'SEVE-01', label: '중증도 판정',
    re: /중증도|경증|중등도|중증(의|이|을|에\s*해당)|심각도\s*판정/,
    desc: 'SPEC §0: 중증도 판정 금지',
  },
  {
    id: 'NORM-01', label: '정상/비정상 판정',
    re: /정상(입니다|범위|수치|소견|이에요|이라고)|비정상|이상\s*소견|정상임\b/,
    desc: 'SPEC §0: 정상/비정상 판정 금지',
  },
  {
    id: 'PRESC-01', label: '처방·치료 지시',
    re: /처방(하세요|합니다|됩니다|받으세요)|VRT.*처방|재활.*처방|복용\s*하세요|치료\s*받으세요/,
    desc: 'SPEC §0: 치료·재활 처방 금지',
  },
  {
    id: 'CUTOFF-01', label: '임상 컷오프 숫자',
    re: /\d+\s*점\s*(이상|이하)(이면|이라면|일\s*때|기준|에\s*해당|을\s*넘)|\d+점\s*컷오프|컷오프\s*\d+/,
    desc: 'SPEC §2: 임상 컷오프 하드코딩 금지',
  },
  {
    id: 'CAUSAL-01', label: '상관→인과 표현',
    re: /때문에\s*(발생|악화|유발|생긴|나타난)|원인(은|이)\s*(이명|어지럼|메니에르)/,
    desc: 'SPEC §0: 상관관계를 인과관계로 표현 금지',
  },
]

const ASSERTION_RULE = {
  id: 'ASSERT-01', label: '근거 없는 단정 표현',
  desc: '근거 #번호가 없는 핵심 사용자 문구의 단정 표현 후보',
}

const CORE_COPY_RE = /지표|band|기준선|최근\s*기록|관찰|흐름|걸음|활동\s*범위|DHI|THI|HADS|VSS|외부자원|비의료기기/
const ASSERTIVE_COPY_RE = /입니다|합니다|됩니다|제공합니다|돕습니다|확인합니다|말하지\s*않습니다|이어가며|만들어요/

const EXEMPT_RE = [
  /대체하지\s*않습니다/,
  /의료\s*자문이\s*아닙니다/,
  /전문\s*의료진.*상담/,
  /의료기기가\s*아닙니다/,
  /비의료기기/,
  /금지.*합니다|하지\s*않습니다/,
  /SPEC|AGENTS|규칙:|패턴:/,
  /\/\/.*금지/,
]

const SKIP_LINE_RE = [
  /^\s*(import|export type|type\s+\w|interface\s+\w)/,
  /^\s*(\/\/|\/\*|\*)/,
  /^\s*re:\s*\//,       // 규칙 배열의 정규식 정의 라인
  /^\s*id:\s*'[A-Z]/,   // 규칙 id 정의
  /^\s*label:\s*'/,      // 규칙 label 정의
  /errors\.push\(/,      // 서버 내부 검증 오류 (사용자 미노출)
]

const SKIP_FILES = [/api\/study\/audit/]

type Finding = {
  file: string
  line: number
  col: number
  matched: string
  context: string
  ruleId: string
  label: string
  desc: string
  registry_numbers?: string[]
  registry_evidence?: EvidenceRef[]
  unmapped_assertion?: boolean
}

type CoreCopyClaimAudit = {
  key: string
  phrase: string
  surface: string
  note: string
  registry_numbers: string[]
  registry_evidence: EvidenceRef[]
  flags: CopyAuditFlag[]
}

async function collectFiles(dir: string, exts: string[]): Promise<string[]> {
  const results: string[] = []
  let entries
  try { entries = await readdir(dir, { withFileTypes: true }) } catch { return results }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.next') continue
    const fullPath = join(dir, e.name)
    if (e.isDirectory()) results.push(...await collectFiles(fullPath, exts))
    else if (exts.some(ext => e.name.endsWith(ext))) results.push(fullPath)
  }
  return results
}

function lintFile(filePath: string, content: string): Finding[] {
  const lines = content.split('\n')
  const findings: Finding[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!/[가-힣]/.test(line)) continue
    if (SKIP_LINE_RE.some(r => r.test(line))) continue
    if (EXEMPT_RE.some(r => r.test(line))) continue
    const mappings = findCopyMappingsForLine(line)
    const registryEvidence = evidenceRefs(Array.from(new Set(mappings.flatMap(mapping => mapping.evidenceIds))))

    for (const rule of RULES) {
      const match = rule.re.exec(line)
      if (!match) continue
      findings.push({
        file: filePath,
        line: i + 1,
        col: match.index + 1,
        matched: match[0],
        context: line.trim().slice(0, 120),
        ruleId: rule.id,
        label: rule.label,
        desc: rule.desc,
        registry_numbers: registryEvidence.map(entry => `#${entry.id}`),
        registry_evidence: registryEvidence,
      })
    }

    if (CORE_COPY_RE.test(line) && ASSERTIVE_COPY_RE.test(line) && registryEvidence.length === 0) {
      const match = ASSERTIVE_COPY_RE.exec(line)
      findings.push({
        file: filePath,
        line: i + 1,
        col: (match?.index ?? 0) + 1,
        matched: match?.[0] ?? line.trim().slice(0, 30),
        context: line.trim().slice(0, 120),
        ruleId: ASSERTION_RULE.id,
        label: ASSERTION_RULE.label,
        desc: ASSERTION_RULE.desc,
        unmapped_assertion: true,
      })
    }
  }
  return findings
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const root = resolve(process.cwd())
  const allFiles = await collectFiles(join(root, 'app'), ['.tsx', '.ts'])
  const tsxFiles = allFiles.filter(f => !SKIP_FILES.some(r => r.test(f)))

  const violations: Finding[] = []
  for (const f of tsxFiles) {
    let content
    try { content = await readFile(f, 'utf8') } catch { continue }
    violations.push(...lintFile(relative(root, f), content))
  }

  const allRules = [...RULES, ASSERTION_RULE]
  const byRule = Object.fromEntries(
    allRules.map(r => [r.id, violations.filter(v => v.ruleId === r.id)])
  )
  const coreCopyClaims: CoreCopyClaimAudit[] = CORE_COPY_EVIDENCE_MAP.map(mapping => {
    const refs = evidenceRefs(mapping.evidenceIds)
    return {
      key: mapping.key,
      phrase: mapping.phrase,
      surface: mapping.surface,
      note: mapping.note,
      registry_numbers: refs.map(entry => `#${entry.id}`),
      registry_evidence: refs,
      flags: auditCopyMapping(mapping),
    }
  })

  return NextResponse.json({
    scanned: tsxFiles.length,
    total: violations.length,
    violations,
    by_rule: byRule,
    rules: allRules.map(r => ({ id: r.id, label: r.label, count: byRule[r.id].length })),
    core_copy_claims: coreCopyClaims,
    core_copy_flagged: coreCopyClaims.filter(item => item.flags.length > 0).length,
    run_at: new Date().toISOString(),
  })
}
