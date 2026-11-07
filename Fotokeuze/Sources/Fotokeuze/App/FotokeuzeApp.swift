import AppKit
import SwiftUI

@main
struct FotokeuzeApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @State private var library = PhotoLibrary.sample()

    var body: some Scene {
        Window("Fotokeuze", id: "library") {
            LibraryWindow()
                .environment(library)
        }
        .defaultSize(width: 1280, height: 840)
        .windowResizability(.contentMinSize)
        .commands {
            SidebarCommands()
            LibraryCommands(library: library)
        }

        Settings {
            SettingsView()
        }
    }
}

final class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        // Zonder app-bundel (swift run) start een executable als achtergrondproces zonder Dock-icoon.
        NSApp.setActivationPolicy(.regular)
        NSApp.activate()
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        true
    }
}
