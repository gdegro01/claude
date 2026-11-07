import AppKit
import ImageIO

/// Vindt de voorbeeldfoto's, zowel in een app-bundel (Contents/Resources/Photos) als bij `swift run`.
enum PhotoAssets {
    static let folder: URL? = Bundle.main.url(forResource: "Photos", withExtension: nil)
        ?? Bundle.module.url(forResource: "Photos", withExtension: nil)

    static func url(for photoID: Photo.ID) -> URL? {
        folder?.appending(path: "\(photoID).jpg")
    }
}

/// Verkleinde foto's, per maat één keer gedecodeerd. ImageIO leest alleen de pixels die nodig zijn,
/// dus een printje in het raster kost geen volle foto.
@MainActor
final class PhotoImageCache {
    static let shared = PhotoImageCache()

    private var images: [String: NSImage] = [:]

    private init() {}

    func image(for photoID: Photo.ID, maxPixelSize: Int) -> NSImage? {
        let key = "\(photoID)@\(maxPixelSize)"
        if let cached = images[key] { return cached }

        guard let url = PhotoAssets.url(for: photoID),
              let source = CGImageSourceCreateWithURL(url as CFURL, nil) else { return nil }

        let options: [CFString: Any] = [
            kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceCreateThumbnailWithTransform: true,
            kCGImageSourceShouldCacheImmediately: true,
            kCGImageSourceThumbnailMaxPixelSize: maxPixelSize,
        ]
        guard let cgImage = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary) else { return nil }

        let image = NSImage(cgImage: cgImage, size: .zero)
        images[key] = image
        return image
    }
}
