# ADR-003 — Use Prisma as the ORM

| Field   | Value                         |
| ------- | ----------------------------- |
| Date    | 2026-05-06                    |
| Status  | Accepted                      |
| Authors | @42Timeo, @ketodin, @jaubry-- |

## Context

Commit `c06db73` added Prisma ORM, database connection logic, Prisma schema handling, and database scripts.
The repository currently includes `prisma/schema.prisma`, Prisma commands in `package.json`, and a dedicated `src/lib/server/db.ts` location for database access.

## Decision

We decided to use Prisma as the ORM and schema management layer for persistence.

## Options Considered

- **Prisma (chosen)** — typed client, schema-driven workflow, strong tooling.
- Raw SQL — maximum control, but more boilerplate and less consistency.
- Lighter query builders — simpler runtime surface, but fewer integrated workflows.

## Consequences

**Positive**

- Schema, client generation, and DB commands became standardized.
- Form and auth features could build on one shared data access layer.

**Accepted compromises**

- Code generation became part of the workflow.
- Prisma-specific runtime and deployment concerns had to be handled explicitly.

## Links

| Type   | Reference                                                      |
| ------ | -------------------------------------------------------------- |
| Commit | `c06db73 feat(db): add prisma orm`                             |
| Docs   | `prisma/schema.prisma`, `db:push`, `db:generate`, `db:migrate` |
