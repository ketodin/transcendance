#!/usr/bin/env bash
set -euo pipefail

SCRIPT_NAME="ci-typecheck.sh"
source "$(dirname "$0")/../utils/log.sh"

log_group "Running typecheck"
if ! pnpm typecheck; then
  log_end
  log_error "Typecheck failed"
  exit 1
fi
log_end
log_info "Typecheck passed"
