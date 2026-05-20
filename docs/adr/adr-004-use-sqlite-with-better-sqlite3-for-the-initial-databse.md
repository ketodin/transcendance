# ADR-004 — Use SQLite with better-sqlite3 for the Initial Database

| Field   | Value      |
| ------- | ---------- |
| Date    | 2026-05-07 |
| Status  | Accepted   |
| Authors | @42Timeo   |

## Context

Commit `1b9ccdb` made Prisma work in production by moving `prismaadapter-better-sqlite3` to runtime dependencies.
The current repository contains `data/database.db`, and `package.json` includes `@prisma/adapter-better-sqlite3` plus `@types/better-sqlite3`.

## Decision

We decided to use SQLite, via `better-sqlite3` and the Prisma adapter, as the initial project database.

## Options Considered

- **SQLite + better-sqlite3 (chosen)** — simple setup, local-first workflow, low ops cost.
- PostgreSQL — stronger multi-user scaling, but heavier setup for the early stage.
- In-memory or file-only custom persistence — quick to start, but weak long-term structure.

## Consequences

**Positive**

- Local development stayed simple and fast.
- Deployments could start without provisioning a separate DB service.

**Accepted compromises**

- A later migration to PostgreSQL may still be needed.
- Concurrency and operational scaling are more limited than with a server DB.

## Links

| Type   | Reference                                            |
| ------ | ---------------------------------------------------- |
| Commit | `1b9ccdb fix(chore): make prisma work in production` |
| Docs   | `data/database.db`, `@prisma/adapter-better-sqlite3` |
