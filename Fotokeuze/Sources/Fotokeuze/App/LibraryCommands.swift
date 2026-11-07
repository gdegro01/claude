import SwiftUI

/// Menu-items voor Archief en Weergave. Sneltoetsen volgen dezelfde opbouw als Finder en Foto's.
struct LibraryCommands: Commands {
    let library: PhotoLibrary

    var body: some Commands {
        CommandGroup(after: .newItem) {
            Button("Bevestigen en toepassen…") {
                library.requestApply()
            }
            .keyboardShortcut(.return, modifiers: .command)
            .disabled(!library.canApply)
        }

        CommandGroup(before: .toolbar) {
            ForEach(ReviewFilter.allCases) { filter in
                Toggle(filter.title, isOn: Binding(
                    get: { library.filter == filter },
                    set: { isOn in if isOn { library.filter = filter } }
                ))
                .keyboardShortcut(filter.shortcut, modifiers: .command)
            }
            Divider()
        }
    }
}
