#!/usr/bin/env bash
# Deploy the SPIN prototype to gerkedegroot.duckdns.org/spin-app/
#
# Runs from your Mac. Needs the VPS SSH key loaded in your agent:
#   ssh-add ~/Developer/vps/hi
#
# See docs/deploy.md for the longer explanation and the project memory
# in CLAUDE.md for branch conventions.

set -euo pipefail

VPS_HOST="root@89.167.125.42"
VPS_PATH="/var/www/dashboard/spin-app"
URL="https://gerkedegroot.duckdns.org/spin-app/"

cd "$(dirname "$0")/.."

if ! ssh-add -l >/dev/null 2>&1; then
  echo "No keys loaded in ssh-agent — run: ssh-add ~/Developer/vps/hi" >&2
  exit 1
fi

echo "→ Building (static export)…"
pnpm install --frozen-lockfile
pnpm build

echo "→ Ensuring remote path exists…"
ssh "$VPS_HOST" "mkdir -p $VPS_PATH"

echo "→ Syncing out/ to $VPS_HOST:$VPS_PATH/"
rsync -avz --delete \
  --exclude='.DS_Store' \
  out/ "$VPS_HOST:$VPS_PATH/"

echo "→ Done. Live at: $URL"
