# Fotokeuze

Een macOS 26 app om per stapel vergelijkbare foto's te kiezen wat je bewaart. Dit is het geraamte: de interface, het datamodel, de animaties en de keuzeflow werken met voorbeeldfoto's. Het echte opruimen in Foto's of Finder is nog niet aangesloten.

## Starten

Vereist macOS 26 en Xcode 26.

| Manier | Hoe | Opmerking |
|---|---|---|
| Xcode | Open `Package.swift`, kies het schema Fotokeuze en My Mac, druk op ⌘R | Snelste manier om te ontwikkelen |
| Terminal | `swift run` | Systeemmenu's zijn dan Engels, want er is geen app-bundel |
| Als app | `Scripts/make-app.sh` en daarna `open build/Fotokeuze.app` | Echte bundel met Info.plist en Nederlandse menu's |

## Browserpreview

`Preview/index.html` laat dezelfde app zien in de browser, met dezelfde voorbeelddata. Open het bestand direct of start een server in deze map:

```
python3 -m http.server
```

Ga dan naar `http://localhost:8000/Preview/`. De map `Preview/photos` is een symlink naar de foto's van de app.

## Wat er in zit

- **Venster.** `NavigationSplitView` met een zijbalk voor bibliotheek, albums en datums. De werkbalk heeft een segmentknop voor Alle sets, Nog te kiezen en Bewaard, menu's voor stapelgrootte en sortering, Instellingen en een zoekveld. In macOS 26 krijgen die vanzelf Liquid Glass.
- **Kaarten.** Elke stapel is een kaart met `glassEffect(.regular.tint(...))` in een eigen tint. De achtergrond is iets donkerder dan de kaarten, met zachte kleurvlekken waar het glas op kan breken. De stapel waaiert uit bij hover.
- **Quick Look.** Een klik op een kaart laat de bovenste print met `matchedGeometryEffect` naar de grote weergave vliegen. De prints erachter vliegen naar hun plek in de filmstrip. Je vinkt per foto aan wat je bewaart. Pijltjes bladeren, spatiebalk wisselt bewaren, Return is Gereed, Esc sluit.
- **Keuzebalk.** Een zwevende glazen balk telt wat er weg gaat en wat blijft, over de stapels die je hebt gekozen. Toepassen vraagt om bevestiging en is te herstellen met ⌘Z of de knop Herstel.
- **Menu's.** Archief heeft Bevestigen en toepassen (⌘↩). Weergave heeft de drie filters (⌘1, ⌘2, ⌘3) en de zijbalk.
- **Instellingen.** Stapelgrootte en wel of geen bevestiging voor het toepassen.

## Opbouw

| Map | Inhoud |
|---|---|
| `Sources/Fotokeuze/App` | App, vensters, menu-items |
| `Sources/Fotokeuze/Model` | `PhotoSet`, `PhotoLibrary` (`@Observable`), voorbeelddata |
| `Sources/Fotokeuze/Views` | Zijbalk, raster, kaart, fotostapel, Quick Look, keuzebalk, instellingen |
| `Sources/Fotokeuze/Support` | Laden en verkleinen van foto's, kleuren, kleine hulptypes |
| `Sources/Fotokeuze/Resources/Photos` | Voorbeeldfoto's, zie `PHOTO_CREDITS.md` |
| `Preview` | Browserpreview |
| `Scripts` | Bouwscript voor de app-bundel |

## Keuzes in het ontwerp

- De onderbalk is een zwevende glazen balk in plaats van een donkere balk. Zo volgt hij licht en donker van het systeem, zoals de richtlijnen van macOS 26 vragen.
- In de balk staat "N foto's verwijderen" en "N blijven bewaard". De tellingen gaan alleen over stapels die gekozen zijn: aangevinkt op de kaart, of geopend en gewijzigd of afgesloten met Gereed.
- De app stelt per stapel een keuze voor: de eerste foto van elke reeks blijft bewaard. Aanvinken op de kaart neemt dat voorstel over.

## Volgende stappen

1. Foto's laden met PhotoKit (`PHAsset`) en stapels vormen op tijd en gelijkenis, bijvoorbeeld met de feature prints van Vision.
2. Toepassen aansluiten op `PHAssetChangeRequest.deleteAssets`. Dat zet foto's in Recent verwijderd, dus ze blijven terug te halen.
3. Een String Catalog toevoegen zodat de teksten vertaalbaar zijn.
4. Tests voor `PhotoLibrary`: filteren, tellen, toepassen en herstellen.

Dit geraamte is geschreven zonder het hier te kunnen compileren. Verwacht bij de eerste build hooguit kleine aanpassingen.
