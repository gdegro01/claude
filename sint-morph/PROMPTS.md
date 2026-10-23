# Prompts: van Sint naar persoon

## Het principe

Een gezicht kan niet geloofwaardig in een ander gezicht overgaan zolang je het ziet; dan krijg je precies de morph of fade die je niet wilt. Daarom wisselt de identiteit op het moment dat het gezicht even niet te zien is: achter de mijter, met de rug naar de camera, achter een hand, of terwijl de baard eroverheen zwiept. Voor de kijker is het dan een handeling, geen effect.

Elke prompt heeft twee delen:

1. **Eerste 3 seconden: spanning.** De Sint doet iets herkenbaars en traags (mijter optillen, buigen, omdraaien, aan de baard plukken). Het gezicht blijft dat van de Sint of is verborgen.
2. **Laatste 2 seconden: onthulling.** Een snelle, fysieke actie (mijter weg, baard eraf, terugdraaien) en het eindframe staat er.

Elke prompt begint en eindigt met dezelfde vaste zinnen: vaste camera, alleen echte handelingen, geen crossfade, dissolve, cut of slide, identiteit verborgen tot 3 seconden, onthulling snel en precies op het eindframe. Kling krijgt daarnaast een negatieve prompt met fade, dissolve, double exposure, morphing face, cut en slide in.

## Varianten

| Id | Naam | Wat er gebeurt |
| --- | --- | --- |
| v1 | Mijter voor het gezicht | Rustig: mijter af en voor het gezicht gehouden, dan snel weg en baard eraf |
| v2 | Baard eraf, lomp en snel | Plagerig aan de baard plukken, dan in een ruk over het gezicht eraf; mijter valt |
| v3 | Omdraaien | Rug naar de camera, mijter en baard af buiten beeld, snel terugdraaien |
| v4 | Diepe buiging | Buiging waarbij de mijter het gezicht afdekt, met een ruk overeind |
| v5 | Voorzichtig losmaken | Mijter netjes weg, baard behoedzaam losgehaakt achter een hand |
| v6 | Schudden | Schudt alsof hij zelf de dobbelbeker is; bij het stoppen vliegen mijter en baard eraf |

De volledige Engelse teksten staan in `prompts/varianten.json`. Engels werkt bij beide modellen beter dan Nederlands.

## Invulvelden

- `{person}`: korte omschrijving van wat in het eindframe zichtbaar is, bijvoorbeeld *"a woman with short grey hair and round glasses, wearing a dark green sweater"*. Leeg = *"the person from the final frame"*. Een omschrijving helpt het model de onthulling te plannen; noem geen namen.
- `{costume}`: draagt de persoon in het eindframe gewone kleren, dan gaan mantel en kleed in dezelfde beweging uit (`"uit"`). Zit de mantel er nog op, dan valt die zin weg (`"aan"`).
- `{t1}` en `{t2}`: 3 en 2 seconden bij een clip van 5 s.

Draagt iemand in het eindframe nog de mijter of de baard, haal die handeling dan uit de prompt van die persoon (eigen tekst in `prompts/personen.json`), anders laat het model hem alsnog verdwijnen.

## Bijsturen na de eerste ronde

- **Onthulling te vroeg:** zet bij Kling `cfg_scale` van 0,5 naar 0,7 en maak de verstopactie langer (mijter langer voor het gezicht, langer met de rug naar de camera).
- **Toch een fade of doorschijnend gezicht:** kies een variant met een volledige afdekking (v1, v3, v4); die zijn het veiligst.
- **Te traag op het eind:** de timing is in het spel ook achteraf te sturen. De 120 fps-master laat je het begin vertragen en de onthulling versnellen zonder haperingen.
- **Eerste frame wijkt af van het stilstaande Sint-beeld:** gebruik in het spel de poster van de video (`posters/<clip>_eerste.png`) als stilstaand beeld; dan sluit de overgang naar de video altijd naadloos aan.
