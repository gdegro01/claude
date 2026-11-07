import AppKit
import SwiftUI

extension Color {
    /// Achtergrond van het bladergebied: iets donkerder dan de kaarten, zodat het getinte glas loskomt.
    static let libraryBackground = adaptive(
        light: NSColor(srgbRed: 0.882, green: 0.894, blue: 0.918, alpha: 1),
        dark: NSColor(srgbRed: 0.083, green: 0.087, blue: 0.102, alpha: 1)
    )

    /// Het witte randje van een afdrukje. In het donker iets gebroken wit, anders licht het te fel op.
    static let printPaper = adaptive(
        light: .white,
        dark: NSColor(srgbRed: 0.95, green: 0.945, blue: 0.933, alpha: 1)
    )

    static let badgeFill = adaptive(
        light: NSColor(white: 1, alpha: 0.84),
        dark: NSColor(srgbRed: 0.28, green: 0.29, blue: 0.32, alpha: 0.9)
    )

    static let checkBackground = adaptive(
        light: NSColor(white: 1, alpha: 0.72),
        dark: NSColor(white: 1, alpha: 0.06)
    )

    /// Kleur van de knop die de keuzes toepast.
    static let applyTint = Color(red: 0.06, green: 0.62, blue: 0.55)

    static func adaptive(light: NSColor, dark: NSColor) -> Color {
        Color(nsColor: NSColor(name: nil) { appearance in
            appearance.bestMatch(from: [.aqua, .darkAqua]) == .darkAqua ? dark : light
        })
    }
}
