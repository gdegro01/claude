import SwiftUI

/// De bibliotheek en alle keuzes. Eén bron van waarheid voor zijbalk, raster, Quick Look en menu's.
@MainActor
@Observable
final class PhotoLibrary {
    var sets: [PhotoSet]
    let albums: [Album]

    var scope: LibraryScope? = .all
    var filter: ReviewFilter = .all
    var sort: SetSort = .library
    var searchText = ""

    /// De stapel die in Quick Look openstaat.
    var openSetID: PhotoSet.ID?
    var isConfirmingApply = false
    var lastResult: ApplyResult?

    /// Het venster geeft zijn UndoManager door, zodat toepassen te herstellen is met ⌘Z.
    @ObservationIgnored weak var undoManager: UndoManager?

    init(sets: [PhotoSet], albums: [Album]) {
        self.sets = sets
        self.albums = albums
    }

    // MARK: Weergave

    var openSet: PhotoSet? {
        guard let openSetID else { return nil }
        return sets.first { $0.id == openSetID }
    }

    var days: [Date] {
        Array(Set(sets.map(\.day))).sorted(by: >)
    }

    var visibleSets: [PhotoSet] {
        var result = sets.filter { !$0.photos.isEmpty && matches($0, scope ?? .all) }

        switch filter {
        case .all: break
        case .open: result.removeAll { $0.isReviewed }
        case .reviewed: result.removeAll { !$0.isReviewed }
        }

        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        if !query.isEmpty {
            result = result.filter { set in
                [set.title, set.subtitle, albumName(for: set)].contains { $0.localizedStandardContains(query) }
            }
        }

        switch sort {
        case .library: break
        case .newest: result.sort { $0.day > $1.day }
        case .mostPhotos: result.sort { $0.photos.count > $1.photos.count }
        case .name: result.sort { $0.title.localizedStandardCompare($1.title) == .orderedAscending }
        }
        return result
    }

    func count(in scope: LibraryScope) -> Int {
        sets.filter { !$0.photos.isEmpty && matches($0, scope) }.count
    }

    func albumName(for set: PhotoSet) -> String {
        albums.first { $0.id == set.albumID }?.name ?? ""
    }

    private func matches(_ set: PhotoSet, _ scope: LibraryScope) -> Bool {
        switch scope {
        case .all: true
        case .album(let id): set.albumID == id
        case .day(let day): Calendar.current.isDate(set.day, inSameDayAs: day)
        }
    }

    // MARK: Keuzes

    var reviewedSets: [PhotoSet] { sets.filter { $0.isReviewed && !$0.photos.isEmpty } }
    var pendingRemovalCount: Int { reviewedSets.reduce(0) { $0 + $1.removeCount } }
    var pendingKeepCount: Int { reviewedSets.reduce(0) { $0 + $1.keepCount } }
    var canApply: Bool { pendingRemovalCount > 0 }

    func toggleReviewed(_ id: PhotoSet.ID) {
        update(id) { $0.isReviewed.toggle() }
    }

    func markReviewed(_ id: PhotoSet.ID) {
        update(id) { $0.isReviewed = true }
    }

    func toggleKeep(_ photoID: Photo.ID, in setID: PhotoSet.ID) {
        update(setID) { set in
            guard let index = set.photos.firstIndex(where: { $0.id == photoID }) else { return }
            set.photos[index].keep.toggle()
            set.isReviewed = true
        }
    }

    func keepAll(in setID: PhotoSet.ID) {
        update(setID) { set in
            for index in set.photos.indices {
                set.photos[index].keep = true
            }
            set.isReviewed = true
        }
    }

    func requestApply() {
        guard canApply else { return }
        let confirm = UserDefaults.standard.object(forKey: SettingsKey.confirmBeforeApply) as? Bool ?? true
        if confirm {
            isConfirmingApply = true
        } else {
            applyChoices()
        }
    }

    /// Haalt de niet bewaarde foto's uit de gekozen stapels. In dit geraamte blijft het bij de data.
    /// De echte versie verplaatst ze hier naar de prullenmand, met PhotoKit
    /// (PHAssetChangeRequest.deleteAssets) of met FileManager.trashItem voor losse bestanden.
    func applyChoices() {
        let snapshot = sets
        let moved = pendingRemovalCount
        for index in sets.indices where sets[index].isReviewed {
            sets[index].photos.removeAll { !$0.keep }
        }
        lastResult = ApplyResult(movedToTrash: moved)

        undoManager?.registerUndo(withTarget: self) { library in
            MainActor.assumeIsolated {
                library.sets = snapshot
                library.lastResult = nil
            }
        }
        undoManager?.setActionName("Verplaatsen naar prullenmand")
    }

    private func update(_ id: PhotoSet.ID, _ change: (inout PhotoSet) -> Void) {
        guard let index = sets.firstIndex(where: { $0.id == id }) else { return }
        change(&sets[index])
    }
}
