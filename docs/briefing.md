# SPIN. Prototype Briefing Reserveringssysteem

Ontwerp een premium reserveringssysteem-prototype voor SPIN: een hybride horecaconcept in Amsterdam waarin pool, dining, listening bar cultuur en cocktails samenkomen.

Het prototype moet aanvoelen als:

- een echt hospitality-product
- operationeel intelligent
- cinematografisch maar ingetogen
- geloofwaardig genoeg om live te demonstreren aan eigenaren en investeerders

Dit mag absoluut niet voelen als een standaard reserveringsapp of generiek SaaS-dashboard.

De sfeer moet dichter liggen bij:

- boutique hotel software
- Japanse listening bars
- premium airline operations software
- moderne nightlife hospitality

Het prototype wordt primair ontworpen en gepresenteerd in Figma.

Belangrijk:

- het logo zit als SVG-bestand in de map
- de gebruikte fonts zitten ook in de map
- er zit mogelijk ook een sfeerfoto/reference image in de map die gebruikt mag worden voor bijvoorbeeld het welkomstscherm of hero-secties

---

# Hoofddoel

Het prototype moet tijdens de pitch 3 dingen bewijzen:

## 1. Productgevoel

Dit voelt als een premium modern venue-product, niet als OpenTable of een standaard booking form.

## 2. Operationele intelligentie

Het systeem lost echte horeca-problemen op:

- wachtlijsten
- no-shows
- late arrivals
- seat turnover
- priority guests
- live occupancy

## 3. Edge cases

Het prototype moet laten zien dat er verder is gedacht dan alleen de happy flow.

---

# Typografie

## Headings + Buttons

Gebruik:

- Parabolica Bold
- Parabolica SemiBold

Toepassen op:

- paginatitels
- grote headings
- CTA-buttons
- timers
- belangrijke status-indicatoren
- grote numerieke waarden

---

## Body + System UI

Gebruik:

- Fragment Mono

Toepassen op:

- labels
- metadata
- timestamps
- dashboardtabellen
- reserveringsreferenties
- operator controls
- kleine interface-copy
- statuslabels

Het contrast tussen Parabolica en Fragment Mono is essentieel voor de SPIN-identiteit.

---

# Kleursysteem

## Main Dark

`#261C0D`

Gebruik voor:

- booking screens
- overlays
- navigatie
- cinematografische states
- waitlist flows

---

## Main Light

`#F7ECD9`

Gebruik voor:

- dashboard-achtergronden
- tabellen
- operationele panels

Gebruik géén puur wit.

---

## Accent Purple

`#8874D9`

Gebruik voor:

- geselecteerde states
- actieve filters
- waitlist-indicatoren
- timers
- gekoppelde reserveringen
- intelligente/system-states

Paars moet slim en operationeel aanvoelen.

---

## Accent Orange

`#D95125`

ALLEEN gebruiken voor:

- belangrijke CTA’s
- claim buttons
- check-in
- release actions
- primaire bevestigingen

Oranje moet zeldzaam en belangrijk aanvoelen.

---

## Error / Critical

`#3E0E14`

Gebruik voor:

- no-shows
- fraude-waarschuwingen
- herhaalde annuleringen
- operationele problemen

Gebruik geen fel rood.

---

## Supporting Dark Tone

`#65230C`

Subtiel gebruiken voor:

- layered surfaces
- hover states
- donkere cards
- gradients

---

## Supporting Neutral

`#87808F`

Gebruik voor:

- secundaire metadata
- inactieve states
- muted indicators

---

# User Flow (Gast-flow)

Mobile-first reserveringservaring gericht op snelheid, duidelijkheid en premium hospitality UX.

De gast-flow moet:

- cinematografisch
- tactiel
- rustig
- premium

aanvoelen.

---

# Kernschermen gast-flow

1. Landing page
2. Datum & tijd selectie
3. Aantal gasten + activiteit
4. Koelkastpakket selectie
5. Contactgegevens
6. Aanbetaling / bevestiging
7. Reservering bevestigd
8. Waitlist claim flow

---

# Extra states

- reservering wijzigen
- reservering annuleren
- dubbele reservering waarschuwing
- offline mode
- late arrival messaging
- contact modal
- payment loading state
- mail previews

---

# Datum & Tijd Selectie

Dit is één van de belangrijkste schermen.

Inclusief:

- horizontale dag-selector
- slot-grid
- beschikbaarheidsstates:
    - beschikbaar
    - beperkt
    - vol
- wachtlijst-CTA bij volle slots
- persistente reserveringssamenvatting

De interface moet:

- premium
- scanbaar
- subtiel geanimeerd
- responsive

aanvoelen.

Vermijd:

- generieke kalender-UI
- standaard SaaS booking patterns

---

# Waitlist Claim Flow (Belangrijk Demo-moment)

Dit is het hero-interactiemoment van de pitch.

Scenario:

Een reservering wordt geannuleerd.

Een gebruiker op de wachtlijst krijgt direct een notificatie.

De ervaring moet urgent en cinematografisch voelen zonder gamified te worden.

Flow:

1. Notificatie verschijnt
2. Gebruiker opent notificatie
3. Fullscreen claim-screen opent
4. Grote countdown timer start
5. Gebruiker claimt tafel
6. Reservering wordt live overgenomen
7. Dashboard update direct mee

---

# Fake Notification System

Bouw realistische mobiele notificaties BINNEN het prototype.

Notificaties moeten native aanvoelen:

- iOS-achtige banner animaties
- zachte blur-backgrounds
- smooth spring motion
- subtiele bounce physics
- realistische timing en spacing

---

## Notificatie voorbeeld 1

Reserveringsherinnering

SPIN.

Bevestig je reservering.

Bevestig je reservering voor morgen om 19:00 binnen 24 uur om je tafel te behouden.

[Bevestig reservering]

---

## Notificatie voorbeeld 2

Plek beschikbaar op wachtlijst

SPIN.

Er is zojuist een tafel vrijgekomen.

Je hebt 5 minuten om de reservering van 19:00 voor 4 personen te claimen.

[Claim tafel]

Dit moment moet magisch aanvoelen tijdens de presentatie.

---

# Operator Dashboard

Desktop/tablet-georiënteerd host-control systeem.

Het dashboard moet:

- rustiger
- duurder
- beter scanbaar
- operationeel geloofwaardig

aanvoelen.

Niet:

- gaming UI
- nightclub neon
- startup SaaS dashboard

---

# Kernschermen operator-flow

1. Dashboard
2. Plattegrond
3. Reserveringen
4. Wachtlijst
5. Inbox
6. Instellingen
7. QR Check-in

---

# Dashboard Behaviour

Het dashboard moet live aanvoelen.

Reserveringen en wachtlijstposities moeten:

- vloeiend animeren
- natuurlijk reorderen
- in-place updaten
- realtime aanvoelen

Geen:

- statische cards
- harde refreshes
- abrupte veranderingen

Hosts moeten binnen 3 seconden kunnen zien:

- wie te laat is
- welke tafels actief zijn
- wat aandacht nodig heeft
- huidige bezetting
- druk op de wachtlijst

---

# Reservation Detail Drawer

Reserveringsdetails moeten openen als operationele slide-over drawers, niet als losse pagina’s.

Inclusief:

- gastinformatie
- betaalstatus
- arrival state
- timeline
- communicatiegeschiedenis
- operationele acties

Host actions:

- Check in
- Markeer te laat
- Verleng sessie
- Stuur bericht
- Geef tafel vrij
- No-show fee kwijtschelden

---

# Plattegrond Redesign (Belangrijk)

De huidige plattegrond voelt nog teveel als UI-cards in plaats van een echte venue.

De nieuwe richting moet voelen als:

- vereenvoudigde architecturale top-down view
- boutique hospitality software
- ruimtelijk geloofwaardig
- operationeel levend

Niet:

- dashboard widgets
- Trello cards
- gaming tiles

---

# Pooltafel Visualisatie

Pooltafels moeten:

- aanvoelen als echte objecten in de ruimte
- natuurlijke spacing hebben
- circulatieroutes suggereren
- occupancy duidelijk communiceren

Per tafel tonen:

- tafelnummer
- gastnaam
- occupancy state
- elapsed session duration
- minibar/fridge status

---

# Betere Occupancy Logica

Vermijd statische tijden zoals:

“17:30”

Gebruik:

- “Speelt · 47m”
- “Start over · 18m”
- “Ingecheckt · 1u 12m”
- “Overtijd · +22m”

Dit laat het venue direct levend voelen.

---

# Pooltafel Statuskleuren

Beschikbaar:

neutrale beige outline

Binnenkort gereserveerd:

paarse accentkleur

Actieve sessie:

gedempte groen/neutrale tint

Overtijd:

oranje accent

No-show/probleem:

donker bordeaux

---

# Dining Area

Dining tables moeten:

- groter en architectonischer aanvoelen
- duidelijkere spacing hebben
- premium en rustig ogen

Toon:

- reserveringsnaam
- groepsgrootte
- timing state
- arrival state

---

# Bar Seating Visualisatie (Belangrijk)

De huidige bar-seat visualisatie voelt nog te abstract en onaf.

Vervang dit door een geloofwaardiger operationeel barsysteem.

---

# Gewenste Bar Experience

Maak:

- een lange horizontale bar counter
- gekoppelde zitplaatsen
- realistisch occupancy-gevoel

Visuele referentie:

Japanse cocktailbars gecombineerd met airline seat management.

---

# Bar Seat Indicators

Per stoel tonen:

- stoelnummer
- occupancy state
- elapsed seating duration

Voorbeelden:

- “12m”
- “1u 04m”
- “Vrij”
- “Komt eraan”

---

# Radial Occupancy Rings

Gebruik subtiele geanimeerde radial progress indicators rond bezette stoelen.

Doel:

seating duration direct visueel communiceren.

Gedrag:

- dunne cirkelvormige progress stroke
- vult langzaam over tijd
- paars voor actief
- oranje richting turnover
- neutraal wanneer vrij

Dit is extreem belangrijk voor demo-readability.

---

# Inbox / Communication System

De inbox moet aanvoelen als:

- een hospitality communication tool
- niet als e-mailsoftware

Inclusief:

- gastberichten
- late arrival meldingen
- verjaardagsverzoeken
- suspicious booking warnings
- operationele notities

Gebruik:

- activity feed patterns
- compacte message threads
- quick action templates

# Motion & Interaction

Gebruik waar mogelijk bestaande open-source Motion voorbeelden en interaction patterns als basis, in plaats van alles volledig from scratch op te bouwen.

Belangrijk:

kopieer niet letterlijk de styling.

Gebruik deze patterns als fundament voor:

- interactiegedrag
- motion logic
- transitions
- timing
- spatial behaviour

Alles moet vervolgens worden aangepast aan de SPIN-visuele identiteit, typografie en kleuren.

Focus vooral op:

- shared element transitions
- contextual action expansion
- notification animations
- waitlist claim flows
- dashboard state transitions
- occupancy indicators
- fullscreen modal transitions

---

# Gewenste Motion Richting

Motion moet:

- native
- tactiel
- vloeiend
- licht cinematografisch
- operationeel betekenisvol

aanvoelen.

Vermijd:

- flashy startup-animaties
- overdreven bounce physics
- gaming-style transitions
- speelse gimmicks
- overmatige micro-animaties

De interface moet levend aanvoelen, niet druk.

---

# Expandable Action Groups

Gebruik expandable interaction patterns geïnspireerd op moderne native interfaces en Motion shared-layout examples.

Gebruik voor:

- reserveringsacties
- waitlist acties
- operator quick actions
- bar seat controls

In plaats van losse buttonrijen moeten secundaire acties vloeiend expanden vanuit één compacte trigger.

Voorbeeld:

“Actions” opent subtiel:

- Check in
- Markeer te laat
- Verleng sessie
- Stuur bericht
- Geef tafel vrij

Belangrijk:

dit moet precies, rustig en operationeel aanvoelen.

Niet bubbly of playful.

---

# Notification → Fullscreen Transition

Gebruik shared element transitions waarbij notificaties transformeren naar een fullscreen flow.

Voorbeelden:

- waitlist claim flow
- reserveringsbevestiging
- late arrival flow

Scenario:

een notificatie verschijnt bovenin het scherm.

Bij interactie groeit deze vloeiend uit naar een fullscreen experience.

Bijvoorbeeld:

“Er is een tafel vrijgekomen”

→ notificatie opent

→ background blur

→ fullscreen claim screen

→ countdown timer verschijnt

→ CTA activeert

Dit moment moet premium en bijna Apple-achtig aanvoelen.

---

# Live Dashboard Updates

Gebruik subtiele layout animations voor:

- wachtlijst reordering
- tafelstatus wijzigingen
- check-ins
- reserveringsupdates
- occupancy changes

Voorkom:

- harde refreshes
- plotseling verspringende content
- instant replacements

Alles moet vloeiend en realtime aanvoelen.

---

# Animated Occupancy Indicators

Gebruik subtiele geanimeerde occupancy indicators voor:

- bar seats
- pooltafels
- sessieduur
- overtime states

Gebruik:

- dunne radial progress rings
- subtiele motion
- langzame progressie over tijd

Kleurgedrag:

- paars = actief
- oranje = nearing turnover
- neutraal = vrij

Dit is belangrijk voor scanbaarheid tijdens de demo.

---

# Contextual Motion Behaviour

Gebruik motion alleen wanneer het:

- statusverandering uitlegt
- urgentie communiceert
- focus begeleidt
- spatial logic versterkt
- operational awareness verhoogt

Motion mag nooit puur decoratief zijn.

---

# Waitlist Claim Experience

Dit is één van de belangrijkste demo-momenten.

De flow moet:

- urgent
- premium
- realtime
- spannend
- maar gecontroleerd

aanvoelen.

Gebruik:

- fullscreen overlay
- subtiele blur
- countdown ring
- rustige cinematic transitions
- realtime dashboard updates

Wanneer een gebruiker een tafel claimt:

- moet de waitlist live reorderen
- verandert de tafelstatus direct
- update het dashboard vloeiend mee

Dit moet voelen alsof het systeem echt live draait.

---

# Reservation Detail Drawers

Gebruik slide-over drawers in plaats van losse pagina’s.

Bij klik op een reservering:

- drawer schuift vloeiend in
- achtergrond blijft zichtbaar
- context blijft behouden

Gebruik expandable action patterns binnen deze drawers voor:

- Check in
- Markeer te laat
- Verleng sessie
- Stuur bericht
- No-show fee kwijtschelden
- Geef tafel vrij

---

# Bar Seat Interactions

Bar seats mogen compacte expandable interactions gebruiken.

Bij hover/tap:

- seat highlight
- subtiele expansion
- quick actions verschijnen

Bijvoorbeeld:

- Seat guest
- Extend stay
- Clear seat
- Mark VIP

Belangrijk:

minimalistisch en operationeel houden.

---

# Belangrijk

Gebruik hoogwaardige open-source motion patterns waar mogelijk, in plaats van alle interacties volledig opnieuw te ontwerpen.

Focus op:

- bewezen interaction behaviour
- consistente motion language
- premium feel
- operationele geloofwaardigheid

Niet op:

- unieke gimmicks
- experimentele motion
- overdesigned effects

# Motion & Interaction Referenties

Gebruik onderstaande voorbeelden als interaction reference voor motion behaviour, transitions en interaction logic.

Belangrijk:

- gebruik ze als foundation
- niet letterlijk visueel kopiëren
- pas alles aan naar de SPIN branding, typografie en kleuren

---

## Expandable Action Groups

Gebruik als referentie voor:

- reservation actions
- waitlist actions
- operator quick actions
- contextual controls

Reference:

[Motion.dev Create Button Example](https://motion.dev/examples/react-create-button?utm_source=chatgpt.com)

Gewenst gedrag:

- secondary actions expanden vloeiend vanuit één trigger
- shared layout animations
- subtiele spring motion
- compact en operationeel

---

## Notification → Fullscreen Transitions

Gebruik als inspiratie voor:

- waitlist claim flow
- reserveringsbevestiging
- late arrival states
- fullscreen overlays

Reference:

[Motion.dev Notification Animation Examples](https://motion.dev/examples?utm_source=chatgpt.com)

Gewenst gedrag:

- notificaties voelen native/iOS-achtig
- vloeiende morph naar fullscreen flow
- blur + scale transitions
- subtiele cinematic timing

---

## Shared Layout Dashboard Motion

Gebruik als referentie voor:

- waitlist reorder animations
- live occupancy updates
- dashboard state transitions
- realtime table changes

Reference:

[Motion Layout Animations Docs](https://motion.dev/docs/react-layout-animations?utm_source=chatgpt.com)

Gewenst gedrag:

- geen harde refreshes
- content verschuift natuurlijk
- realtime operational feel

---

## Presence & Overlay Transitions

Gebruik voor:

- modals
- drawers
- claim overlays
- confirmation states

Reference:

[Motion AnimatePresence Docs](https://motion.dev/docs/react-animate-presence?utm_source=chatgpt.com)

Gewenst gedrag:

- zachte enter/exit transitions
- cinematic maar restrained
- overlays moeten premium aanvoelen

---

## High-End Cinematic Timing

Gebruik subtiel voor:

- hero waitlist moments
- fullscreen claim timer
- important operational state changes

Reference:

[GSAP Showcase](https://gsap.com/showcase/?utm_source=chatgpt.com)

Belangrijk:

Gebruik GSAP-achtige timing en cinematic pacing als inspiratie, maar houd motion minimalistisch en functioneel.

---

## Native-Like Interaction Behaviour

Gebruik als algemene inspiratie voor:

- tactile motion
- spring physics
- spatial transitions
- mobile interaction logic

Reference:

[Motion.dev Examples Overview](https://motion.dev/examples?utm_source=chatgpt.com)