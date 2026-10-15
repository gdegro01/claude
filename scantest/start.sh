#!/bin/bash
# Start de server en een Cloudflare-tunnel. Stoppen met Ctrl+C.
cd "$(dirname "$0")" || exit 1

if [ ! -f .env ]; then
  python3 server.py --setup || exit 1
fi
if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared ontbreekt. Installeer het met: brew install cloudflared"
  exit 1
fi
PORT=$(grep -E '^PORT=' .env | cut -d= -f2)
PORT=${PORT:-8787}

python3 server.py &
SERVER_PID=$!
TUNNEL_PID=""
trap 'kill $SERVER_PID $TUNNEL_PID 2>/dev/null' EXIT INT TERM
sleep 1
if ! kill -0 $SERVER_PID 2>/dev/null; then
  echo "De server start niet, zie de melding hierboven."
  exit 1
fi

: > tunnel.log
cloudflared tunnel --no-autoupdate --url "http://localhost:$PORT" >> tunnel.log 2>&1 &
TUNNEL_PID=$!

# Wacht tot de tunnel echt verbonden is, niet alleen tot er een adres is.
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

echo
echo "=============================================="
echo " Scanner:  $URL/scan"
echo " Admin:    $URL/admin"
echo " PIN en wachtwoord: cat .env"
echo "=============================================="
echo

# Blijf draaien zolang server en tunnel allebei leven.
while kill -0 $SERVER_PID 2>/dev/null && kill -0 $TUNNEL_PID 2>/dev/null; do
  sleep 5
done
echo "Server of tunnel is gestopt. Zie de meldingen hierboven en tunnel.log."
exit 1
