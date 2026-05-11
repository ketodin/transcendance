#!/usr/bin/env bash
set -euo pipefail

SCRIPT_NAME="ci-lint-eslint.sh"
source "$(dirname "$0")/../utils/log.sh"

log_group "Running ESLint"
if ! pnpm lint:eslint; then
  log_end
  log_error "ESLint check failed"
  exit 1
fi
log_end
log_info "ESLint check passed"
