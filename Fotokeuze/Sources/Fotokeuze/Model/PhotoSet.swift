import SwiftUI

struct Photo: Identifiable, Hashable, Sendable {
    /// Bestandsnaam zonder extensie, bijvoorbeeld "strand-01".
    let id: String
    var keep: Bool
}

/// Een stapel vergelijkbare foto's, bijvoorbeeld een reeks van hetzelfde moment.
struct PhotoSet: Identifiable, Hashable, Sendable {
    let id: String
    var title: String
    var subtitle: String
    var tint: SetTint
    var albumID: Album.ID
    var day: Date
    var photos: [Photo]
    /// De gebruiker heeft een keuze gemaakt of de voorgestelde keuze overgenomen.
    var isReviewed = false

    var keepCount: Int { photos.filter(\.keep).count }
    var removeCount: Int { photos.count - keepCount }
    var allKept: Bool { keepCount == photos.count }

    /// De foto die bovenop de stapel ligt: de eerste die bewaard blijft.
    var cover: Photo? { photos.first(where: \.keep) ?? photos.first }

    /// Hooguit drie foto's voor de stapel, met de omslag voorop.
    var stackPhotos: [Photo] {
        guard let cover else { return [] }
        return [cover] + photos.filter { $0.id != cover.id }.prefix(2)
    }

    var indexedPhotos: [IndexedPhoto] {
        photos.enumerated().map { IndexedPhoto(index: $0.offset, photo: $0.element) }
    }
}

struct IndexedPhoto: Identifiable {
    let index: Int
    let photo: Photo
    var id: Photo.ID { photo.id }
}

/// Elke stapel krijgt een eigen tint voor het glas van de kaart.
enum SetTint: String, CaseIterable, Sendable {
    case teal, blue, coral, violet, amber, rose, cyan, green

    var color: Color {
        switch self {
        case .teal: Color(red: 0.14, green: 0.69, blue: 0.62)
        case .blue: Color(red: 0.33, green: 0.50, blue: 0.95)
        case .coral: Color(red: 0.95, green: 0.46, blue: 0.36)
        case .violet: Color(red: 0.61, green: 0.47, blue: 0.94)
        case .amber: Color(red: 0.93, green: 0.65, blue: 0.22)
        case .rose: Color(red: 0.92, green: 0.42, blue: 0.58)
        case .cyan: Color(red: 0.17, green: 0.69, blue: 0.84)
        case .green: Color(red: 0.41, green: 0.67, blue: 0.33)
        }
    }
}

struct Album: Identifiable, Hashable, Sendable {
    let id: String
    let name: String
}

/// Wat de zijbalk selecteert.
enum LibraryScope: Hashable, Sendable {
    case all
    case album(Album.ID)
    case day(Date)
}

enum ReviewFilter: String, CaseIterable, Identifiable, Sendable {
    case all, open, reviewed

    var id: Self { self }

    var title: LocalizedStringKey {
        switch self {
        case .all: "Alle sets"
        case .open: "Nog te kiezen"
        case .reviewed: "Bewaard"
        }
    }

    var shortcut: KeyEquivalent {
        switch self {
        case .all: "1"
        case .open: "2"
        case .reviewed: "3"
        }
    }
}

enum SetSort: String, CaseIterable, Identifiable, Sendable {
    case library, newest, mostPhotos, name

    var id: Self { self }

    var title: LocalizedStringKey {
        switch self {
        case .library: "Standaard"
        case .newest: "Nieuwste eerst"
        case .mostPhotos: "Meeste foto’s"
        case .name: "Naam"
        }
    }
}

enum StackSize: String, CaseIterable, Identifiable, Sendable {
    case small, large

    var id: Self { self }

    var title: LocalizedStringKey {
        switch self {
        case .small: "Kleine stapels"
        case .large: "Grote stapels"
        }
    }

    var shortTitle: LocalizedStringKey {
        switch self {
        case .small: "Klein"
        case .large: "Groot"
        }
    }

    /// Breedte van een kaart in het raster.
    var cardWidth: ClosedRange<CGFloat> {
        switch self {
        case .small: 220...300
        case .large: 300...420
        }
    }
}

struct ApplyResult: Identifiable, Equatable, Sendable {
    let id = UUID()
    let movedToTrash: Int
}
