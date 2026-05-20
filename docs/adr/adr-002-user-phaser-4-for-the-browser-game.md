# ADR-002 — Use Phaser 4 for the Browser Game

| Field   | Value               |
| ------- | ------------------- |
| Date    | 2026-04-28          |
| Status  | Accepted            |
| Authors | @amidigov, @42Timeo |

## Context

Commit `d64d824` introduced “game using phaser4 inside sveltekit” and describes adding Phaser with a working local game.
The current tree still contains a dedicated Phaser layer under `src/lib/game/phaser/` with scenes, objects, and game bootstrap files.

## Decision

We decided to use Phaser 4 as the in-browser rendering and gameplay engine.

## Options Considered

- **Phaser 4 (chosen)** — mature game-loop model, scene system, browser-focused tooling.
- Custom Canvas/WebGL engine — more control, but much more low-level work.
- DOM-based game UI — easier for menus, but weak for real-time gameplay.

## Consequences

**Positive**

- The team gained a clear scene-based structure for client gameplay.
- Rendering concerns stayed separate from route and UI concerns.

**Accepted compromises**

- Game code followed engine-specific patterns.
- Integrating Phaser state with app state required extra coordination.

## Links

| Type   | Reference                                                           |
| ------ | ------------------------------------------------------------------- |
| Commit | `d64d824 feat(game): implement game using phaser4 inside sveltekit` |
| Docs   | `src/lib/game/phaser/`                                              |
