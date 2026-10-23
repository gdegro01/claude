# Briefing voor Claude Code: Sint-morph, zelfstandige run

Je werkt op de M5 van Gerke. Gerke is een paar uur weg en beantwoordt niets. Jij beslist zelf, binnen de regels hieronder, en levert bij zijn terugkomst de beste voorbeelden op, plus een rapport.

Deze map (`~/Developer/projects/arena/sint-morph`) is een geteste toolkit. Hij is gebouwd in een cloudsessie op nagebootste beelden; echte foto's en echte fal.ai-aanroepen zijn nieuw.

## Doel

Een interactief dobbelspel: zolang mensen met hun telefoon schudden zie je de Sint. Stopt het schudden, dan verandert de Sint in de persoon die een pakje mag openmaken. Jij zoekt het model en de prompt die dat het best doen, en maakt daar overtuigende voorbeelden van.

Eisen aan een goede clip:

1. **Echte handelingen, geen effect.** Mijter af (niet altijd), andere houding of positie, baard eraf, voorzichtig of lomp en snel. Geen fade, crossfade, dubbelbeeld, doorschijnend gezicht, slide-in of plotseling verschijnen.
2. **Spanning eerst.** De eerste ~3 seconden is niet te zien wie het wordt.
3. **Dan snel de onthulling**, precies landend op het eindframe.
4. **Vloeiend en geloofwaardig**: geen sprongen, geen vervormde handen of smeltende gezichten.
5. **30 fps** (voor versnellen en vertragen in het spel), lengte rond de 5 seconden.

**Budget: maximaal $22 aan fal.ai** (ongeveer €20). `run_test.py` houdt de uitgaven bij en weigert alles wat erboven komt (`budget_usd` in `config.json`; niet verhogen). Zuinig zijn is geen doel: gebruik het budget om tot goede, foutloze clips te komen, met opnieuw maken waar nodig.

**Begin met één clip.** Gerke wil vóór vertrek zien of het de goede kant op gaat: na het uitlijnen eerst 1 persoon × `kling3-std` × `v1` (`plan --count 1 --models kling3-std --variants v1 --note "snelle eerste test"`), meten, het contactblad zelf bekijken en in maximaal 5 regels melden wat je ziet en wat het kostte. Daarna pas de rest.

## Paden

| Wat | Pad |
| --- | --- |
| Startframe | `/Users/gerkedegroot/Developer/projects/sint/bron/sint.jpg` |
| Tweede genoemde plek | `/Users/gerkedegroot/Developer/projects/sint/personen/sint.jpg` |
| Eindframes | `/Users/gerkedegroot/Developer/projects/sint/personen/<naam>/eindframes/` |
| Deze kit | `/Users/gerkedegroot/Developer/projects/arena/sint-morph/` |

Zijn de twee `sint.jpg`'s verschillend, gebruik dan `bron/sint.jpg` (`--start` bij `align_frames.py`) en noteer dat. Wijzig of verwijder nooit iets in `projects/sint/`: dat is bronmateriaal. Werk alleen in `arena/sint-morph/`; laat een bestaand project in `arena/` ongemoeid.

## Onbewaakt

- **Niets vragen**, want er komt geen antwoord. Twijfel je, kies dan het verstandigste en noteer het.
- **VOORTGANG.md** in deze map: na elke stap bijwerken (tijd, wat gedaan, uitgaven, resultaten, volgende stap), zodat een nieuwe sessie kan hervatten na een gebruikslimiet of crash. Besluiten noteer je onder het kopje **Besluiten zonder Gerke**, met de reden.
- **Lange commando's op de achtergrond** (`nohup ... > runs/<run>/log.txt 2>&1 &`) en het log volgen. macOS heeft geen `timeout`-commando.
- **Echt stoppen** alleen als bronnen ontbreken of onbruikbaar zijn: schrijf dan `RAPPORT.md` met wat er mis is.
- Na een onderbreking: lees VOORTGANG.md, draai `python tools/run_test.py list` en `budget`, en ga verder waar je was. `go` is veilig te herhalen.

## Stap 1: installeren en controleren (gratis)

```bash
cd /Users/gerkedegroot/Developer/projects/arena/sint-morph
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
which ffmpeg || brew install ffmpeg
.venv/bin/python tools/selftest.py
```

FAL_KEY staat al in Gerkes map; de scripts vinden hem zelf in de omgeving of in `.env` / `.env.local` van `arena/` of `arena/sint-morph/` (ook als `FAL_API_KEY`). Meldt de zelftest dat hij ontbreekt, zoek dan in `~/Developer/projects/arena` en `~/Developer/projects` naar het bestand en zet in `arena/sint-morph/.env` een regel `FAL_KEY=...` met dezelfde waarde. Toon de waarde nooit, zet hem nooit in git of in een rapport.

## Stap 2: eindframes uitlijnen (gratis)

```bash
.venv/bin/python tools/align_frames.py
```

Per persoon kiest het script één eindframe (eerst `-J` aan het eind van de naam, dan hoogste `vN`, dan nieuwste) en legt het exact op het startframe: op de gedeelde achtergrond, anders op ogen en neus, anders alleen passend bijgesneden. Alle frames worden zo nodig bijgesneden naar een beeldverhouding die de modellen aankunnen.

Controleer zelf:

1. `frames/start/sint.png`: is door het bijsnijden niets belangrijks weggevallen (bovenkant mijter, staf, gezicht)? Zo wel: opnieuw met `--anchor-y` (0 = bovenkant houden) of `--aspect keep`. Let op: Veo en LTX werken alleen met 16:9 of 9:16.
2. `frames/check/<persoon>.jpg` van iedereen met status `controleren`: in het verschilpaneel hoort de achtergrond zwart te zijn. Goed? Dan mag die persoon mee (`--allow-check`).
3. `handmatig`, `fout`, `geen eindframe`: niet gebruiken, wel noemen in het rapport.

## Stap 3: personen beschrijven

Voor elke persoon die je gebruikt: bekijk `frames/end/<slug>.png` en vul `prompts/personen.json`:

```json
{"personen": {"<slug>": {"beschrijving": "a woman with short grey hair and round glasses, wearing a dark green sweater", "kostuum": "uit"}}}
```

- `beschrijving`: kort Engels, alleen wat zichtbaar is (haar, bril, kleding). Geen namen, geen leeftijd of afkomst.
- `kostuum`: `"uit"` bij gewone kleren, `"aan"` als de Sint-mantel er nog op zit, of een eigen Engelse zin.
- `extra` (optioneel): een Engelse zin die vóór de vaste slotzinnen komt, voor iets specifieks van deze persoon.
- Draagt iemand in het eindframe nog mijter of baard, kies die persoon dan niet.

## Stap 4: rondes draaien

Per ronde: plannen, genereren, meten, beoordelen, bijsturen.

```bash
.venv/bin/python tools/run_test.py plan --count 5 --allow-check --note "ronde 1: basis"
.venv/bin/python tools/run_test.py go <run-id>            # toont prompts en kosten
nohup .venv/bin/python tools/run_test.py go <run-id> --yes > runs/<run-id>/log.txt 2>&1 &
.venv/bin/python tools/evaluate.py measure <run-id>        # contactbladen + metingen, gratis
```

Gericht herhalen: `plan --persons a,b --variants v1,v3 --models kling-o3-std,seedance2-fast --note "..."`. Overzicht: `run_test.py list`, uitgaven: `run_test.py budget`. Mislukte clips opnieuw: `go <run> --yes --retry-failed`.

**Voorstel voor de verdeling van $16** (wijk af als de resultaten daarom vragen):

1. **Ronde 1, ±$3,60:** 5 willekeurige personen × Kling 3.0 Standard + FLUX 3 Max, varianten v1 t/m v5.
2. **Ronde 2, ±$3 tot $4:** andere modellen op 2 à 3 personen uit ronde 1, met dezelfde varianten, zodat je eerlijk vergelijkt. Kies er 2 à 3 uit de tabel hieronder.
3. **Rondes 3 en verder:** prompts bijsturen op het beste model, dan bevestigen op nieuwe personen (`--exclude-used`), zodat het recept niet bij één persoon toevallig werkt.
4. Houd minstens $1 over.

| Model (`--models`) | 5 s kost | Opmerking |
| --- | --- | --- |
| `kling3-std` | $0,42 | won eerdere begin/eind-tests |
| `kling3-pro` | $0,56 | 1080p |
| `kling-o3-std` | $0,42 | andere Kling-variant met eindframe |
| `flux3-max` | $0,21 | actieprijs t/m 7 nov |
| `seedance2-fast` | $1,21 | sterk op begin/eind, duur |
| `seedance2` | $1,52 | duurder, iets beter |
| `minimax-h3max` | $0,26 | actieprijs t/m 31 okt, 768p |
| `wan3` | $0,50 | native 30 fps, hoog op de leaderboard |
| `wan27` | $0,50 | native 30 fps |
| `pixverse6` | $0,23 | speciaal transitie-endpoint, goedkoop |
| `veo31-fast` | $0,60 | 6 s, alleen 16:9 of 9:16 |
| `ltx25-fast` | $0,54 | 6 s, native 48 fps, alleen 16:9 of 9:16 |

Daarbovenop reserveert het script max $0,10 per clip voor FILM-interpolatie naar 30 fps.

## Stap 5: zelf controleren en beoordelen (verplicht, elke ronde)

Wacht niet op Gerke en sla dit nooit over. Na **elke** ronde bekijk je **elke** clip zelf, voordat je de volgende ronde plant. Het doel is dat er in de beste voorbeelden geen enkele glitch of misalignment zit.

`evaluate.py measure` maakt per clip twee beelden. Bekijk ze **allebei**:

- `runs/<run>/eval/<clip>_sheet.jpg`: 21 frames over de hele clip (elke 0,25 s, 3 s rood omrand), met een grafiek. Blauw: lijkt op de Sint. Groen: lijkt op de persoon.
- `runs/<run>/eval/<clip>_detail.jpg`: 21 frames, elke 0,1 s, rond het onthullingsmoment. Daar zitten de meeste fouten. Een rood omrand frame is een mogelijke glitch.

Waar je actief naar zoekt:

- **Glitches**: een frame dat flitst of anders is dan zijn buren, een vlek, een hand of vinger die even verschijnt of verdwijnt, een gezicht dat één frame vervormt, een mijter of baard die springt.
- **Misalignment**: het eerste frame is niet precies de Sint (verschoven, ingezoomd, andere uitsnede of kleur), of het laatste frame landt niet precies op het eindframe. Vergelijk zelf het laatste frame met `frames/end/<slug>.png` en het eerste met `frames/start/sint.png`.
- **Ongeloofwaardige anatomie**: extra vingers, smeltende gezichten, armen die door het lichaam gaan.

Twijfel je over een moment, haal dan dat frame op volle grootte eruit:

```bash
ffmpeg -loglevel error -ss 2.8 -i runs/<run>/fps30/<clip>.mp4 -frames:v 1 /tmp/f.png
```

Metingen die meehelpen (in `runs/<run>/eval/metrics.json`):

| Meting | Goed | Fout |
| --- | --- | --- |
| `reveal_s` (persoon herkenbaar) | ≥ 3,0 s bij 5 s | < 2,5 s: te vroeg |
| `hidden_s` (lijkt op geen van beide: afgedekt door een handeling) | > 0,3 s is een goed teken | 0 bij een vloeiende fade |
| `fade_score` (mix van begin en eind) | < 0,6 | ≥ 0,8: fade of dubbelbeeld |
| `jump_ratio` + `jump_size` | geen vlag | vlag: knip of sprong |
| `end_sim_last`, aansluiting eind | ≥ 0,8 | eindframe niet gehaald |
| `glitches_s` (op de originele frames) | leeg | elk tijdstip: bekijken, meestal opnieuw |
| `begin_/eind_shift_pct`, `_scale` | < 1,5 % en schaal 0,98 tot 1,02 | misalignment: opnieuw |
| `begin_/eind_color` | < 10 | kleurverschil: zichtbare schok in het spel |

Metingen zijn hulpmiddelen; jouw blik op de frames beslist. Een vervormde hand of een smeltend gezicht zie je alleen door te kijken.

Oordeel per clip, en leg het vast:

```bash
.venv/bin/python tools/evaluate.py verdict <run> <clip> goed --note "mijter dekt gezicht tot 3,1 s; baard eraf geloofwaardig" [--best]
```

- **goed**: alle vijf eisen in orde.
- **twijfel**: één eis net niet (bijvoorbeeld onthulling op 2,7 s, of een korte vreemde hand).
- **onvoldoende**: fade of dubbelbeeld, te vroege onthulling, vervormingen, sprong, glitch, misalignment, of eindframe gemist.

**Opnieuw maken** bij een glitch, misalignment of eenmalige vervorming, zonder te wachten: maak dezelfde persoon, variant en model nog een keer als nieuwe run (`plan --persons <slug> --variants <v> --models <model> --note "opnieuw: glitch bij 3,2 s in <run>/<clip>"`). Komt dezelfde fout terug, verander dan eerst de prompt (nieuwe variant), daarna het model. Een clip met een glitch komt nooit bij de beste voorbeelden.
- `--best`: de clips die Gerke als eerste moet zien. Dat zijn er uiteindelijk 4 tot 8, van verschillende personen, met het aanbevolen recept voorop.

## Bijsturen

| Wat je ziet | Wat je doet |
| --- | --- |
| Onthulling te vroeg | Variant met volledige afdekking (v1, v3, v4); verstopactie langer en explicieter maken; of `--duration 6` |
| Fade, dubbelbeeld, doorschijnend gezicht | Afdekking explicieter ("the face is completely hidden behind ..."); ander model |
| Eindframe niet gehaald | Ander model; dit model negeert het eindframe |
| Vervormde handen of gezicht | Eenvoudigere handeling (v5), minder handelingen tegelijk; Kling 3.0 Pro |
| Knip of sprong | Andere variant of ander model |
| Handeling klopt niet met het beeld (bijvoorbeeld Sint zit) | Pas de variant aan op wat je in `sint.png` ziet |

Nieuwe of aangepaste prompts zet je als **nieuwe variant** in `prompts/varianten.json` (bijvoorbeeld `v1b`), met een korte Nederlandse `uitleg`. Laat bestaande varianten staan, zodat runs vergelijkbaar blijven. Verander per poging één ding, en noteer wat je verwachtte en wat er gebeurde. Parameters in `tools/common.py` (zoals Kling `cfg_scale` 0,5 → 0,7) mag je aanpassen; noteer het.

## Stoppen en opleveren

Stop met genereren zodra een van deze waar is:

- je hebt minstens 6 clips met oordeel `goed` zonder glitch of misalignment, van minstens 4 personen, en het recept werkte ook op personen die je niet eerder gebruikte;
- er is minder dan $1 budget over;
- er zijn ruim 3 uur verstreken.

Lever dan op:

1. `--best` op de 4 à 8 beste clips.
2. **RAPPORT.md** in deze map, kort en concreet:
   - bovenaan het antwoord: welk model met welke prompt het best werkt, en waarom;
   - de beste clips (run en clip-id), met per clip één zin;
   - tabel per model: clips, goed / twijfel / onvoldoende, kosten per goede clip;
   - wat werkte en wat niet, per variant;
   - uitgaven (`run_test.py budget`) en wat je zonder Gerke besloot;
   - aanbeveling voor de echte productie (model, prompt, duur, route naar 30 fps).
3. De site laten draaien, zodat Gerke hem direct kan openen: `nohup .venv/bin/python tools/serve.py > serve.log 2>&1 &`. Die opent op `http://localhost:8765` met het Overzicht: alle sessies, alle filmpjes met filters (★ Beste, Goed, per model) en een groot afspeelvenster.
4. VOORTGANG.md afsluiten met "klaar" en de tijd.

## Framerate: hoe 30 fps ontstaat

De meeste modellen leveren 24 fps; Wan levert 30 en LTX 48. Per clip maakt de kit:

- `raw/`: het origineel;
- `master/`: 5× zoveel frames via FILM op fal.ai (24 → 120, 30 → 150, 48 → 240 fps). De echte framerate wordt uit het aantal frames bepaald;
- `fps30/`: daaruit precies elk n-de frame, dus exact 30 fps, met eerste en laatste frame van het model zelf;
- `posters/`: eerste en laatste frame. Het eerste is het stilstaande Sint-beeld in het spel, zodat de overgang naar de video naadloos is.

Lukt FILM niet, gebruik dan `post <run> --interp local` (ffmpeg, langzamer).

## Als er iets misgaat

- **401/403 van fal:** sleutel ongeldig of zonder tegoed. Stop met genereren en schrijf RAPPORT.md.
- **422 (ongeldige invoer):** een veldnaam is veranderd. Lees `https://fal.ai/models/<endpoint>/llms.txt`, pas de functie voor dat model in `tools/common.py` aan en noteer het.
- **Een model blijft falen:** sla het over en noteer het.
- **Video-URL verlopen:** de nabewerking uploadt dan zelf opnieuw.

## Niet doen

- FAL_KEY tonen, loggen of committen.
- Iets wijzigen of verwijderen in `projects/sint/`.
- `budget_usd` verhogen of de budgetcontrole omzeilen.
- Runs, beoordelingen of bestaande varianten verwijderen.

## Mapstructuur

```
sint-morph/
  BRIEFING.md, PROMPTS.md, config.json, requirements.txt
  prompts/varianten.json   varianten v1 t/m v6 (+ jouw nieuwe), negatieve prompt
  prompts/personen.json    beschrijving en kostuum per persoon
  tools/selftest.py        controle, gratis
  tools/align_frames.py    eindframes uitlijnen
  tools/run_test.py        plan / go / post / list / budget
  tools/evaluate.py        measure / verdict / best
  tools/serve.py           site op localhost:8765
  tools/common.py          modellen, prijzen, ffmpeg
  site/                    de beoordelingssite
  frames/                  (aangemaakt) start, end, upload, check
  runs/<run>/              (aangemaakt) plan, manifest, raw, master, fps30, posters, eval, oordelen
  VOORTGANG.md, RAPPORT.md (maak jij)
```
