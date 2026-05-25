# ADR-009 — Use Docker and Compose for Deployment

| Field   | Value      |
| ------- | ---------- |
| Date    | 2026-05-17 |
| Status  | Accepted   |
| Authors | @ketodin   |

## Context

Commit `94b99fe` added a Dockerfile, entrypoint, Compose file, env example updates, and deployment-related auth fixes.
The current tree contains `Dockerfile`, `compose.yaml`, and `entrypoint.sh`.

## Decision

We decided to package and run the application with Docker and Docker Compose.

## Options Considered

- **Docker + Compose (chosen)** — reproducible local and deployment setup.
- Host-native deployment — less container overhead, but more machine drift.
- Separate per-service manual scripts — possible, but harder to standardize.

## Consequences

**Positive**

- The application gained a clearer deployment path.
- Runtime setup for app, env, and startup steps became explicit artifacts in the repo.

**Accepted compromises**

- Container startup and dependency packaging added operational complexity.
- Auth and database runtime behavior had to be validated inside the containerized environment.

## Links

| Type   | Reference                                     |
| ------ | --------------------------------------------- |
| Commit | `94b99fe chore(infra): add docker compose`    |
| Docs   | `Dockerfile`, `compose.yaml`, `entrypoint.sh` |
