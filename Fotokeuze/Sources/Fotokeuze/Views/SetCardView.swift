import SwiftUI

/// Eén stapel in het raster: getint glas, fotostapel, aantal en titel.
struct SetCardView: View {
    let set: PhotoSet
    let namespace: Namespace.ID
    let isOpen: Bool
    let open: () -> Void
    let toggleReviewed: () -> Void

    @State private var isHovered = false

    private let shape = RoundedRectangle(cornerRadius: 24, style: .continuous)

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                SelectionCircle(isOn: set.isReviewed, tint: set.tint.color, size: 24, action: toggleReviewed)
                    .help(set.isReviewed ? "Markeer als nog te kiezen" : "Neem de voorgestelde keuze over")
                    .accessibilityLabel("Gekozen")

                Spacer()

                Button(action: open) {
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 12, weight: .semibold))
                        .frame(width: 16, height: 16)
                }
                .buttonStyle(.glass)
                .buttonBorderShape(.circle)
                .help("Snel bekijken")
                .accessibilityLabel("Snel bekijken")
            }

            PhotoStackView(set: set, namespace: namespace, isLifted: isOpen, isFanned: isHovered && !isOpen)
                .aspectRatio(1.5, contentMode: .fit)
                .padding(.horizontal, 2)

            HStack(spacing: 10) {
                CountBadge(count: set.photos.count)
                VStack(alignment: .leading, spacing: 1) {
                    Text(set.title)
                        .font(.headline)
                    Text(set.subtitle)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .lineLimit(1)
            }
        }
        .padding(14)
        .glassEffect(.regular.tint(set.tint.color.opacity(0.32)), in: shape)
        .overlay {
            shape
                .strokeBorder(set.tint.color.mix(with: .black, by: 0.12), lineWidth: 2)
                .opacity(set.isReviewed ? 1 : 0)
        }
        .contentShape(shape)
        .offset(y: isHovered && !isOpen ? -3 : 0)
        .onHover { hovering in
            withAnimation(.spring(duration: 0.4, bounce: 0.3)) {
                isHovered = hovering
            }
        }
        .onTapGesture(perform: open)
        .contextMenu {
            Button("Snel bekijken", systemImage: "eye", action: open)
            Button(
                set.isReviewed ? "Markeer als nog te kiezen" : "Neem voorgestelde keuze over",
                systemImage: set.isReviewed ? "circle" : "checkmark.circle",
                action: toggleReviewed
            )
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("\(set.title), \(PhotoCount.text(set.photos.count))")
        .accessibilityAction(named: "Snel bekijken", open)
    }
}

/// Rond vinkje zoals in Foto's. Gebruikt op de kaart en in de filmstrip.
struct SelectionCircle: View {
    let isOn: Bool
    let tint: Color
    var size: CGFloat = 24
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            ZStack {
                Circle()
                    .fill(isOn ? tint.mix(with: .black, by: 0.12) : Color.checkBackground)
                Circle()
                    .strokeBorder(.secondary, lineWidth: 1.5)
                    .opacity(isOn ? 0 : 1)
                Image(systemName: "checkmark")
                    .font(.system(size: size * 0.46, weight: .bold))
                    .foregroundStyle(.white)
                    .scaleEffect(isOn ? 1 : 0.4)
                    .opacity(isOn ? 1 : 0)
            }
            .frame(width: size, height: size)
            .contentShape(.circle)
        }
        .buttonStyle(.plain)
        .animation(.spring(duration: 0.3, bounce: 0.45), value: isOn)
        .accessibilityValue(isOn ? "Aan" : "Uit")
        .accessibilityAddTraits(.isToggle)
    }
}

struct CountBadge: View {
    let count: Int

    var body: some View {
        Text(count, format: .number)
            .font(.system(size: 13, weight: .semibold, design: .rounded).monospacedDigit())
            .padding(.horizontal, 8)
            .frame(minWidth: 30, minHeight: 30)
            .background(Color.badgeFill, in: .capsule)
            .overlay { Capsule().strokeBorder(.separator, lineWidth: 0.5) }
            .contentTransition(.numericText(value: Double(count)))
            .accessibilityHidden(true)
    }
}
