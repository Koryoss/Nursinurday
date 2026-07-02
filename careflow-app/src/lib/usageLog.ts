// 베타 사용성 이벤트 로깅 (H1: 기록이 지속되는가 검증용)
// 실패해도 앱 흐름을 막지 않는 fire-and-forget 방식.
import { supabase } from './supabase'

export type UsageEventName = 'screen_view' | 'record_start' | 'record_save' | 'record_abandon'

export function logUsage(event: UsageEventName, screen?: string, meta?: Record<string, unknown>) {
  supabase.auth
    .getUser()
    .then(({ data }) => {
      const user = data.user
      if (!user || user.is_anonymous) return
      return supabase.from('usage_events').insert({
        user_id: user.id,
        event,
        screen: screen ?? null,
        meta: meta ?? null,
        client: 'app',
      })
    })
    .then(result => {
      if (result?.error && __DEV__) console.warn('[usageLog]', result.error.message)
    })
    .catch(() => {
      // 네트워크 오류 등은 조용히 무시 — 사용 흐름 우선
    })
}
