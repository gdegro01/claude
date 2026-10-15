# Scan Test

QR-tickets tonen op een iPad, scannen met een telefoon, en de status volgen in Notion.

## Pagina's

| Pagina | Apparaat | Toegang |
|---|---|---|
| `/admin` | laptop | wachtwoord |
| `/show` | iPad | wachtwoord |
| `/scan` | telefoon | PIN |

### `/admin`

- Tickets aanmaken: één naam per regel.
- Tickets bekijken als lijst, of als kaarten met QR-code.
- Tickets geldig of ongeldig maken, een scan terugzetten, en verwijderen.
- **Naar scherm** stuurt een ticket naar de iPad.
- Bovenaan zie je welk ticket de iPad op dat moment toont.

### `/show`

- Eén ticket per scherm, met een grote QR-code.
- Bladeren met Vorige en Volgende, of door te vegen.
- Een tik op de teller (bijvoorbeeld "3 / 10") opent de lijst om direct naar een ticket te springen.
- Filter: alle tickets, of alleen wie nog niet binnen is.
- Zodra de telefoon het getoonde ticket scant, verschijnt een melding:
  - groen bij een geldig ticket;
  - oranje bij een ticket dat al gescand was;
  - rood bij een ongeldig ticket.
- Met **Door na scan** aan gaat het scherm na de groene melding vanzelf naar het volgende ticket.
- Het scherm blijft aan zolang de pagina open staat.

### `/scan`

- Na de PIN en een naam voor de scanner blijft de camera doorscannen.
- Bij elke scan krijg je groen, oranje of rood, met geluid.
- Met **Typen** voer je een code met de hand in.

### Notion

De database **Tickets** op de pagina Scan Test, met de kolommen Naam, Code, Geldig, Status, Gescand op, Gescand door en Scanpogingen.

## Starten

```
./start.sh
```

Bij de eerste start vraagt het script om de Notion-sleutel, een PIN voor de scanners en een wachtwoord. Die komen in `.env`.

Daarna start de server op `127.0.0.1:8787`. Via `tailscale serve` is hij bereikbaar op `https://<machine>.<tailnet>.ts.net:8443`, maar alleen voor apparaten in je tailnet. Het script toont de drie adressen. Ctrl+C stopt de server en zet de Tailscale-doorverwijzing weer uit.

Wil je een openbaar adres, gebruik dan `./start.sh cloudflare`. Dat start een tijdelijke Cloudflare-tunnel, die bij elke start een nieuw adres krijgt.

Draait er al iets op poort 8787, zet dan een andere poort in `.env` (`PORT=...`).

## Hoe de gegevens lopen

De server houdt de tickets bij in `tickets.db` (SQLite). Daardoor hebben scanner en iPad direct antwoord, los van Notion.

- **Van server naar Notion.** Elke wijziging gaat via een wachtrij naar Notion, meestal binnen een seconde. De wachtrij overleeft een herstart.
- **Van Notion naar server.** Elke 30 seconden haalt de server Notion op. Daarbij komen mee:
  - wijzigingen in Naam, Geldig en Status;
  - nieuwe regels (een regel zonder code krijgt vanzelf een code);
  - regels die je in Notion verwijdert.
- **Na een wijziging op de server.** Een ticket dat net op de server is gewijzigd, krijgt 90 seconden voorrang op Notion.
- **De Code** komt van de server. Pas je hem in Notion aan, dan zet de server hem terug.
- **Bij een lege `tickets.db`** haalt de server alle tickets uit Notion op.

Welk ticket de iPad toont, houdt de server alleen in het geheugen bij. Na een herstart begint het scherm bij het eerste ticket.

## Vereisten

- Python 3.9 of nieuwer, alleen de standaardbibliotheek.
- Tailscale, met MagicDNS en HTTPS Certificates aan. Voor de Cloudflare-variant ook `cloudflared`.

De scanbibliotheek (qr-scanner, MIT) en de QR-generator (qrcode-generator, MIT) staan in `static/`.

## Problemen

- **De adminpagina meldt "Notion: fout".** De server toont de melding. Meestal ontbreekt de toegang: deel de pagina Scan Test met de Notion-koppeling.
- **`CERTIFICATE_VERIFY_FAILED` in de log.** Bij Python van python.org draai je eenmalig `Install Certificates.command` uit de map van Python in Programma's.
- **De camera start niet.** De scanpagina werkt alleen via https: gebruik het `ts.net`-adres, niet het IP-adres. Sta camera-toegang toe voor de site.
- **Een iPad of telefoon kan het adres niet openen.** Zet Tailscale aan op dat apparaat.
