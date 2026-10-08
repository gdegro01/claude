"""Controleert alle teksten die deelnemers zien (telefoon en scherm) op
gedachtestreepjes en absolute woorden. Gebruik:
    python3 tekstcontrole.py ../tool            (startinhoud en code)
    python3 tekstcontrole.py ../tool data       (ook data/content.json, met wat de regie toevoegde)
"""
import json, re, sys, pathlib
T = pathlib.Path(sys.argv[1])
WOORDEN = r'nooit|altijd|niemand|iedereen|alles|alle|elk|elke|overal|nergens|never|always|nobody|no one|everyone|everybody|everything|all|every|everywhere'
PATROON = re.compile(r'[–—]|\s-\s|\b(' + WOORDEN + r')\b', re.I)
teksten = []
def json_teksten(pad):
    c = json.loads(pad.read_text())
    out = []
    for cat in c['categorieen']: out += [(f'categorie {cat["id"]} {t}', cat[t]) for t in ('nl', 'en')]
    for a in c['aanpakken']:
        for veld in ('naam', 'uitleg', 'wie', 'opbrengst'): out += [(f'aanpak {a["id"]} {veld} {t}', a[veld][t]) for t in ('nl', 'en')]
    for h in c['hoeken']:
        for veld in ('links', 'rechts'): out += [(f'hoek {h["id"]} {veld} {t}', h[veld][t]) for t in ('nl', 'en')]
    for t in ('nl', 'en'): out.append((f'introregel {t}', c['instellingen']['introregel'][t]))
    return out
def code_teksten(pad, begin, eind):
    s = pad.read_text(); s = s[s.index(begin):s.index(eind, s.index(begin))]
    return [(f'{pad.name}', m) for m in re.findall(r"'((?:[^'\\]|\\.)*)'", s) if ' ' in m]
teksten += json_teksten(T / 'start/content.json')
if len(sys.argv) > 2 and (T / 'data/content.json').exists(): teksten += [('data: ' + k, v) for k, v in json_teksten(T / 'data/content.json')]
teksten += code_teksten(T / 'api.php', 'function scherm_l', '/** De hoek die het scherm toont')
teksten += code_teksten(T / 'mee.js', 'const UI = {', 'const $ =')
fout = [(w, t, m.group(0)) for w, t in teksten for m in [PATROON.search(t)] if m]
for w, t, m in fout: print(f'  "{m.strip()}" in {w}: {t}')
print(f'{len(teksten)} teksten gecontroleerd, {len(fout)} treffers')
