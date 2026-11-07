// swift-tools-version: 6.2
import PackageDescription

let package = Package(
    name: "Fotokeuze",
    defaultLocalization: "nl",
    platforms: [.macOS(.v26)],
    products: [
        .executable(name: "Fotokeuze", targets: ["Fotokeuze"]),
    ],
    targets: [
        .executableTarget(
            name: "Fotokeuze",
            resources: [.copy("Resources/Photos")]
        ),
    ],
    swiftLanguageModes: [.v5]
)
