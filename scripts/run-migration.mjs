#!/usr/bin/env node
/**
 * Supabase 마이그레이션 실행 스크립트
 * 사용: SUPABASE_ACCESS_TOKEN=xxx node scripts/run-migration.mjs <파일경로>
 *
 * 토큰 발급: https://supabase.com/dashboard/account/tokens
 */

import { readFile } from 'fs/promises'
import { resolve } from 'path'

const SQL_FILE = process.argv[2]
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  || (await readEnvLocal())

async function readEnvLocal() {
  try {
    const content = await readFile('.env.local', 'utf8')
    const match = content.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)
    return match?.[1]?.trim()
  } catch { return null }
}

if (!SQL_FILE) {
  console.error('사용법: SUPABASE_ACCESS_TOKEN=xxx node scripts/run-migration.mjs <sql-파일>')
  console.error('예시: SUPABASE_ACCESS_TOKEN=xxx node scripts/run-migration.mjs supabase/migrations/0005_evidence_claims.sql')
  process.exit(1)
}

if (!ACCESS_TOKEN) {
  console.error('\n❌ SUPABASE_ACCESS_TOKEN 이 필요합니다.')
  console.error('   1. https://supabase.com/dashboard/account/tokens 접속')
  console.error('   2. "Generate new token" 클릭')
  console.error('   3. 아래처럼 실행:')
  console.error('      SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/run-migration.mjs', SQL_FILE)
  process.exit(1)
}

if (!SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL 을 .env.local 에 설정하세요.')
  process.exit(1)
}

// 프로젝트 레퍼런스 추출 (https://xxx.supabase.co → xxx)
const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0]

const sqlPath = resolve(process.cwd(), SQL_FILE)
const sql = await readFile(sqlPath, 'utf8')

console.log(`\n프로젝트: ${projectRef}`)
console.log(`파일:     ${SQL_FILE}`)
console.log('실행 중...\n')

const res = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  }
)

const body = await res.json().catch(() => ({}))

if (!res.ok) {
  console.error('❌ 실행 실패:', res.status)
  console.error(JSON.stringify(body, null, 2))
  process.exit(1)
}

console.log('✓ 마이그레이션 완료!')
if (body && Object.keys(body).length) console.log(JSON.stringify(body, null, 2))
