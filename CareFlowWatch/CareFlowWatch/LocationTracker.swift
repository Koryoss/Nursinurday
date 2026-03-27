// ============================================================================
// CareFlow Watch — Location Tracker (iOS)
// ============================================================================
// 자주 방문하는 장소 추적 + 에피소드 발생 장소 연계
//
// 핵심 기능:
//   1. 자주 방문하는 장소 자동 학습 (집, 직장, 마트, 병원 등)
//   2. 에피소드 발생 시 현재 위치 자동 기록
//   3. 장소별 에피소드 빈도 지도 표시 (iOS MapKit)
//   4. "어디서 어지러움이 많이 발생하는지" 패턴 분석
//
// 개인정보 보호:
//   - 위치 데이터는 기기 내부(UserDefaults)에만 저장
//   - 서버로 전송하지 않음
//   - 사용자가 원하면 언제든 삭제 가능
// ============================================================================

import Foundation
import CoreLocation
import Combine

class LocationTracker: NSObject, ObservableObject, CLLocationManagerDelegate {

    // MARK: - Published

    @Published var currentLocation: CLLocation?
    @Published var currentPlaceName: String = "알 수 없음"
    @Published var frequentPlaces: [LocationRecord] = []
    @Published var isAuthorized: Bool = false

    // MARK: - Private

    private let locationManager = CLLocationManager()
    private let geocoder = CLGeocoder()
    private let storageKey = "careflow_frequent_places"

    // 장소 근접 거리 (미터) — 같은 장소로 판단하는 반경
    private let proximityRadius: Double = 100.0

    // MARK: - Init

    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyHundredMeters
        locationManager.allowsBackgroundLocationUpdates = false
        locationManager.distanceFilter = 50  // 50m 이동 시 갱신
        loadPlaces()
    }

    // MARK: - 권한 요청

    func requestAuthorization() {
        locationManager.requestWhenInUseAuthorization()
    }

    // MARK: - 위치 추적 시작/중지

    func startTracking() {
        guard isAuthorized else {
            requestAuthorization()
            return
        }
        locationManager.startUpdatingLocation()
        print("📍 위치 추적 시작")
    }

    func stopTracking() {
        locationManager.stopUpdatingLocation()
        print("📍 위치 추적 중지")
    }

    /// 현재 위치를 한 번만 가져오기
    func requestCurrentLocation() {
        guard isAuthorized else {
            requestAuthorization()
            return
        }
        locationManager.requestLocation()
    }

    // MARK: - CLLocationManagerDelegate

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }

        DispatchQueue.main.async {
            self.currentLocation = location
        }

        // 역지오코딩으로 장소 이름 얻기
        geocoder.reverseGeocodeLocation(location) { [weak self] placemarks, error in
            guard let self = self, let placemark = placemarks?.first else { return }
            let name = placemark.name ?? placemark.locality ?? "알 수 없는 위치"
            DispatchQueue.main.async {
                self.currentPlaceName = name
            }
        }

        // 자주 방문하는 장소 학습
        updateFrequentPlaces(location: location)
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("📍 위치 오류: \(error.localizedDescription)")
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status = manager.authorizationStatus
        DispatchQueue.main.async {
            self.isAuthorized = (status == .authorizedWhenInUse || status == .authorizedAlways)
        }

        if isAuthorized {
            startTracking()
        }
    }

    // MARK: - 자주 방문하는 장소 학습

    private func updateFrequentPlaces(location: CLLocation) {
        let coord = location.coordinate

        // 기존 장소 중 근접한 곳이 있는지 확인
        if let index = frequentPlaces.firstIndex(where: { place in
            let placeLocation = CLLocation(latitude: place.latitude, longitude: place.longitude)
            return location.distance(from: placeLocation) < proximityRadius
        }) {
            // 기존 장소 방문 횟수 증가
            DispatchQueue.main.async {
                self.frequentPlaces[index].visitCount += 1
                self.frequentPlaces[index].lastVisit = Date()
            }
        } else {
            // 새 장소 추가
            geocoder.reverseGeocodeLocation(location) { [weak self] placemarks, _ in
                guard let self = self else { return }
                let name = placemarks?.first?.name ?? "장소 \(self.frequentPlaces.count + 1)"
                let record = LocationRecord(
                    name: name,
                    latitude: coord.latitude,
                    longitude: coord.longitude
                )
                DispatchQueue.main.async {
                    self.frequentPlaces.append(record)
                    // 최대 20개 장소 유지 (방문 빈도순)
                    if self.frequentPlaces.count > 20 {
                        self.frequentPlaces.sort { $0.visitCount > $1.visitCount }
                        self.frequentPlaces = Array(self.frequentPlaces.prefix(20))
                    }
                }
            }
        }

        savePlaces()
    }

    // MARK: - 에피소드 발생 장소 기록

    /// 에피소드 발생 시 호출 — 현재 위치에서 가장 가까운 장소의 에피소드 카운트 증가
    func recordEpisodeAtCurrentLocation() {
        guard let location = currentLocation else { return }

        if let index = frequentPlaces.firstIndex(where: { place in
            let placeLocation = CLLocation(latitude: place.latitude, longitude: place.longitude)
            return location.distance(from: placeLocation) < proximityRadius
        }) {
            DispatchQueue.main.async {
                self.frequentPlaces[index].episodesHere += 1
            }
            savePlaces()
        }
    }

    /// 장소별 에피소드 빈도 상위 목록
    var episodeHotspots: [LocationRecord] {
        frequentPlaces
            .filter { $0.episodesHere > 0 }
            .sorted { $0.episodesHere > $1.episodesHere }
    }

    // MARK: - 현재 장소 이름 (DailyContext용)

    /// DailyContextManager에 전달할 현재 장소 이름
    var currentPlaceForContext: String? {
        guard let location = currentLocation else { return nil }

        // 자주 방문하는 장소 중 현재 위치에 해당하는 곳
        if let match = frequentPlaces.first(where: { place in
            let placeLocation = CLLocation(latitude: place.latitude, longitude: place.longitude)
            return location.distance(from: placeLocation) < proximityRadius
        }) {
            return match.name
        }

        return currentPlaceName
    }

    // MARK: - 저장/로드

    private func savePlaces() {
        if let data = try? JSONEncoder().encode(frequentPlaces) {
            UserDefaults.standard.set(data, forKey: storageKey)
        }
    }

    private func loadPlaces() {
        guard let data = UserDefaults.standard.data(forKey: storageKey),
              let places = try? JSONDecoder().decode([LocationRecord].self, from: data) else {
            return
        }
        self.frequentPlaces = places
    }

    // MARK: - 데이터 관리

    /// 모든 위치 기록 삭제 (개인정보 보호)
    func clearAllData() {
        DispatchQueue.main.async {
            self.frequentPlaces = []
        }
        UserDefaults.standard.removeObject(forKey: storageKey)
        print("📍 모든 위치 기록 삭제됨")
    }

    /// 특정 장소 삭제
    func removePlace(id: UUID) {
        DispatchQueue.main.async {
            self.frequentPlaces.removeAll { $0.id == id }
        }
        savePlaces()
    }

    /// 장소 이름 편집 (사용자 지정)
    /// v3.1 수정: name이 var로 변경되어 id/visitCount/episodesHere/lastVisit 보존
    func renamePlace(id: UUID, newName: String) {
        if let index = frequentPlaces.firstIndex(where: { $0.id == id }) {
            DispatchQueue.main.async {
                self.frequentPlaces[index].name = newName  // 이름만 교체, 나머지 필드 보존
            }
            savePlaces()
        }
    }
}
