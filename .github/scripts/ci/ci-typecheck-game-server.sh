#!/usr/bin/env bash
set -euo pipefail

SCRIPT_NAME="ci-typecheck-game-server.sh"
source "$(dirname "$0")/../utils/log.sh"

if ! pnpm ls --filter game-server &>/dev/null; then
  log_warn "game-server package not found in workspace — skipping typecheck"
  exit 0
fi

log_group "Running game-server typecheck"
if ! pnpm --filter game-server check; then
  log_end
  log_error "Game-server typecheck failed"
  exit 1
fi
log_end
log_info "Game-server typecheck passed"

# Works as a stubs for when game server is big enough and standalone to require precise typecheck
