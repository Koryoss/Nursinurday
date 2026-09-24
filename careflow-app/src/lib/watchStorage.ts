import { NativeEventEmitter, NativeModules } from 'react-native'
import { supabase } from './supabase'

export type WatchObservationInput = {
  episodeId: string
  observedAt: string
  isManualReport: boolean
  posture?: string | null
  note?: string | null
  sampleCount: number
  /** HealthKit 최신 심박 샘플(bpm). 권한이 없거나 값이 없으면 undefined. */
  heartRateBpm?: number | null
  /** HealthKit environmentalAudioExposure 최신 샘플(dB). 권한이 없거나 값이 없으면 undefined. */
  ambientNoiseDb?: number | null
  /** 버튼 탭 후 5초간 가속도 크기 평균(원시 파형 아님). 값이 없으면 undefined. */
  movementLevel?: number | null
}

type WatchBridge = {
  getPendingObservations?: () => Promise<WatchObservationInput[]>
}

const bridge = NativeModules.CareFlowWatchBridge as WatchBridge | undefined

async function saveObservations(observations: WatchObservationInput[]) {
  if (!observations.length) return { ok: true }

  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user
  if (!user) return { ok: false, message: '로그인 후 워치 기록을 동기화할 수 있어요.' }

  const { error } = await supabase
    .from('watch_observations')
    .upsert(
      observations.map(observation => ({
        user_id: user.id,
        episode_id: observation.episodeId,
        observed_at: observation.observedAt,
        is_manual_report: observation.isManualReport,
        posture: observation.posture ?? null,
        note: observation.note ?? null,
        sample_count: observation.sampleCount,
        heart_rate_bpm: observation.heartRateBpm ?? null,
        ambient_noise_db: observation.ambientNoiseDb ?? null,
        movement_level: observation.movementLevel ?? null,
        source: 'apple_watch',
      })),
      { onConflict: 'user_id,episode_id' }
    )

  return error ? { ok: false, message: '워치 기록을 저장하지 못했어요. 연결을 함께 볼까요?' } : { ok: true }
}

/** 앱이 다시 열려도 iPhone에 보관된 워치 기록을 로그인 계정으로 옮긴다. */
export async function syncPendingWatchObservations() {
  if (!bridge?.getPendingObservations) return { ok: true }
  try {
    const observations = await bridge.getPendingObservations()
    return await saveObservations(observations)
  } catch {
    return { ok: false, message: '워치 기록 동기화를 시작하지 못했어요.' }
  }
}

/** 실제 워치 수신 시 열린 대시보드를 새로고침한다. Expo Go에서는 아무 작업도 하지 않는다. */
export function subscribeToWatchObservations(onReceived: () => void) {
  if (!NativeModules.CareFlowWatchBridge) return () => {}
  const emitter = new NativeEventEmitter(NativeModules.CareFlowWatchBridge)
  const subscription = emitter.addListener('careflowWatchObservationReceived', async () => {
    await syncPendingWatchObservations()
    onReceived()
  })
  return () => subscription.remove()
}
