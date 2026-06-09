#!/usr/bin/env bash

read -rsp "Enter your Google Client Secret: " GOOGLE_CLIENT_SECRET
echo

BETTER_AUTH_SECRET=$(openssl rand -base64 32)
WEBSITE=https://$(hostname):4443

cat > .env.docker <<EOF
BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
ORIGIN=${WEBSITE}
BETTER_AUTH_URL=${WEBSITE}
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
EOF
