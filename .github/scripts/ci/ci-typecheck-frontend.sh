#!/usr/bin/env bash
set -euo pipefail

SCRIPT_NAME="ci-typecheck-frontend.sh"
source "$(dirname "$0")/../utils/log.sh"

log_group "Running frontend typecheck"
if ! pnpm typecheck; then
  log_end
  log_error "Frontend typecheck failed"
  exit 1
fi
log_end
log_info "Frontend typecheck passed"
