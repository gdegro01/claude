#!/bin/bash
# Start de server en maak hem bereikbaar. Stoppen met Ctrl+C.
#   ./start.sh             via Tailscale (alleen apparaten in je tailnet)
#   ./start.sh cloudflare  via een tijdelijke Cloudflare-tunnel (openbaar adres)
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

python3 server.py &
SERVER_PID=$!
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
echo "=============================================="
echo

# Blijf draaien zolang de server (en bij Cloudflare de tunnel) leeft.
while kill -0 $SERVER_PID 2>/dev/null; do
  if [ -n "$TUNNEL_PID" ] && ! kill -0 $TUNNEL_PID 2>/dev/null; then
    echo "De tunnel is gestopt, zie tunnel.log."
    exit 1
  fi
  sleep 2
done
echo "De server is gestopt, zie de meldingen hierboven."
exit 1
