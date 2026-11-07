import SwiftUI

/// Het rechterdeel van het venster: kop, raster met stapels, keuzebalk en de Quick Look laag.
struct SetBrowserView: View {
    @Environment(PhotoLibrary.self) private var library
    @Environment(\.undoManager) private var undoManager
    @AppStorage(SettingsKey.stackSize) private var stackSize: StackSize = .small
    @Namespace private var photoNamespace

    var body: some View {
        ZStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    header
                    content
                }
                .padding(.horizontal, 32)
                .padding(.top, 8)
                .padding(.bottom, 24)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .safeAreaInset(edge: .bottom, spacing: 0) {
                ReviewSummaryBar()
            }

            QuickLookOverlay(namespace: photoNamespace)
        }
        .background { LibraryBackground() }
        .navigationTitle("Fotokeuze")
        .searchable(text: Bindable(library).searchText, placement: .toolbar, prompt: "Zoek fotosets")
        .toolbar { toolbarContent }
        .confirmationDialog(
            "\(PhotoCount.text(library.pendingRemovalCount)) naar de prullenmand verplaatsen?",
            isPresented: Bindable(library).isConfirmingApply,
            titleVisibility: .visible
        ) {
            Button("Verplaats naar prullenmand") {
                withAnimation(.snappy) { library.applyChoices() }
            }
            .keyboardShortcut(.defaultAction)
            Button("Annuleer", role: .cancel) {}
        } message: {
            Text(confirmationMessage)
        }
        .onAppear { library.undoManager = undoManager }
    }

    // MARK: Inhoud

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Kies wat je bewaart")
                .font(.largeTitle.weight(.bold))
            Text("Open een stapel om foto’s te vergelijken.")
                .font(.title3)
                .foregroundStyle(.secondary)
        }
    }

    @ViewBuilder
    private var content: some View {
        let sets = library.visibleSets
        if sets.isEmpty {
            emptyState
                .frame(maxWidth: .infinity)
                .padding(.top, 60)
        } else {
            LazyVGrid(
                columns: [GridItem(
                    .adaptive(minimum: stackSize.cardWidth.lowerBound, maximum: stackSize.cardWidth.upperBound),
                    spacing: 28
                )],
                spacing: 28
            ) {
                ForEach(sets) { set in
                    SetCardView(
                        set: set,
                        namespace: photoNamespace,
                        isOpen: library.openSetID == set.id,
                        open: { open(set) },
                        toggleReviewed: { toggleReviewed(set) }
                    )
                }
            }
            .animation(.snappy, value: sets.map(\.id))
        }
    }

    @ViewBuilder
    private var emptyState: some View {
        let query = library.searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        if !query.isEmpty {
            ContentUnavailableView.search(text: query)
        } else if library.filter == .open {
            ContentUnavailableView(
                "Alles is gekozen",
                systemImage: "checkmark.circle",
                description: Text("Elke stapel in deze weergave heeft een keuze. Bevestig onderaan om op te ruimen.")
            )
        } else if library.filter == .reviewed {
            ContentUnavailableView(
                "Nog niets bewaard",
                systemImage: "square.stack",
                description: Text("Vink een stapel aan of open er een om foto’s te kiezen.")
            )
        } else {
            ContentUnavailableView(
                "Geen sets",
                systemImage: "photo.stack",
                description: Text("Hier verschijnen stapels met vergelijkbare foto’s.")
            )
        }
    }

    private var confirmationMessage: String {
        let keep = library.pendingKeepCount
        let kept = keep == 1 ? "1 foto blijft bewaard." : "\(keep) foto’s blijven bewaard."
        return kept + " Je kunt verplaatste foto’s terughalen uit de prullenmand."
    }

    // MARK: Werkbalk

    @ToolbarContentBuilder
    private var toolbarContent: some ToolbarContent {
        let isPeeking = library.openSetID != nil

        ToolbarItem(placement: .principal) {
            Picker("Toon", selection: Bindable(library).filter) {
                ForEach(ReviewFilter.allCases) { filter in
                    Text(filter.title).tag(filter)
                }
            }
            .pickerStyle(.segmented)
            .labelsHidden()
            .fixedSize()
            .disabled(isPeeking)
        }

        ToolbarItemGroup {
            Menu {
                Picker("Stapelgrootte", selection: $stackSize) {
                    ForEach(StackSize.allCases) { size in
                        Text(size.title).tag(size)
                    }
                }
                .pickerStyle(.inline)
            } label: {
                Label("Stapelgrootte", systemImage: "square.grid.2x2")
            }
            .menuIndicator(.hidden)
            .help("Stapelgrootte")
            .disabled(isPeeking)

            Menu {
                Picker("Sorteer op", selection: Bindable(library).sort) {
                    ForEach(SetSort.allCases) { sort in
                        Text(sort.title).tag(sort)
                    }
                }
                .pickerStyle(.inline)
            } label: {
                Label("Sorteer", systemImage: "line.3.horizontal.decrease")
            }
            .menuIndicator(.hidden)
            .help("Sorteer")
            .disabled(isPeeking)
        }

        ToolbarSpacer(.fixed)

        ToolbarItem {
            SettingsLink {
                Label("Instellingen", systemImage: "gearshape")
            }
            .help("Instellingen")
            .disabled(isPeeking)
        }
    }

    // MARK: Acties

    private func open(_ set: PhotoSet) {
        withAnimation(.spring(duration: 0.5, bounce: 0.16)) {
            library.openSetID = set.id
        }
    }

    private func toggleReviewed(_ set: PhotoSet) {
        withAnimation(.snappy) {
            library.toggleReviewed(set.id)
        }
    }
}

/// Neutrale achtergrond met zachte kleurvlekken. Die geven het glas van de kaarten iets om te breken.
struct LibraryBackground: View {
    var body: some View {
        ZStack {
            Color.libraryBackground
            RadialGradient(
                colors: [SetTint.teal.color.opacity(0.13), .clear],
                center: UnitPoint(x: 0.2, y: 0.05), startRadius: 0, endRadius: 520
            )
            RadialGradient(
                colors: [SetTint.rose.color.opacity(0.11), .clear],
                center: UnitPoint(x: 0.92, y: 0.9), startRadius: 0, endRadius: 600
            )
            RadialGradient(
                colors: [SetTint.blue.color.opacity(0.08), .clear],
                center: UnitPoint(x: 0.6, y: 0.4), startRadius: 0, endRadius: 480
            )
        }
        .ignoresSafeArea()
    }
}
