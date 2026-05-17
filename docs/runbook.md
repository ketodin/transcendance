# Runbook

> **What this is:** Step-by-step commands to start, operate, and recover the stack.
> **What this is not:** Conventions, policies, architecture, or explanations of why things work the way they do — see [`engineering-guidelines.md`](./engineering-guidelines.md).

---

## Table of Contents

1. [Bootstrap — First Time Only](#1-bootstrap--first-time-only)
2. [Daily Start / Stop](#2-daily-start--stop)
3. [Database Operations](#3-database-operations)
4. [CI Failure Diagnosis](#4-ci-failure-diagnosis)
5. [Reverting a Bad Merge](#5-reverting-a-bad-merge)
6. [Automation Debug](#6-automation-debug)
7. [Log Access](#7-log-access)
8. [Full Local Reset](#8-full-local-reset)

---

## 1. Bootstrap — First Time Only

```bash
git clone <repo-url> && cd ft-transcendence

pnpm install

cp .env.example .env
# Open .env and fill in all values before continuing

pnpm generate          # Prisma client + Paraglide i18n
pnpm db:push           # create dev.db from schema

pnpm dev:all           # or: docker compose up --build
```

---

## 2. Daily Start / Stop

### With Docker

```bash
docker compose up --build   # first run, or after Dockerfile / compose.yaml changes
docker compose up           # subsequent runs (no rebuild)
docker compose down         # stop, keep volumes
docker compose down -v      # stop and wipe volumes (destroys local DB)
```

### Without Docker (dev mode)

```bash
pnpm dev:all        # SvelteKit + game server concurrently
pnpm dev            # SvelteKit only
pnpm dev:server     # game server only
```

---

## 3. Database Operations

```bash
pnpm db:generate    # regenerate Prisma client — run after any schema change or pull
pnpm db:push        # push schema to dev.db without creating a migration file
pnpm db:migrate     # create a versioned migration and apply it
pnpm db:studio      # open Prisma Studio in the browser
```

### Reset a broken or out-of-sync local DB

```bash
# Option A — re-apply all migrations (wipes data)
npx prisma migrate reset

# Option B — delete and recreate from schema
rm prisma/dev.db
pnpm db:push
```

### Apply migrations on a shared / CI environment

```bash
npx prisma migrate deploy
```

---

## 4. CI Failure Diagnosis

Re-run any individual check from **Actions → [workflow name] → Re-run failed jobs**. Every check is independent.

### `ci-lint-prettier`

```bash
pnpm lint:prettier      # see what is wrong
pnpm format             # auto-fix, then commit
```

### `ci-lint-eslint`

```bash
pnpm lint:eslint        # ESLint errors must be fixed manually
```

### `ci-lint-prisma`

```bash
pnpm lint:prisma        # see drift
prisma format           # auto-fix, then commit
```

### `ci-lint-pr-title`

Edit the PR title directly in GitHub. Format: `type(scope): description`.
The workflow re-triggers automatically on PR edit.

### `ci-typecheck-frontend`

```bash
pnpm typecheck          # svelte-check — fix every error and warning
pnpm typecheck:watch    # re-run on file change while working
```

### `ci-typecheck-game-server`

```bash
pnpm --filter game-server check   # tsc --noEmit on the game server
```

### `ci-test-unit`

```bash
pnpm test:unit          # Vitest — output names the exact failing test and file
```

### `ci-test-integration`

```bash
pnpm test:integration   # docker compose up --build + healthcheck poll + assertions
```

Common causes:
- Healthcheck not passing → `docker compose logs <service>`
- Missing CI secret → verify the value exists in Settings → Secrets → Actions
- Schema out of sync → `pnpm db:migrate` locally, commit the migration file

### `ci-test-e2e`

```bash
pnpm test:e2e           # Playwright — requires the full stack to be running
```

### `ci-docker-build`

```bash
docker compose build    # reproduces the check locally
```

Common causes: changed file paths after a refactor, missing `COPY` step, stale base image tag.

---

## 5. Reverting a Bad Merge

```bash
# 1. Find the squash commit SHA
git log --oneline main

# 2. Create a revert branch
git checkout main && git pull origin main
git checkout -b fix/<N>-revert-<slug>

# 3. Revert
git revert <SHA>
git push origin fix/<N>-revert-<slug>
```

Open a PR — title: `fix(scope): revert <original description>`. Goes through normal review and CI.

### If the reverted PR included a DB migration

The revert commit does not undo the migration on any running database.

```bash
# Write a new migration that undoes the schema change
prisma migrate dev --name revert-<original-name>
# Include it in the revert PR

# On any shared environment, apply manually after merge
npx prisma migrate deploy
```

### If main is broken and blocking everyone

Ask the repo Admin to revert the merge commit directly in the GitHub UI (`main` → commit → Revert). Follow up with a post-mortem issue.

---

## 6. Automation Debug

### Labels not applied to an issue

1. Check that all 29 labels exist: Settings → Labels.
2. Edit the issue to re-trigger `automation-label-issue.yaml`.
3. Read the run log: Actions → `automation-label-issue` → job output — it logs the parsed scope value.

### Labels not applied to a PR

1. Edit the PR title to a valid `type(scope): description`.
2. `automation-label-pr.yaml` re-triggers on PR edit automatically.

### Issue status not updating

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Stuck on `todo` after branch created | Branch name missing issue number | Rename: `feat/42-slug`, not `feat/slug` |
| Stuck on `in progress` after PR opened | PR body missing closing keyword | Add `Closes #42` to PR body |
| Stuck on `in review` after merge | Automation run failed | Check Actions → `automation-state-pr` logs |

If all else fails, set the status label manually.

### Automation 403 / permission error

Settings → Actions → General → Workflow permissions must be **Read and write**. If it was downgraded, restore it — `automation-*.yaml` workflows require write access.

---

## 7. Log Access

```bash
docker compose logs -f                  # all services, follow
docker compose logs -f <service>        # one service
docker compose logs --tail=100          # last 100 lines, no follow
docker compose exec <service> sh        # shell into a running container
```

### CI log annotations

Errors and warnings from CI scripts appear in the **Annotations** panel at the bottom of each GitHub Actions job — check there before reading raw step logs. The script name prefixes every line, making it easy to `Ctrl+F`.

---

## 8. Full Local Reset

### Reset code artifacts and DB only

```bash
rm -rf node_modules .svelte-kit build build-server prisma/dev.db
pnpm install
pnpm generate
pnpm db:push
```

### Full Docker reset

```bash
docker compose down -v
docker compose up --build
```

### Nuclear option — wipe all Docker state on the machine

```bash
docker system prune -af --volumes
docker compose up --build
```

> `docker system prune` affects **all** Docker resources on the machine, not just this project.

---

*Last updated: May 2026*
