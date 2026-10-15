# Scan Test

QR-tickets scannen met een telefoon, met de status gespiegeld in Notion.

## Onderdelen

- `/scan`: scanpagina voor de telefoon. Na de PIN en een naam voor de scanner (bijvoorbeeld "Ingang 1") blijft de camera doorscannen.
  - Groen: geldig, de gast staat nu op Binnen.
  - Oranje: al gescand, met tijd en scanner.
  - Rood: ongeldig gemaakt, of een onbekende code.
  - Grijs: geen verbinding met de server.
- `/admin`: tickets aanmaken (één naam per regel), QR-codes bekijken of afdrukken, tickets geldig of ongeldig maken, een scan terugzetten en tickets verwijderen. Met **Groot** verschijnt de QR schermvullend, zodat je vanaf het scherm kunt scannen.
- Notion-database **Tickets** op de pagina Scan Test. Kolommen: Naam, Code, Geldig, Status, Gescand op, Gescand door en Scanpogingen.

## Hoe de gegevens lopen

De server houdt de tickets bij in `tickets.db` (SQLite). Daardoor heeft de scanner direct antwoord, los van Notion.

- **Van server naar Notion.** Elke wijziging gaat via een wachtrij naar Notion, meestal binnen een seconde. Is Notion even niet bereikbaar, dan blijft de wijziging in de wachtrij staan, ook als de server opnieuw start.
- **Van Notion naar server.** Elke 30 seconden haalt de server Notion op. Daarbij komen mee:
  - wijzigingen in Naam, Geldig en Status;
  - nieuwe regels (een regel zonder code krijgt vanzelf een code);
  - regels die je in Notion verwijdert.
- **Na een wijziging op de server.** Een ticket dat net op de server is gewijzigd, krijgt 90 seconden voorrang op Notion. Zo zet een trage Notion-zoekopdracht een verse scan niet terug.
- **De Code** komt van de server. Pas je hem in Notion aan, dan zet de server hem terug.

Bij een lege `tickets.db` haalt de server alle tickets uit Notion op. Notion is dus ook de back-up.

## Starten

```
./start.sh
```

Bij de eerste start vraagt het script om de Notion-sleutel, een PIN voor de scanners en een wachtwoord voor de adminpagina. Die komen in `.env`. Daarna start het de server en een Cloudflare-tunnel, en toont het de adressen. Je stopt alles met Ctrl+C.

De tunnel is een *quick tunnel* van Cloudflare: gratis en zonder account, maar bij elke start krijg je een nieuw adres. Een vast adres op een eigen domein kan later met een benoemde tunnel.

## Vereisten

- Python 3.9 of nieuwer, alleen de standaardbibliotheek.
- `cloudflared` (`brew install cloudflared`).

De scanbibliotheek (qr-scanner, MIT) en de QR-generator (qrcode-generator, MIT) staan in `static/`. Er is dus geen CDN nodig.

## Problemen

- **De adminpagina meldt "Notion: fout".** De server toont de melding. Meestal ontbreekt de toegang: deel de pagina Scan Test met de Notion-koppeling.
- **`CERTIFICATE_VERIFY_FAILED` in de log.** Bij Python van python.org draai je eenmalig `Install Certificates.command` uit de map van Python in Programma's.
- **De camera start niet.** De scanpagina werkt alleen via https, dus via het tunneladres en niet via het IP-adres van de server. Sta camera-toegang toe voor de site.
