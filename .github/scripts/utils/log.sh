#!/usr/bin/env bash
# Logging utilities for CI scripts.
# Usage: set SCRIPT_NAME before sourcing this file.
#
#   SCRIPT_NAME="ci-lint-eslint"
#   source "$(dirname "$0")/../utils/log.sh"

log_info()  { echo "::notice:: [${SCRIPT_NAME}] $*"; }
log_warn()  { echo "::warning:: [${SCRIPT_NAME}] $*"; }
log_error() { echo "::error:: [${SCRIPT_NAME}] $*"; }
log_group() { echo "::group:: [${SCRIPT_NAME}] $*"; }
log_end()   { echo "::endgroup::"; }
