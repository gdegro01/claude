import SwiftUI

struct SidebarView: View {
    @Environment(PhotoLibrary.self) private var library

    var body: some View {
        List(selection: Bindable(library).scope) {
            Section("Bibliotheek") {
                row("Alle sets", systemImage: "photo.on.rectangle.angled", scope: .all)
            }
            Section("Albums") {
                ForEach(library.albums) { album in
                    row(album.name, systemImage: "folder", scope: .album(album.id))
                }
            }
            Section("Datums") {
                ForEach(library.days, id: \.self) { day in
                    row(day.formatted(.dateTime.day().month(.wide).year()), systemImage: "calendar", scope: .day(day))
                }
            }
        }
        .listStyle(.sidebar)
    }

    private func row(_ title: String, systemImage: String, scope: LibraryScope) -> some View {
        Label(title, systemImage: systemImage)
            .badge(library.count(in: scope))
            .tag(scope)
    }
}
