# ADR-006 — Use Colyseus for Real-Time Multiplayer

| Field   | Value                          |
| ------- | ------------------------------ |
| Date    | 2026-05-13                     |
| Status  | Accepted                       |
| Authors | @amidigov, @42Timeo, @jaubry-- |

## Context

Commit `8e328b2` plugged Colyseus into the project as a separate process running on port 2567, with its own `server/` folder (`server/index.cts`, `server/rooms/TankRoom.cts`), its own build pipeline (`tsconfig.server.json`), and launched alongside SvelteKit via `concurrently`.

A subsequent refactor unified the architecture: the `server/` folder was removed and all Colyseus code moved into `src/lib/game/colyseus/`. Colyseus now runs inside the same Node.js process as SvelteKit, served on the same port (3000), bundled by Vite in development and via a shared Express + HTTP server (`server.ts`) in production. The package was upgraded from `colyseus@0.15` to `colyseus@0.17` and `@colyseus/schema@2` to `@colyseus/schema@4`.

## Decision

We decided to use Colyseus as the real-time multiplayer server layer, integrated into the SvelteKit process rather than run as a separate service.

## Options Considered

- **Colyseus (chosen)** — room model, state sync, game-oriented abstractions.
- Custom WebSocket server — more control, but more networking work.
- Polling or REST-only updates — simpler backend, but poor fit for real-time play.

## Consequences

**Positive**

- The project gained a dedicated room/server model for multiplayer state.
- State synchronization concerns were separated from browser rendering code.
- Single-process, single-port architecture simplifies deployment: one `Dockerfile`, one port (3000), one `pnpm start`.
- No separate build pipeline or `concurrently` orchestration needed.

**Accepted compromises**

- Multiplayer code must align with Colyseus schemas and lifecycle patterns.
- A custom Vite plugin (`colyseus-dev-server`) is required to attach Colyseus to Vite's HTTP server in dev mode and correctly route WebSocket upgrade events (HMR vs. Colyseus traffic).
- Decorator support (`experimentalDecorators: true`, `useDefineForClassFields: false`) must be enabled in the root `tsconfig.json`.

## Links

| Type   | Reference                                                                                           |
| ------ | --------------------------------------------------------------------------------------------------- |
| Commit | `8e328b2 task(game): plug colysseus`                                                                |
| Docs   | `src/lib/game/colyseus/TankRoom.ts`, `src/lib/game/colyseus/schema/`, `server.ts`, `vite.config.ts` |
