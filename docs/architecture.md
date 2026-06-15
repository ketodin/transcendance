# Architecture Overview

SvelteKit + Colyseus + Prisma monorepo for a multiplayer browser game.

## Stack

| Layer           | Technology                                                      |
| --------------- | --------------------------------------------------------------- |
| Frontend        | SvelteKit 2, Svelte 5 (runes), TailwindCSS 4, shadcn-svelte     |
| Game engine     | Phaser 4                                                        |
| Multiplayer     | Colyseus 0.17 (authoritative server, in-process with SvelteKit) |
| Auth            | Better-Auth                                                     |
| Database        | Prisma 7 + SQLite (better-sqlite3)                              |
| i18n            | Paraglide JS                                                    |
| Package manager | pnpm 11.4.0                                                     |
| Runtime         | Node 24.15.0                                                    |

## Process Model

Colyseus runs inside the same Node.js process as SvelteKit — **not** as a separate service.

- **Development:** custom Vite plugin (`colyseus-dev-server`) attaches Colyseus to Vite's HTTP server, correctly routing WebSocket upgrade events (HMR vs. Colyseus traffic)
- **Production:** `index.ts` creates a single Express + HTTP server shared by SvelteKit and Colyseus via `WebSocketTransport`
- **Port:** 3000 for both. No separate process, no port 2567.

## Docker Stack

`compose.yaml` defines two services:

| Service       | Role                               | Port            |
| ------------- | ---------------------------------- | --------------- |
| transcendance | SvelteKit + Colyseus app           | 3000 (internal) |
| caddy         | Reverse proxy with TLS termination | 4443 (external) |

Caddy handles TLS certificate provisioning. Clients connect to `https://<host>:4443`.

The app container runs `entrypoint.sh` on startup: it pushes the Prisma schema to the database and symlinks the avatar directory to `static/uploads/`. The database file and avatar storage are persisted via a Docker volume at `./data/`.

## Hook Chain

`src/hooks.server.ts` sequences four hooks in this order:

```
handleColyseus → handleParaglide → handleBetterAuth → handleRouteProtection
```

1. **handleColyseus** — registers Colyseus room types (`tank_room`, `status`) via `matchMaker.defineRoomType`. Uses `globalThis.gameServer` to prevent double-initialization across HMR reloads.
2. **handleParaglide** — determines locale from the request, injects `%paraglide.lang%` and `%paraglide.dir%` placeholders into the HTML shell.
3. **handleBetterAuth** — attaches the user session to `event.locals` via Better-Auth. On API auth routes, hands off to the Better-Auth SvelteKit handler.
4. **handleRouteProtection** — redirects unauthenticated users away from protected routes (everything except `/login`, `/register`, and `favicon.png`).

## Game Server

All Colyseus code under `src/lib/game/colyseus/`:

```
src/lib/game/colyseus/
├── TankRoom.ts              # Main game room — tank combat
├── StatusRoom.ts            # Online presence tracking room
├── statusHub.ts             # Status broadcast utility
├── messageSchemas.ts        # Zod schemas for all Colyseus messages
├── validateMessage.ts       # Message validation dispatch
├── handlers/
│   └── chatHandler.ts       # In-game chat message handling
└── schema/
    ├── GameRoomState.ts     # Top-level room state
    ├── StatusRoomState.ts   # Online status state
    ├── TankSchema.ts        # Tank entity schema
    ├── TerrainSchema.ts     # Terrain entity schema
    └── ProjectileSchema.ts  # Projectile entity schema
```

### Phaser Client

Client-side game rendering under `src/lib/game/`:

```
src/lib/game/
├── client/view/             # Client-side Phaser objects
│   ├── ChatInput.ts         # In-game chat input
│   ├── ProjectileView.ts    # Projectile rendering
│   ├── speechBubble.ts      # Chat bubble rendering
│   ├── TankSprite.ts        # Tank rendering
│   └── TerrainView.ts       # Terrain rendering
├── phaser/
│   ├── game.ts              # Phaser game factory
│   ├── lobbyGame.ts         # Lobby scene
│   ├── EventBus.ts          # Phaser ↔ Svelte event bridge
│   ├── colors.ts            # Theme-synced color constants
│   ├── commonGameConfig.ts  # Shared Phaser config
│   └── scenes/
│       ├── demoScene.ts     # Demo/title scene
│       └── gameScene/       # Main gameplay scene (split into focused modules)
│           ├── GameScene.ts
│           ├── buttons.ts
│           ├── effects.ts
│           ├── hud.ts
│           ├── server.ts
│           ├── setup.ts
│           ├── types.ts
│           └── weaponUI.ts
└── shared/                  # Shared logic across client and server
    ├── state/               # State definitions (GameState, TankState, ProjectileState, TerrainState)
    ├── logic/               # Game rules (physics, terrain)
    ├── chatConfig.ts        # Chat constants
    └── projectileTypes.ts   # Projectile type definitions
```

### Rooms

Two Colyseus room types are registered in `hooks.server.ts`:

| Room type   | Class        | Purpose                                        |
| ----------- | ------------ | ---------------------------------------------- |
| `tank_room` | `TankRoom`   | Main game room — tank combat, chat, state sync |
| `status`    | `StatusRoom` | Online presence tracking for friend list       |

Room types are defined once via `globalThis.gameServer` guard to survive HMR reloads.

## Scope Map

| Scope      | Covers                                                                 |
| ---------- | ---------------------------------------------------------------------- |
| `frontend` | SvelteKit routes, Svelte components, shadcn-svelte, Vite config        |
| `backend`  | Server-side services, API routes, hooks.server.ts                      |
| `auth`     | OAuth 42, Google OAuth, JWT, TOTP, session injection                   |
| `game`     | Phaser engine, Colyseus rooms, schemas, game logic                     |
| `db`       | Prisma schema, migrations, database client, queries                    |
| `shared`   | Code in `src/lib/game/shared/` used by both client and Colyseus server |
| `infra`    | Docker, compose.yaml, Caddy, deployment, .github                       |
| `i18n`     | Paraglide translations, messages.json                                  |

`auth` is intentionally separate from `backend`: auth issues are security-sensitive, span the frontend/backend boundary, and require a distinct resolution path.

## CI/CD

6 required status checks on `main`:

| Check                      | What it runs                                                              |
| -------------------------- | ------------------------------------------------------------------------- |
| `ci-lint-eslint`           | `pnpm lint:eslint`                                                        |
| `ci-lint-prettier`         | `pnpm lint:prettier`                                                      |
| `ci-lint-prisma`           | `prisma format --check`                                                   |
| `ci-typecheck-game-server` | `pnpm typecheck` (svelte-check + tsc --noEmit, unified)                   |
| `ci-docker-build`          | Build Dockerfile via `compose.yaml` (no push)                             |
| `ci-docs-deploy`           | Docusaurus deploy to GitHub Pages (main only, on docs/docusaurus changes) |

Squash-merge only. All checks must pass. 1 required approval minimum.

4 automation workflows manage labels (`automation-label-issue`, `automation-label-pr`) and issue status (`automation-state-branch`, `automation-state-pr`).

See [engineering-guidelines.md](engineering-guidelines.md) for the full workflow specification. See `adr/` for the 9 Architecture Decision Records.
