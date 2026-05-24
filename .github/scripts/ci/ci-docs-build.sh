#!/usr/bin/env bash
set -euo pipefail

SCRIPT_NAME="ci-docs-build.sh"
source "$(dirname "$0")/../utils/log.sh"

log_group "Building Docusaurus"
if ! pnpm docs:build; then
  log_end
  log_error "Docusaurus build failed"
  exit 1
fi
log_end
log_info "Docusaurus build succeeded"
