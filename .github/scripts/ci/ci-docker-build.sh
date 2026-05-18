#!/usr/bin/env bash
set -euo pipefail

SCRIPT_NAME="ci-docker-build.sh"
source "$(dirname "$0")/../utils/log.sh"

IMAGE_NAME="${IMAGE_NAME:-transcendence:ci-${GITHUB_SHA:-local}}"

cleanup() {
	rm -f .env.prod
}
trap cleanup EXIT

log_group "Preparing Docker inputs"
mkdir -p data
cat > .env.prod <<'EOF'
BETTER_AUTH_SECRET=ci-not-for-production-secret-please-change
ORIGIN=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000
EOF
log_end

log_group "Validating compose configuration"
docker compose -f compose.yaml config >/dev/null
log_end

log_group "Building Docker image"
docker buildx build \
	--pull \
	--load \
	--tag "${IMAGE_NAME}" \
	.
docker image inspect "${IMAGE_NAME}" >/dev/null
log_end

log_info "Docker build checks passed"
