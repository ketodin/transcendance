#!/bin/sh
set -eu

# initialize the database
pnpm run db:push --url "$DATABASE_URL"

# store avatar in $AVATAR_DIR
rm -rf ./static/uploads && mkdir -p "$AVATAR_DIR"
ln -sn "$AVATAR_DIR" ./static/uploads

exec "$@"
