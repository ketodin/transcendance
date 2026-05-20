# ADR-006 — Use Colyseus for Real-Time Multiplayer

| Field   | Value                          |
| ------- | ------------------------------ |
| Date    | 2026-05-13                     |
| Status  | Accepted                       |
| Authors | @amidigov, @42Timeo, @jaubry-- |

## Context

Commit `8e328b2` plugged Colyseus into the project and describes the first implementation of Colyseus, later making it work while restructuring server code and build setup.
The current repository contains `server/index.cts`, `server/rooms/TankRoom.cts`, `@colyseus/sdk`, `colyseus`, and Colyseus schema files under `src/lib/game/colyseus/schema/`.

## Decision

We decided to use Colyseus as the real-time multiplayer server layer.

## Options Considered

- **Colyseus (chosen)** — room model, state sync, game-oriented abstractions.
- Custom WebSocket server — more control, but more networking work.
- Polling or REST-only updates — simpler backend, but poor fit for real-time play.

## Consequences

**Positive**

- The project gained a dedicated room/server model for multiplayer state.
- State synchronization concerns were separated from browser rendering code.

**Accepted compromises**

- Server runtime and build configuration became more complex.
- Multiplayer code had to align with Colyseus schemas and lifecycle patterns.

## Links

| Type   | Reference                                                                        |
| ------ | -------------------------------------------------------------------------------- |
| Commit | `8e328b2 task(game): plug colysseus`                                             |
| Docs   | `server/index.cts`, `server/rooms/TankRoom.cts`, `src/lib/game/colyseus/schema/` |
