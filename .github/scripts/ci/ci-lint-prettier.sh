#!/usr/bin/env bash
set -euo pipefail

SCRIPT_NAME="ci-lint-prettier.sh"
source "$(dirname "$0")/../utils/log.sh"

log_group "Running Prettier"
if ! pnpm lint:prettier; then
  log_end
  log_error "Prettier check failed"
  exit 1
fi
log_end
log_info "Prettier check passed"
