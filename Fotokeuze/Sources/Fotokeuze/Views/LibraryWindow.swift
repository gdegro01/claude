import SwiftUI

struct LibraryWindow: View {
    var body: some View {
        NavigationSplitView {
            SidebarView()
                .navigationSplitViewColumnWidth(min: 200, ideal: 230, max: 300)
        } detail: {
            SetBrowserView()
        }
        .frame(minWidth: 960, minHeight: 640)
    }
}
