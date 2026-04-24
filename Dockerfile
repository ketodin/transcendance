FROM node:24.15.0-alpine3.23 AS build

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# ---

FROM node:24.15.0-alpine3.23

ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/build ./build

EXPOSE 3000
CMD ["node", "build"]

