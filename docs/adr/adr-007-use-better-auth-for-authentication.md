# ADR-007 — Use Better-Auth for Authentication

| Field   | Value                                              |
| ------- | -------------------------------------------------- |
| Date    | 2026-05-13                                         |
| Status  | Accepted                                           |
| Authors | @Rev0li, @okientzl, @pabellis, @42Timeo, @jaubry-- |

## Context

Commit `1660e56` added Better-Auth dependencies, auth server files, middleware, login/register routes, and schema changes.
The current project includes `src/lib/server/auth.ts`, `src/lib/auth-client.ts`, `hooks.server.ts`, and Better-Auth dependencies in `package.json`.

## Decision

We decided to use Better-Auth for authentication across browser and server flows.

## Options Considered

- **Better-Auth (chosen)** — integrated auth flows, adapter support, browser/server split.
- Custom auth implementation — flexible, but more security risk and more maintenance.
- Another auth library — possible, but not the path reflected in the codebase.

## Consequences

**Positive**

- Auth concerns gained a dedicated server module and client helper.
- Login and register routes could be implemented quickly on top of the chosen stack.

**Accepted compromises**

- Runtime initialization and env handling required care, especially for deployment.
- Database schema and auth flow were now coupled to the auth library.

## Links

| Type   | Reference                                                             |
| ------ | --------------------------------------------------------------------- |
| Commit | `1660e56 feat(auth): add basics of authentication`                    |
| Docs   | `src/lib/server/auth.ts`, `src/lib/auth-client.ts`, `hooks.server.ts` |
