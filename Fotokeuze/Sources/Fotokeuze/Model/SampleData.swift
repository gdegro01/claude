import Foundation

extension PhotoLibrary {
    /// Voorbeeldbibliotheek met dezelfde stapels als de browserpreview.
    static func sample() -> PhotoLibrary {
        let albums = [
            Album(id: "familieweekend", name: "Familieweekend"),
            Album(id: "concert", name: "Concert"),
            Album(id: "zee", name: "Weekend aan zee"),
        ]

        let sets: [PhotoSet] = [
            .sample("strand", "Aan het strand", "Zon, zee en strand",
                    tint: .teal, album: "zee", day: 11, count: 2, keep: [0], reviewed: true),
            .sample("bos", "Samen in het bos", "Wandeling in het bos",
                    tint: .blue, album: "familieweekend", day: 4, count: 5, keep: [0, 3]),
            .sample("concert", "Concertavond", "Live muziek en sfeer",
                    tint: .coral, album: "concert", day: 12, count: 37,
                    keep: [0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 32, 34, 35, 36]),
            .sample("picknick", "Familiepicknick", "Samen in het park",
                    tint: .violet, album: "familieweekend", day: 4, count: 3, keep: [0, 2]),
            .sample("duin", "Duinwandeling", "Duinen, wind en uitzicht",
                    tint: .amber, album: "zee", day: 11, count: 4, keep: [0, 2]),
            .sample("zonsondergang", "Zonsondergang", "Mooie luchten",
                    tint: .rose, album: "zee", day: 11, count: 8, keep: [0, 3, 5, 7]),
            .sample("lachen", "Samen lachen", "Spontane momenten",
                    tint: .cyan, album: "familieweekend", day: 4, count: 2, keep: [0], reviewed: true),
            .sample("water", "Aan het water", "Rust aan de rivier",
                    tint: .green, album: "familieweekend", day: 4, count: 6, keep: [0, 3, 5]),
        ]

        return PhotoLibrary(sets: sets, albums: albums)
    }
}

private extension PhotoSet {
    /// Een voorbeeldstapel. `keep` zijn de foto's die de app voorstelt te bewaren: de beste uit elke reeks.
    static func sample(
        _ id: String,
        _ title: String,
        _ subtitle: String,
        tint: SetTint,
        album: Album.ID,
        day: Int,
        count: Int,
        keep: Set<Int>,
        reviewed: Bool = false
    ) -> PhotoSet {
        let photos = (1...count).map { number in
            Photo(id: "\(id)-\(number < 10 ? "0" : "")\(number)", keep: keep.contains(number - 1))
        }
        let date = Calendar.current.date(from: DateComponents(year: 2026, month: 10, day: day)) ?? .now
        return PhotoSet(
            id: id,
            title: title,
            subtitle: subtitle,
            tint: tint,
            albumID: album,
            day: date,
            photos: photos,
            isReviewed: reviewed
        )
    }
}
