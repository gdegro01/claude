import SwiftUI

struct SettingsView: View {
    @AppStorage(SettingsKey.stackSize) private var stackSize: StackSize = .small
    @AppStorage(SettingsKey.confirmBeforeApply) private var confirmBeforeApply = true

    var body: some View {
        Form {
            Section {
                Picker("Stapelgrootte", selection: $stackSize) {
                    ForEach(StackSize.allCases) { size in
                        Text(size.shortTitle).tag(size)
                    }
                }
                .pickerStyle(.segmented)
            } footer: {
                Text("Grote stapels tonen minder kaarten per rij.")
            }

            Section {
                Toggle("Vraag om bevestiging voor het toepassen", isOn: $confirmBeforeApply)
            } footer: {
                Text("Foto’s gaan altijd naar de prullenmand en zijn daar terug te halen.")
            }
        }
        .formStyle(.grouped)
        .frame(width: 460)
        .fixedSize(horizontal: false, vertical: true)
    }
}
