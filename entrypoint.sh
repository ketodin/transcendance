#!/bin/sh
set -eu

# initialize the database
pnpm run db:push --url "$DATABASE_URL"

exec "$@"
