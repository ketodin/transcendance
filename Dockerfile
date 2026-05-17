FROM node:24.15.0-alpine3.23 AS build

WORKDIR /app
RUN corepack enable && corepack prepare pnpm --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run generate && pnpm run build

# ---

FROM node:24.15.0-alpine3.23

ENV NODE_ENV=production
WORKDIR /app
RUN corepack enable && corepack prepare pnpm --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=build /app/build/ ./build/
COPY ./prisma/ ./prisma/
COPY ./entrypoint.sh ./

EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "build"]
