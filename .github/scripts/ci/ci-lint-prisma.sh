#!/usr/bin/env bash
set -euo pipefail

SCRIPT_NAME="ci-lint-prisma.sh"
source "$(dirname "$0")/../utils/log.sh"

log_group "Running Prisma format check"
if ! pnpm lint:prisma; then
  log_end
  log_error "Prisma schema is not formatted — run pnpm format to fix"
  exit 1
fi
log_end
log_info "Prisma format check passed"
