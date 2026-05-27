# ADR-008 — Use Shared `lib/game` Modules Across Client and Server

| Field   | Value                          |
| ------- | ------------------------------ |
| Date    | 2026-05-13                     |
| Status  | Accepted                       |
| Authors | @amidigov, @42Timeo, @jaubry-- |

## Context

The Colyseus integration commit includes a structural cleanup that renamed server-related areas and kept shared game logic as a distinct concern.
The current tree shows a deliberate split between `src/lib/game/client`, `src/lib/game/phaser`, `src/lib/game/colyseus`, and `src/lib/game/shared`. All Colyseus server-side code (room definitions, schemas) lives under `src/lib/game/colyseus/` — there is no separate `server/` folder.

## Decision

We decided to keep game domain code in shared modules under `src/lib/game`, with separate layers for client rendering, Colyseus schemas, and reusable shared state/logic.

## Options Considered

- **Shared `lib/game` split (chosen)** — reuse rules and state definitions across layers.
- Duplicate logic in client and server — simpler boundaries, but high drift risk.
- Keep all game code server-only — authoritative, but harder to prototype rich local behavior.

## Consequences

**Positive**

- Core game concepts such as state, terrain, and physics could live in one place.
- The codebase gained clearer boundaries between rendering, networking, and reusable logic.

**Accepted compromises**

- Shared modules had to stay runtime-compatible across multiple environments.
- Layer boundaries required discipline to avoid accidental coupling.

## Links

| Type   | Reference                                                       |
| ------ | --------------------------------------------------------------- |
| Commit | `8e328b2 task(game): plug colysseus`                            |
| Docs   | `src/lib/game/{client,colyseus,phaser,shared}`                  |
