#!/usr/bin/env bash
# Zet de werkplezier-tool op de company hosting, zoals sessie 4: één map met
# deelnemers, scherm en regie, die de datamap delen.
#
#   ./deploy.sh                    alles naar de testmap session5-test
#   MAP=session5 ./deploy.sh       alles naar de echte map
#   ./deploy.sh mee.js             alleen dat bestand
#
# Elke upload is een publicatie: alleen na akkoord van Gerke. Iets nieuws eerst
# in de testmap. Let op: DEELNEMER_URL in config.php volgt de map niet vanzelf.
#
# Het FTP-pad is relatief aan de chroot-root. De public_html-root is de live
# Kirby-site; daar blijven we vanaf.
#
# De map data/ gaat NIET mee. Daar staan de antwoorden en de stand van de
# sessie; de code zet die map zelf op slot. start/ gaat wel mee: daaruit wordt
# data/ bij de eerste start gevuld, en ook die map is van buitenaf dicht.
set -euo pipefail

MAP="${MAP:-session5-test}"
set -a; source ~/.config/credentials/thisismakingwaves.env; set +a
BASE="ftp://$FTP_HOST/public_html/$MAP"
cd "$(dirname "$0")"

FILES=(
  .htaccess
  index.php mee.css mee.js
  scherm.php scherm.js
  admin.php admin.css admin.js
  deck.css deck.js
  api.php export.php kern.php analyse.php config.php paden.php
  start/.htaccess start/content.json
  ds/mw.css ds/mw-mark.svg ds/mw-wordmark.svg
  ds/fonts/outfit-latin.woff2 ds/fonts/outfit-latin-ext.woff2
  ds/fonts/geistmono-latin.woff2 ds/fonts/geistmono-latin-ext.woff2
  ds/fonts/hanken-latin.woff2 ds/fonts/hanken-latin-ext.woff2
  ds/fonts/elza-medium.otf
)
# Alleen wat meegegeven wordt, als er argumenten zijn.
[ $# -gt 0 ] && FILES=("$@")

echo "naar /public_html/$MAP/"
for f in "${FILES[@]}"; do
  case "$f" in data/*) echo "  overgeslagen (data gaat nooit mee): $f"; continue;; esac
  [ -f "$f" ] || { echo "  overgeslagen (bestaat niet): $f"; continue; }
  if curl -sS --ftp-create-dirs -T "$f" "$BASE/$f" \
       --user "$FTP_USER:$FTP_PASS" --connect-timeout 25; then
    echo "  up: $f"
  else
    echo "  MISLUKT: $f" >&2
  fi
done

echo
echo "deelnemers → https://thisismakingwaves.com/$MAP/"
echo "scherm     → https://thisismakingwaves.com/$MAP/scherm.php"
echo "regie      → https://thisismakingwaves.com/$MAP/admin.php"
