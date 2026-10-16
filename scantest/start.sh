#!/bin/bash
# Start de server en maak hem bereikbaar. Stoppen met Ctrl+C.
#   ./start.sh             via Tailscale (alleen apparaten in je tailnet)
#   ./start.sh cloudflare  via een tijdelijke Cloudflare-tunnel (openbaar adres)
# Staat deze map in een git-checkout, dan haalt het script elke minuut nieuwe versies
# van dezelfde branch op (uitzetten met AUTO_UPDATE=0 in .env).
cd "$(dirname "$0")" || exit 1
MODE=${1:-tailscale}
TS_HTTPS_PORT=8443

if [ ! -f .env ]; then
  python3 server.py --setup || exit 1
fi
PORT=$(grep -E '^PORT=' .env | cut -d= -f2)
PORT=${PORT:-8787}

if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Poort $PORT is al in gebruik. Draait Scan Test al, of een ander project?"
  echo "Kies een andere poort met PORT=... in .env"
  exit 1
fi

if [ "$MODE" = "tailscale" ]; then
  TS=$(command -v tailscale || echo /Applications/Tailscale.app/Contents/MacOS/Tailscale)
  if [ ! -x "$TS" ]; then
    echo "Tailscale-commando niet gevonden."
    exit 1
  fi
  HOST=$("$TS" status --json 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin)['Self']['DNSName'].rstrip('.'))" 2>/dev/null)
  if [ -z "$HOST" ]; then
    echo "Tailscale lijkt niet verbonden. Controleer de Tailscale-app."
    exit 1
  fi
elif [ "$MODE" = "cloudflare" ]; then
  if ! command -v cloudflared >/dev/null 2>&1; then
    echo "cloudflared ontbreekt. Installeer het met: brew install cloudflared"
    exit 1
  fi
else
  echo "Onbekende keuze '$MODE'. Gebruik: ./start.sh of ./start.sh cloudflare"
  exit 1
fi

# automatisch bijwerken via git
AUTO_UPDATE=$(grep -E '^AUTO_UPDATE=' .env | cut -d= -f2)
AUTO_UPDATE=${AUTO_UPDATE:-1}
UPDATE_INTERVAL=${UPDATE_INTERVAL:-60}
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
UPDATES=0
if [ "$AUTO_UPDATE" = "1" ] && [ -n "$BRANCH" ] && [ "$BRANCH" != "HEAD" ]; then
  UPDATES=1
fi

start_server() {
  python3 server.py &
  SERVER_PID=$!
}

check_update() {
  git fetch -q origin "$BRANCH" 2>/dev/null || return
  [ "$(git rev-parse HEAD)" = "$(git rev-parse FETCH_HEAD)" ] && return
  local old
  old=$(git rev-parse HEAD)
  if ! git merge -q --ff-only FETCH_HEAD >/dev/null 2>&1; then
    echo "$(date +%H:%M:%S)  Update overgeslagen: er staan lokale wijzigingen in deze map."
    return
  fi
  local changed
  changed=$(git diff --name-only "$old" HEAD)
  echo "$(date +%H:%M:%S)  Bijgewerkt: $(git log -1 --format=%s)"
  if echo "$changed" | grep -q 'server\.py$' || ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "$(date +%H:%M:%S)  Server wordt herstart"
    kill $SERVER_PID 2>/dev/null
    wait $SERVER_PID 2>/dev/null
    start_server
    sleep 1
  fi
  if echo "$changed" | grep -q 'start\.sh$'; then
    echo "$(date +%H:%M:%S)  start.sh is ook gewijzigd: stop met Ctrl+C en start opnieuw om die te gebruiken."
  fi
}

start_server
TUNNEL_PID=""
cleanup() {
  kill $SERVER_PID $TUNNEL_PID 2>/dev/null
  if [ "$MODE" = "tailscale" ]; then
    "$TS" serve --https=$TS_HTTPS_PORT off >/dev/null 2>&1
  fi
}
trap cleanup EXIT
trap 'exit 0' INT TERM
sleep 1
if ! kill -0 $SERVER_PID 2>/dev/null; then
  echo "De server start niet, zie de melding hierboven."
  exit 1
fi

if [ "$MODE" = "tailscale" ]; then
  if ! "$TS" serve --bg --https=$TS_HTTPS_PORT "http://127.0.0.1:$PORT" >/dev/null; then
    echo "tailscale serve lukte niet. Staan MagicDNS en HTTPS Certificates aan in het Tailscale-beheer?"
    exit 1
  fi
  URL="https://$HOST:$TS_HTTPS_PORT"
else
  : > tunnel.log
  cloudflared tunnel --no-autoupdate --url "http://localhost:$PORT" >> tunnel.log 2>&1 &
  TUNNEL_PID=$!
  URL=""
  for _ in $(seq 1 45); do
    kill -0 $TUNNEL_PID 2>/dev/null || break
    URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' tunnel.log | head -1)
    if [ -n "$URL" ] && grep -q "Registered tunnel connection" tunnel.log; then
      break
    fi
    URL=""
    sleep 1
  done
  if [ -z "$URL" ]; then
    echo "De tunnel komt niet tot stand. Laatste regels uit tunnel.log:"
    tail -5 tunnel.log
    exit 1
  fi
fi

echo
echo "=============================================="
echo " Admin (laptop):    $URL/admin"
echo " Scherm (iPad):     $URL/show"
echo " Scanner (telefoon): $URL/scan"
echo " PIN en wachtwoord: cat $(pwd)/.env"
if [ "$UPDATES" = "1" ]; then
  echo " Automatisch bijwerken: aan (branch $BRANCH)"
fi
echo "=============================================="
echo

# Blijf draaien zolang de server (en bij Cloudflare de tunnel) leeft.
TICKS=0
DOWN=0
while true; do
  if ! kill -0 $SERVER_PID 2>/dev/null; then
    if [ "$UPDATES" != "1" ]; then
      echo "De server is gestopt, zie de meldingen hierboven."
      exit 1
    fi
    if [ "$DOWN" = "0" ]; then
      echo "De server is gestopt. Het script wacht op een update die het oplost (of stop met Ctrl+C)."
      DOWN=1
    fi
  else
    DOWN=0
  fi
  if [ -n "$TUNNEL_PID" ] && ! kill -0 $TUNNEL_PID 2>/dev/null; then
    echo "De tunnel is gestopt, zie tunnel.log."
    exit 1
  fi
  sleep 2
  TICKS=$((TICKS + 2))
  if [ "$UPDATES" = "1" ] && [ "$TICKS" -ge "$UPDATE_INTERVAL" ]; then
    TICKS=0
    check_update
  fi
done
