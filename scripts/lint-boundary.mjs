#!/usr/bin/env node
/**
 * 경계 카피 린터 — SPEC §0 금지 패턴 검출
 * 사용: node scripts/lint-boundary.mjs [--path app] [--json]
 * 검출만 수행. 자동 수정 없음.
 */

import { readdir, readFile } from 'fs/promises'
import { join, resolve, relative } from 'path'

// ── 금지 패턴 레지스트리 ──────────────────────────────────────
const RULES = [
  {
    id: 'DIAG-01',
    label: '진단 표현',
    re: /진단(입니다|합니다|됩니다|결과|서|명\b|적\s|을\s*내|받았)/,
    desc: 'SPEC §0: 비의료기기 — 진단 표현 금지',
  },
  {
    id: 'PROG-01',
    label: '예후·예측',
    re: /예후(가|는|를|입니다)|예측됩니다|예상됩니다|호전될\s*것|악화될\s*것/,
    desc: 'SPEC §0: 예후 예측 금지',
  },
  {
    id: 'SEVE-01',
    label: '중증도 판정',
    re: /중증도|경증|중등도|중증(의|이|을|에\s*해당)|심각도\s*판정/,
    desc: 'SPEC §0: 중증도 판정 금지',
  },
  {
    id: 'NORM-01',
    label: '정상/비정상 판정',
    re: /정상(입니다|범위|수치|소견|이에요|이라고)|비정상|이상\s*소견|정상임\b/,
    desc: 'SPEC §0: 정상/비정상 판정 금지',
  },
  {
    id: 'PRESC-01',
    label: '처방·치료 지시',
    re: /처방(하세요|합니다|됩니다|받으세요)|VRT.*처방|재활.*처방|복용\s*하세요|치료\s*받으세요/,
    desc: 'SPEC §0: 치료·재활 처방 금지',
  },
  {
    id: 'CUTOFF-01',
    label: '임상 컷오프 숫자',
    re: /\d+\s*점\s*(이상|이하)(이면|이라면|일\s*때|기준|에\s*해당|을\s*넘)|\d+점\s*컷오프|컷오프\s*\d+/,
    desc: 'SPEC §2: 임상 컷오프 하드코딩 금지 (개인 기준선 대비 band만)',
  },
  {
    id: 'CAUSAL-01',
    label: '상관→인과 표현',
    re: /때문에\s*(발생|악화|유발|생긴|나타난)|원인(은|이)\s*(이명|어지럼|메니에르)/,
    desc: 'SPEC §0: 상관관계를 인과관계로 표현 금지',
  },
]

// 이 패턴이 같은 줄에 있으면 면책 → 위반 후보 제외
const EXEMPT_RE = [
  /대체하지\s*않습니다/,
  /의료\s*자문이\s*아닙니다/,
  /전문\s*의료진.*상담/,
  /의료기기가\s*아닙니다/,
  /비의료기기/,
  /금지.*합니다|하지\s*않습니다/,
  /SPEC|AGENTS|규칙:|패턴:/,
  /\/\/.*금지/,                    // 코드 주석에서 규칙 정의
]

// 스킵할 라인 패턴 (임포트·타입·주석·규칙 정의)
const SKIP_LINE_RE = [
  /^\s*(import|export type|type\s+\w|interface\s+\w)/,
  /^\s*(\/\/|\/\*|\*)/,
  /^\s*\/\*\*/,
  /^\s*re:\s*\//,          // 규칙 배열의 정규식 정의 라인
  /^\s*id:\s*'[A-Z]/,      // 규칙 id 정의 라인
  /^\s*label:\s*'/,         // 규칙 label 정의 라인
  /errors\.push\(/,         // 서버 내부 검증 오류 메시지 (사용자 미노출)
]

// 스캔 제외 파일 (메타/인프라 파일)
const SKIP_FILES = [
  /scripts\/lint-boundary/,
  /api\/study\/audit/,
]

// ── 파일 수집 ──────────────────────────────────────────────────
async function collectFiles(dir, exts) {
  const results = []
  let entries
  try { entries = await readdir(dir, { withFileTypes: true }) } catch { return results }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.next') continue
    const fullPath = join(dir, e.name)
    if (e.isDirectory()) {
      results.push(...await collectFiles(fullPath, exts))
    } else if (exts.some(ext => e.name.endsWith(ext))) {
      results.push(fullPath)
    }
  }
  return results
}

// ── 단일 파일 린팅 ────────────────────────────────────────────
function lintFile(filePath, content, isDoc) {
  const lines = content.split('\n')
  const findings = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // 한글 없으면 스킵 (사용자 노출 문자열은 한글 포함 가능성 높음)
    if (!/[가-힣]/.test(line)) continue

    // 임포트·타입·주석 라인 스킵
    if (SKIP_LINE_RE.some(r => r.test(line))) continue

    // 면책 문맥이면 스킵
    if (EXEMPT_RE.some(r => r.test(line))) continue

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
        isDoc,
      })
    }
  }
  return findings
}

// ── 메인 ──────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2)
  const jsonMode = args.includes('--json')
  const root = resolve(process.cwd())

  const allTsx = await collectFiles(join(root, 'app'), ['.tsx', '.ts'])
  const tsxFiles = allTsx.filter(f => !SKIP_FILES.some(r => r.test(f)))
  const specFiles = [join(root, 'careflow/docs/SPEC.md'), join(root, 'docs/SPEC.md')]
    .filter(p => { try { return true } catch { return false } })

  const all = [
    ...tsxFiles.map(f => ({ f, isDoc: false })),
    ...specFiles.map(f => ({ f, isDoc: true })),
  ]

  const findings = []
  for (const { f, isDoc } of all) {
    let content
    try { content = await readFile(f, 'utf8') } catch { continue }
    findings.push(...lintFile(relative(root, f), content, isDoc))
  }

  const violations = findings.filter(f => !f.isDoc)
  const docNotes   = findings.filter(f => f.isDoc)

  if (jsonMode) {
    process.stdout.write(JSON.stringify({ violations, doc_notes: docNotes, total: findings.length }, null, 2))
    return
  }

  // ── 텍스트 출력 ──
  console.log('\n경계 카피 린터 — SPEC §0 금지 패턴 검출')
  console.log('='.repeat(60))
  console.log(`스캔: ${tsxFiles.length}개 TSX/TS 파일`)
  console.log(`결과: ${violations.length}개 위반 후보 | ${docNotes.length}개 정책 문서 참고\n`)

  if (violations.length === 0) {
    console.log('✓ 위반 후보 없음\n')
  } else {
    console.log('── 위반 후보 (' + violations.length + ') ─────────────────────────────')
    for (const v of violations) {
      console.log(`\n  [${v.ruleId}] ${v.label}`)
      console.log(`  파일  : ${v.file}:${v.line}:${v.col}`)
      console.log(`  매칭  : "${v.matched}"`)
      console.log(`  문맥  : ${v.context}`)
      console.log(`  사유  : ${v.desc}`)
    }
    console.log()
  }

  if (docNotes.length > 0) {
    console.log('── 정책 문서 참고 (위반 아님) ─────────────────────────')
    for (const n of docNotes) {
      console.log(`  ${n.file}:${n.line} — [${n.ruleId}] "${n.matched}"`)
    }
    console.log()
  }

  console.log('자동 수정 없음. 검출·보고만 수행합니다.')
  process.exit(violations.length > 0 ? 1 : 0)
}

main().catch(e => { console.error(e); process.exit(2) })
