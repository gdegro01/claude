import SwiftUI

/// Laag boven het raster. De bovenste print vliegt via matchedGeometryEffect naar de grote weergave,
/// de prints erachter naar hun plek in de filmstrip. Bij sluiten gaat alles terug de stapel in.
struct QuickLookOverlay: View {
    @Environment(PhotoLibrary.self) private var library
    let namespace: Namespace.ID

    var body: some View {
        ZStack {
            if library.openSetID != nil {
                Rectangle()
                    .fill(.black.opacity(0.26))
                    .ignoresSafeArea()
                    .contentShape(.rect)
                    .onTapGesture(perform: close)
                    .transition(.opacity)
                    .accessibilityHidden(true)
            }

            if let set = library.openSet {
                QuickLookPanel(set: set, namespace: namespace, close: close)
                    .id(set.id)
                    .padding(.horizontal, 28)
                    .padding(.top, 8)
                    .padding(.bottom, 20)
                    .transition(.asymmetric(
                        insertion: .opacity.combined(with: .scale(scale: 0.975)).animation(.easeOut(duration: 0.22)),
                        removal: .opacity.animation(.easeIn(duration: 0.18))
                    ))
            }
        }
    }

    private func close() {
        withAnimation(.spring(duration: 0.45, bounce: 0.14)) {
            library.openSetID = nil
        }
    }
}

struct QuickLookPanel: View {
    @Environment(PhotoLibrary.self) private var library
    let set: PhotoSet
    let namespace: Namespace.ID
    let close: () -> Void

    @State private var focusIndex: Int
    @FocusState private var isFocused: Bool

    init(set: PhotoSet, namespace: Namespace.ID, close: @escaping () -> Void) {
        self.set = set
        self.namespace = namespace
        self.close = close
        let coverIndex = set.photos.firstIndex { $0.id == set.cover?.id } ?? 0
        _focusIndex = State(initialValue: coverIndex)
    }

    private var focusedPhoto: Photo? {
        self.set.photos.indices.contains(focusIndex) ? self.set.photos[focusIndex] : nil
    }

    var body: some View {
        VStack(spacing: 0) {
            header
            HStack(spacing: 12) {
                navigationButton(delta: -1)
                preview
                navigationButton(delta: 1)
            }
            .padding(.horizontal, 16)
            .frame(maxHeight: .infinity)
            filmstrip
        }
        .frame(maxWidth: 1100, maxHeight: 800)
        .glassEffect(.regular, in: .rect(cornerRadius: 30))
        .focusable()
        .focused($isFocused)
        .focusEffectDisabled()
        .onKeyPress(.leftArrow) {
            move(by: -1)
            return .handled
        }
        .onKeyPress(.rightArrow) {
            move(by: 1)
            return .handled
        }
        .onKeyPress(.space) {
            toggleFocused()
            return .handled
        }
        .onAppear { isFocused = true }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(set.title)
        .accessibilityAddTraits(.isModal)
    }

    // MARK: Kop

    private var header: some View {
        HStack(spacing: 14) {
            Button(action: close) {
                Image(systemName: "xmark")
                    .font(.system(size: 13, weight: .bold))
                    .frame(width: 18, height: 18)
            }
            .buttonStyle(.glass)
            .buttonBorderShape(.circle)
            .controlSize(.large)
            .keyboardShortcut(.cancelAction)
            .help("Sluit")
            .accessibilityLabel("Sluit")

            VStack(alignment: .leading, spacing: 2) {
                Text(set.title)
                    .font(.title2.weight(.semibold))
                Text("\(set.keepCount) van \(set.photos.count) bewaard")
                    .monospacedDigit()
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .contentTransition(.numericText())
            }

            Spacer()

            Button("Alles bewaren") {
                withAnimation(.snappy) { library.keepAll(in: set.id) }
            }
            .buttonStyle(.glass)
            .controlSize(.large)
            .disabled(set.allKept)

            Button("Gereed") {
                library.markReviewed(set.id)
                close()
            }
            .buttonStyle(.glassProminent)
            .tint(set.tint.color)
            .controlSize(.large)
            .keyboardShortcut(.defaultAction)
        }
        .padding(.horizontal, 20)
        .padding(.top, 18)
        .padding(.bottom, 10)
    }

    // MARK: Grote weergave

    private var preview: some View {
        ZStack {
            if let photo = focusedPhoto {
                PhotoImage(photo: photo, maxPixelSize: 1800, contentMode: .fit)
                    .clipShape(.rect(cornerRadius: 16, style: .continuous))
                    .matchedGeometryEffect(id: PhotoMatch.hero(set.id), in: namespace)
                    .saturation(photo.keep ? 1 : 0.2)
                    .opacity(photo.keep ? 1 : 0.75)
                    .overlay(alignment: .topLeading) {
                        if !photo.keep {
                            Label("Gaat naar de prullenmand", systemImage: "trash")
                                .font(.callout.weight(.semibold))
                                .padding(.horizontal, 12)
                                .padding(.vertical, 7)
                                .glassEffect(.regular, in: .capsule)
                                .padding(12)
                                .transition(.opacity.combined(with: .scale(scale: 0.9)))
                        }
                    }
                    .overlay(alignment: .bottomLeading) {
                        Text("\(focusIndex + 1) van \(set.photos.count)")
                            .monospacedDigit()
                            .font(.caption.weight(.semibold))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .glassEffect(.regular, in: .capsule)
                            .padding(12)
                    }
                    .overlay(alignment: .bottomTrailing) {
                        keepToggle(for: photo)
                            .padding(12)
                    }
                    .shadow(color: .black.opacity(0.28), radius: 22, y: 10)
                    .id(photo.id)
                    .transition(.opacity)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    @ViewBuilder
    private func keepToggle(for photo: Photo) -> some View {
        let label = Label("Bewaren", systemImage: photo.keep ? "checkmark.circle.fill" : "circle")
            .font(.body.weight(.semibold))
            .contentTransition(.symbolEffect(.replace))

        if photo.keep {
            Button { toggle(photo) } label: { label }
                .buttonStyle(.glassProminent)
                .tint(set.tint.color)
                .controlSize(.large)
                .help("Niet bewaren (spatiebalk)")
                .accessibilityValue("Aan")
        } else {
            Button { toggle(photo) } label: { label }
                .buttonStyle(.glass)
                .controlSize(.large)
                .help("Bewaren (spatiebalk)")
                .accessibilityValue("Uit")
        }
    }

    private func navigationButton(delta: Int) -> some View {
        Button {
            move(by: delta)
        } label: {
            Image(systemName: delta < 0 ? "chevron.left" : "chevron.right")
                .font(.system(size: 15, weight: .semibold))
                .frame(width: 22, height: 22)
        }
        .buttonStyle(.glass)
        .buttonBorderShape(.circle)
        .controlSize(.large)
        .disabled(!set.photos.indices.contains(focusIndex + delta))
        .help(delta < 0 ? "Vorige foto" : "Volgende foto")
        .accessibilityLabel(delta < 0 ? "Vorige foto" : "Volgende foto")
    }

    // MARK: Filmstrip

    private var filmstrip: some View {
        GeometryReader { geometry in
            ScrollViewReader { proxy in
                ScrollView(.horizontal) {
                    HStack(spacing: 10) {
                        ForEach(set.indexedPhotos) { item in
                            FilmstripThumbnail(
                                photo: item.photo,
                                tint: set.tint.color,
                                isFocused: item.index == focusIndex,
                                toggleKeep: { toggle(item.photo) }
                            )
                            .matchedGeometryEffect(id: PhotoMatch.thumb(item.photo.id), in: namespace)
                            .onTapGesture {
                                withAnimation(.snappy(duration: 0.28)) { focusIndex = item.index }
                            }
                            .id(item.photo.id)
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 14)
                    .frame(minWidth: geometry.size.width)
                }
                .scrollIndicators(.never)
                .onChange(of: focusIndex) { _, index in
                    withAnimation(.snappy) {
                        proxy.scrollTo(set.photos[index].id, anchor: .center)
                    }
                }
                .onAppear {
                    proxy.scrollTo(set.photos[focusIndex].id, anchor: .center)
                }
            }
        }
        .frame(height: 108)
    }

    // MARK: Acties

    private func move(by delta: Int) {
        let next = focusIndex + delta
        guard set.photos.indices.contains(next) else { return }
        withAnimation(.snappy(duration: 0.28)) {
            focusIndex = next
        }
    }

    private func toggle(_ photo: Photo) {
        withAnimation(.snappy) {
            library.toggleKeep(photo.id, in: set.id)
        }
    }

    private func toggleFocused() {
        if let focusedPhoto {
            toggle(focusedPhoto)
        }
    }
}

struct FilmstripThumbnail: View {
    let photo: Photo
    let tint: Color
    let isFocused: Bool
    let toggleKeep: () -> Void

    var body: some View {
        PhotoImage(photo: photo, maxPixelSize: 320)
            .frame(width: 108, height: 72)
            .clipShape(.rect(cornerRadius: 11, style: .continuous))
            .saturation(photo.keep ? 1 : 0.15)
            .opacity(photo.keep ? 1 : 0.55)
            .overlay(alignment: .topLeading) {
                SelectionCircle(isOn: photo.keep, tint: tint, size: 20, action: toggleKeep)
                    .padding(5)
                    .accessibilityLabel("Bewaren")
            }
            .overlay(alignment: .bottomTrailing) {
                if !photo.keep {
                    Image(systemName: "trash.circle.fill")
                        .font(.system(size: 18))
                        .symbolRenderingMode(.palette)
                        .foregroundStyle(.white, .red)
                        .padding(4)
                        .transition(.scale.combined(with: .opacity))
                        .accessibilityHidden(true)
                }
            }
            .padding(3)
            .overlay {
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .strokeBorder(tint, lineWidth: 3)
                    .opacity(isFocused ? 1 : 0)
            }
            .offset(y: isFocused ? -3 : 0)
            .contentShape(.rect)
            .animation(.snappy(duration: 0.25), value: isFocused)
            .animation(.snappy(duration: 0.25), value: photo.keep)
    }
}
