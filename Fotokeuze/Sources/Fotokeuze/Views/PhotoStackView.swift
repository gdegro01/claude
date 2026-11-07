import SwiftUI

/// De stapel afdrukjes op een kaart. Bij hover waaiert hij uit. Staat de stapel open in Quick Look,
/// dan zijn de prints daarheen gevlogen en blijft hier alleen hun ruimte over.
struct PhotoStackView: View {
    let set: PhotoSet
    let namespace: Namespace.ID
    let isLifted: Bool
    let isFanned: Bool

    var body: some View {
        GeometryReader { proxy in
            let width = min(proxy.size.width * 0.7, proxy.size.height * 1.12)
            let printSize = CGSize(width: width, height: width / 1.39)

            ZStack {
                ForEach(layers) { layer in
                    if !isLifted {
                        PrintView(photo: layer.photo)
                            .frame(width: printSize.width, height: printSize.height)
                            .matchedGeometryEffect(id: layer.matchID(in: set), in: namespace)
                            .rotationEffect(.degrees(rotation(for: layer.depth)))
                            .offset(offset(for: layer.depth))
                            .transition(.opacity.animation(.easeOut(duration: 0.12)))
                    }
                }
            }
            .frame(width: proxy.size.width, height: proxy.size.height)
            .offset(x: -proxy.size.width * 0.04)
        }
        .animation(.spring(duration: 0.45, bounce: 0.35), value: isFanned)
        .accessibilityHidden(true)
    }

    /// Achterste print eerst, zodat de omslag bovenop ligt.
    private var layers: [StackLayer] {
        Array(set.stackPhotos.enumerated().map { StackLayer(depth: $0.offset, photo: $0.element) }.reversed())
    }

    private func rotation(for depth: Int) -> Double {
        let angles: [Double] = isFanned ? [-2.5, 6.5, 12] : [0, 3.5, 7]
        return angles[min(depth, 2)]
    }

    private func offset(for depth: Int) -> CGSize {
        let x: [CGFloat] = isFanned ? [-6, 21, 40] : [0, 9, 18]
        let y: [CGFloat] = isFanned ? [2, -7, -12] : [0, -5, -10]
        return CGSize(width: x[min(depth, 2)], height: y[min(depth, 2)])
    }
}

private struct StackLayer: Identifiable {
    let depth: Int
    let photo: Photo
    var id: Photo.ID { photo.id }

    func matchID(in set: PhotoSet) -> PhotoMatch {
        depth == 0 ? .hero(set.id) : .thumb(photo.id)
    }
}

/// Een afdrukje met witte rand.
struct PrintView: View {
    let photo: Photo

    var body: some View {
        PhotoImage(photo: photo, maxPixelSize: 640)
            .clipShape(.rect(cornerRadius: 2, style: .continuous))
            .padding(4)
            .background(Color.printPaper, in: .rect(cornerRadius: 5, style: .continuous))
            .shadow(color: .black.opacity(0.12), radius: 1, y: 1)
            .shadow(color: .black.opacity(0.22), radius: 10, y: 6)
    }
}

/// Een foto uit de bibliotheek. Met `.fill` vult hij zijn kader en wordt hij bijgesneden.
struct PhotoImage: View {
    let photo: Photo
    var maxPixelSize = 800
    var contentMode: ContentMode = .fill

    var body: some View {
        if let image = PhotoImageCache.shared.image(for: photo.id, maxPixelSize: maxPixelSize) {
            if contentMode == .fit {
                Image(nsImage: image)
                    .resizable()
                    .interpolation(.high)
                    .aspectRatio(contentMode: .fit)
            } else {
                Color.clear
                    .overlay {
                        Image(nsImage: image)
                            .resizable()
                            .interpolation(.high)
                            .aspectRatio(contentMode: .fill)
                    }
                    .clipped()
            }
        } else {
            Rectangle().fill(.quaternary)
        }
    }
}
