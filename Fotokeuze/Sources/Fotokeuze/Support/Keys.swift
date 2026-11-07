import Foundation

enum PhotoCount {
    static func text(_ count: Int) -> String {
        count == 1 ? "1 foto" : "\(count) foto’s"
    }
}

enum SettingsKey {
    static let stackSize = "stackSize"
    static let confirmBeforeApply = "confirmBeforeApply"
}

/// Sleutels voor matchedGeometryEffect tussen een stapel en Quick Look.
enum PhotoMatch: Hashable {
    /// De bovenste print van een stapel en de grote weergave in Quick Look.
    case hero(PhotoSet.ID)
    /// Een print achter in de stapel en zijn plek in de filmstrip.
    case thumb(Photo.ID)
}
