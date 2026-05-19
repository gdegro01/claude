#!/bin/bash
# SessionStart hook: install dependencies so tests/linters work in web sessions.
# Auto-detects the project type. Add project-specific commands at the bottom.

set -euo pipefail

# Run in async mode so it doesn't block session startup.
# Comment this line out if you depend on installs being finished before the agent starts.
echo '{"async": true, "asyncTimeout": 600000}'

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}"

log() { echo "[session-start] $*" >&2; }

# Only install in remote (Claude Code on the web) sessions by default —
# locally you probably manage your own venv/node_modules.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  log "not a remote session, skipping installs"
  exit 0
fi

# Node / pnpm / yarn / npm
if [ -f package.json ]; then
  if [ -f pnpm-lock.yaml ] && command -v pnpm >/dev/null; then
    log "pnpm install"
    pnpm install --frozen-lockfile || pnpm install
  elif [ -f yarn.lock ] && command -v yarn >/dev/null; then
    log "yarn install"
    yarn install --frozen-lockfile || yarn install
  elif command -v npm >/dev/null; then
    log "npm ci"
    npm ci || npm install
  fi
fi

# Python (uv / poetry / pip)
if [ -f pyproject.toml ]; then
  if command -v uv >/dev/null; then
    log "uv sync"
    uv sync || true
  elif [ -f poetry.lock ] && command -v poetry >/dev/null; then
    log "poetry install"
    poetry install --no-interaction || true
  elif command -v pip >/dev/null; then
    log "pip install -e ."
    pip install -e . || true
  fi
elif [ -f requirements.txt ] && command -v pip >/dev/null; then
  log "pip install -r requirements.txt"
  pip install -r requirements.txt || true
fi

# Rust
if [ -f Cargo.toml ] && command -v cargo >/dev/null; then
  log "cargo fetch"
  cargo fetch || true
fi

# Go
if [ -f go.mod ] && command -v go >/dev/null; then
  log "go mod download"
  go mod download || true
fi

# Project-specific extras — add commands here as the project grows.

log "done"
