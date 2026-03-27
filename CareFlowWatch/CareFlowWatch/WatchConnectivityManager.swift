// ============================================================================
// CareFlow Watch — Watch Connectivity Manager (iOS side)
// ============================================================================
// iPhone ↔ Apple Watch 실시간 통신
// Watch에서 감지된 어지럼증 에피소드를 iPhone으로 수신
// ============================================================================

import Foundation
import WatchConnectivity
import Combine

class WatchConnectivityManager: NSObject, ObservableObject {

    @Published var isReachable = false
    @Published var recentEpisodes: [DizzinessEpisode] = []
    @Published var lastMessage: String = ""
    @Published var recentVoiceAlerts: [VoiceAlertRecord] = []  // v3.1: Watch에서 수신한 음성 알림

    private var session: WCSession?

    // v3.1: 매니저 참조 — iOS App Entry Point에서 주입
    weak var contextManager: DailyContextManager?
    weak var locationTracker: LocationTracker?

    /// HealthKit 기저 심박수를 Watch로 전달하기 위한 콜백
    var onBaselineHRNeeded: (() -> Double)?

    override init() {
        super.init()

        if WCSession.isSupported() {
            session = WCSession.default
            session?.delegate = self
            session?.activate()
        }
    }

    /// Watch로 동기화 요청 전송
    func requestSync() {
        guard let session = session, session.isReachable else {
            lastMessage = "Apple Watch에 연결할 수 없습니다."
            return
        }

        session.sendMessage(
            [WatchMessageKey.requestSync.rawValue: true],
            replyHandler: { reply in
                DispatchQueue.main.async {
                    self.lastMessage = "동기화 완료"
                }
            },
            errorHandler: { error in
                DispatchQueue.main.async {
                    self.lastMessage = "동기화 실패: \(error.localizedDescription)"
                }
            }
        )
    }

    // MARK: - v3.1: iPhone → Watch 데이터 전송

    /// DailyContext 변경사항을 Watch로 전송
    func sendDailyContextToWatch(_ context: DailyContext) {
        guard let session = session, session.isReachable else { return }

        do {
            let data = try JSONEncoder().encode(context)
            session.sendMessage(
                [WatchMessageKey.dailyContext.rawValue: data],
                replyHandler: nil,
                errorHandler: { error in
                    print("DailyContext Watch 전송 실패: \(error)")
                }
            )
        } catch {
            print("DailyContext 인코딩 실패: \(error)")
        }
    }

    /// HealthKit 기저 심박수를 Watch Detector로 전송
    func sendBaselineHRToWatch(_ restingHR: Double) {
        guard let session = session, session.isReachable else { return }

        session.sendMessage(
            ["baseline_hr": restingHR],
            replyHandler: nil,
            errorHandler: { error in
                print("기저 심박수 Watch 전송 실패: \(error)")
            }
        )
    }

    /// 현재 위치 정보를 Watch로 전송 (장소 이름)
    func sendLocationToWatch(_ placeName: String) {
        guard let session = session, session.isReachable else { return }

        session.sendMessage(
            [WatchMessageKey.locationUpdate.rawValue: placeName],
            replyHandler: nil,
            errorHandler: nil
        )
    }

    // MARK: - 서버 중계

    /// 어지럼증 에피소드를 CareFlow 서버로 중계
    private func relayEpisodeToServer(_ episode: DizzinessEpisode) {
        Task {
            let client = CareFlowAPIClient()
            do {
                let response = try await client.sendDizzinessEpisode(episode)
                print("에피소드 서버 전송 완료: \(response.message)")
            } catch {
                print("에피소드 서버 전송 실패: \(error)")
            }
        }
    }

    /// v3.1: HealthKit 일일 데이터를 서버로 전송
    func syncHealthKitDataToServer(_ data: HealthKitDailyData) {
        Task {
            let client = CareFlowAPIClient()
            do {
                let response = try await client.sendHealthKitData(data)
                print("HealthKit 데이터 서버 전송 완료: \(response.message)")
            } catch {
                print("HealthKit 데이터 서버 전송 실패: \(error)")
            }
        }
    }
}

// MARK: - WCSessionDelegate

extension WatchConnectivityManager: WCSessionDelegate {

    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        DispatchQueue.main.async {
            self.isReachable = session.isReachable
        }
    }

    func sessionDidBecomeInactive(_ session: WCSession) {
        DispatchQueue.main.async {
            self.isReachable = false
        }
    }

    func sessionDidDeactivate(_ session: WCSession) {
        // 재활성화
        session.activate()
    }

    func sessionReachabilityDidChange(_ session: WCSession) {
        DispatchQueue.main.async {
            self.isReachable = session.isReachable
        }
    }

    /// Watch에서 메시지 수신
    func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {

        // 어지럼증 에피소드 수신
        if let episodeData = message[WatchMessageKey.dizzinessEpisode.rawValue] as? Data {
            do {
                let decoder = JSONDecoder()
                decoder.dateDecodingStrategy = .iso8601
                let episode = try decoder.decode(DizzinessEpisode.self, from: episodeData)

                DispatchQueue.main.async {
                    self.recentEpisodes.insert(episode, at: 0)
                    if self.recentEpisodes.count > 50 {
                        self.recentEpisodes.removeLast()
                    }
                }

                // v3.1: 에피소드 발생 위치 자동 기록
                locationTracker?.recordEpisodeAtCurrentLocation()

                // CareFlow 서버로 중계
                relayEpisodeToServer(episode)

                replyHandler(["status": "received"])
            } catch {
                replyHandler(["status": "decode_error"])
            }
        }

        // v3.1: Watch에서 수동 보고 수신
        if let reportData = message[WatchMessageKey.manualReport.rawValue] as? Data {
            do {
                let decoder = JSONDecoder()
                decoder.dateDecodingStrategy = .iso8601
                let report = try decoder.decode(ManualDizzinessReport.self, from: reportData)

                // 수동 보고도 에피소드 히스토리에 추가
                var episode = DizzinessEpisode()
                episode.peakSeverity = report.severity
                episode.isManualReport = true
                episode.dailyContext = report.context
                episode.voiceLevelAtStart = report.voiceLevelAtTime

                DispatchQueue.main.async {
                    self.recentEpisodes.insert(episode, at: 0)
                }

                locationTracker?.recordEpisodeAtCurrentLocation()

                replyHandler(["status": "manual_received"])
            } catch {
                replyHandler(["status": "decode_error"])
            }
        }

        // v3.1: Watch에서 DailyContext 변경 수신
        if let contextData = message[WatchMessageKey.dailyContext.rawValue] as? Data {
            do {
                let context = try JSONDecoder().decode(DailyContext.self, from: contextData)
                DispatchQueue.main.async {
                    self.contextManager?.setDayType(context.dayType)
                    self.contextManager?.recordMedication(taken: context.medicationTaken)
                }
                replyHandler(["status": "context_synced"])
            } catch {
                replyHandler(["status": "decode_error"])
            }
        }

        // v3.1: Watch에서 음성 알림 수신
        if let voiceData = message[WatchMessageKey.voiceAlert.rawValue] as? Data {
            do {
                let alert = try JSONDecoder().decode(VoiceAlertRecord.self, from: voiceData)
                DispatchQueue.main.async {
                    self.recentVoiceAlerts.insert(alert, at: 0)
                    if self.recentVoiceAlerts.count > 50 {
                        self.recentVoiceAlerts.removeLast()
                    }
                }
                replyHandler(["status": "voice_alert_received"])
            } catch {
                replyHandler(["status": "decode_error"])
            }
        }

        // 센서 실시간 업데이트
        if let _ = message[WatchMessageKey.sensorUpdate.rawValue] {
            replyHandler(["status": "ok"])
        }

        // v3.1: Watch가 기저 HR 요청
        if let _ = message["request_baseline_hr"] as? Bool {
            let baselineHR = onBaselineHRNeeded?() ?? 72.0
            replyHandler(["baseline_hr": baselineHR])
        }
    }

    /// Watch에서 백그라운드 데이터 수신
    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
        if let episodeData = userInfo[WatchMessageKey.dizzinessEpisode.rawValue] as? Data {
            do {
                let decoder = JSONDecoder()
                decoder.dateDecodingStrategy = .iso8601
                let episode = try decoder.decode(DizzinessEpisode.self, from: episodeData)

                DispatchQueue.main.async {
                    self.recentEpisodes.insert(episode, at: 0)
                }

                relayEpisodeToServer(episode)
            } catch {
                print("백그라운드 에피소드 디코딩 실패: \(error)")
            }
        }
    }
}
