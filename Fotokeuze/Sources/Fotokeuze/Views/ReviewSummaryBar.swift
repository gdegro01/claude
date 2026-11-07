import SwiftUI

/// Zwevende glazen balk onderaan: wat er gebeurt als je toepast.
struct ReviewSummaryBar: View {
    @Environment(PhotoLibrary.self) private var library
    @Environment(\.undoManager) private var undoManager

    var body: some View {
        VStack(spacing: 10) {
            if let result = library.lastResult {
                UndoToast(result: result) { undoManager?.undo() }
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                    .task(id: result.id) {
                        try? await Task.sleep(for: .seconds(6))
                        guard !Task.isCancelled else { return }
                        await MainActor.run {
                            withAnimation(.snappy) { library.lastResult = nil }
                        }
                    }
            }
            bar
        }
        .padding(.horizontal, 24)
        .padding(.bottom, 16)
        .animation(.spring(duration: 0.4, bounce: 0.25), value: library.lastResult)
    }

    private var bar: some View {
        HStack(spacing: 20) {
            summary
            Spacer(minLength: 12)
            Button {
                library.requestApply()
            } label: {
                Text("Bevestigen en toepassen")
                    .padding(.horizontal, 6)
            }
            .buttonStyle(.glassProminent)
            .tint(.applyTint)
            .controlSize(.extraLarge)
            .disabled(!library.canApply)
        }
        .padding(.leading, 22)
        .padding(.trailing, 14)
        .padding(.vertical, 14)
        .glassEffect(.regular, in: .rect(cornerRadius: 24))
    }

    @ViewBuilder
    private var summary: some View {
        let reviewed = library.reviewedSets
        let keep = library.pendingKeepCount

        VStack(alignment: .leading, spacing: 4) {
            if reviewed.isEmpty {
                Label("Nog niets gekozen", systemImage: "checkmark.circle")
                    .font(.headline)
                Text("Vink een stapel aan om de voorgestelde keuze over te nemen, of open hem om zelf te kiezen.")
                    .font(.callout)
                    .foregroundStyle(.secondary)
            } else {
                HStack(spacing: 22) {
                    Label {
                        Text("\(PhotoCount.text(library.pendingRemovalCount)) verwijderen")
                    } icon: {
                        Image(systemName: "trash")
                            .foregroundStyle(.red)
                    }
                    HStack(spacing: 6) {
                        Label {
                            Text(keep == 1 ? "1 blijft bewaard" : "\(keep) blijven bewaard")
                        } icon: {
                            Image(systemName: "checkmark.circle")
                                .foregroundStyle(.green)
                        }
                        Text("· uit \(reviewed.count) \(reviewed.count == 1 ? "set" : "sets")")
                            .fontWeight(.regular)
                            .foregroundStyle(.secondary)
                    }
                }
                .font(.headline)
                .contentTransition(.numericText())

                Text("Foto’s gaan naar de prullenmand. Je kunt ze terughalen; niets wordt definitief verwijderd.")
                    .font(.callout)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

struct UndoToast: View {
    let result: ApplyResult
    let undo: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Label("\(PhotoCount.text(result.movedToTrash)) naar de prullenmand verplaatst", systemImage: "trash")
                .font(.callout.weight(.medium))
            Button("Herstel", systemImage: "arrow.uturn.backward", action: undo)
                .buttonStyle(.glass)
        }
        .padding(.leading, 16)
        .padding(.trailing, 6)
        .padding(.vertical, 6)
        .glassEffect(.regular, in: .capsule)
    }
}
