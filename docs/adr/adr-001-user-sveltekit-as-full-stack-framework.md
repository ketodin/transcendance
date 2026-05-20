# ADR-001 — Use SvelteKit as Full-Stack Framework

| Field   | Value      |
| ------- | ---------- |
| Date    | 2026-04-27 |
| Status  | Accepted   |
| Authors | @42Timeo   |

## Context

The project was initialized with SvelteKit in commit `8032c9b`, which explicitly states “initialize the sveltekit project.”
The current repository structure still reflects that choice through `src/routes`, `src/lib`, `svelte.config.js`, and `vite.config.ts`.

## Decision

We decided to use SvelteKit as the full-stack framework for the application.

## Options Considered

- **SvelteKit (chosen)** — unified frontend and server routing, good TypeScript integration, easy SSR and form handling.
- Separate frontend and backend apps — clearer separation, but more setup and more coordination overhead.
- Plain Vite SPA — simpler frontend setup, but less built-in server and routing support.

## Consequences

**Positive**

- One codebase could host UI, routes, server hooks, and shared libraries.
- The team could move quickly with conventions already provided by the framework.

**Accepted compromises**

- Framework conventions shaped file layout and routing patterns.
- Some server concerns still needed custom handling outside default SvelteKit patterns.

## Links

| Type   | Reference                                                     |
| ------ | ------------------------------------------------------------- |
| Commit | `8032c9b chore(core): initialize the sveltekit project`       |
| Docs   | `src/routes`, `src/lib`, `svelte.config.js`, `vite.config.ts` |
