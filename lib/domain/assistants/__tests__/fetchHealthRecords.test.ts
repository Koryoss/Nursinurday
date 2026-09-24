import { describe, expect, it } from 'vitest'
import { isValidDateRange } from '../fetchHealthRecords'

describe('isValidDateRange', () => {
  it('유효한 범위는 null을 반환한다', () => {
    expect(isValidDateRange('2026-08-01', '2026-08-10')).toBeNull()
  })

  it('from과 to가 같으면 유효하다', () => {
    expect(isValidDateRange('2026-08-01', '2026-08-01')).toBeNull()
  })

  it('YYYY-MM-DD 형식이 아니면 에러 메시지를 반환한다', () => {
    expect(isValidDateRange('2026/08/01', '2026-08-10')).not.toBeNull()
    expect(isValidDateRange('2026-08-01', 'not-a-date')).not.toBeNull()
  })

  it('실제로 존재하지 않는 날짜는 에러 메시지를 반환한다', () => {
    expect(isValidDateRange('2026-02-30', '2026-08-10')).not.toBeNull()
  })

  it('from이 to보다 이후면 에러 메시지를 반환한다', () => {
    expect(isValidDateRange('2026-08-10', '2026-08-01')).not.toBeNull()
  })
})
