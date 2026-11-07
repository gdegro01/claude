#!/usr/bin/env bash
# Bouwt Fotokeuze.app uit het Swift package: een echte app-bundel met Info.plist,
# Nederlandse lokalisatie (dus Nederlandse systeemmenu's) en de voorbeeldfoto's.
# Gebruik: Scripts/make-app.sh [release|debug]
set -euo pipefail

cd "$(dirname "$0")/.."
CONFIGURATION="${1:-release}"

swift build -c "$CONFIGURATION"
BIN_DIR="$(swift build -c "$CONFIGURATION" --show-bin-path)"

APP="build/Fotokeuze.app"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources/nl.lproj"
cp "$BIN_DIR/Fotokeuze" "$APP/Contents/MacOS/Fotokeuze"
cp -R "Sources/Fotokeuze/Resources/Photos" "$APP/Contents/Resources/Photos"

cat > "$APP/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>nl</string>
    <key>CFBundleLocalizations</key>
    <array>
        <string>nl</string>
    </array>
    <key>CFBundleDisplayName</key>
    <string>Fotokeuze</string>
    <key>CFBundleName</key>
    <string>Fotokeuze</string>
    <key>CFBundleExecutable</key>
    <string>Fotokeuze</string>
    <key>CFBundleIdentifier</key>
    <string>com.example.fotokeuze</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>0.1</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>26.0</string>
    <key>LSApplicationCategoryType</key>
    <string>public.app-category.photography</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSPrincipalClass</key>
    <string>NSApplication</string>
</dict>
</plist>
PLIST

codesign --force --sign - "$APP" >/dev/null
echo "Klaar: $APP"
echo "Starten: open $APP"
