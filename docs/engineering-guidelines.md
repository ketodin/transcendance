# Engineering Guidelines

> This document defines the standards, conventions, and processes every contributor must follow in this repository. It covers code quality, Git workflow, CI/CD, testing, security, and documentation. Keeping these guidelines consistent is what allows the team to move fast without breaking things.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Code Style & Standards](#2-code-style--standards)
3. [Architecture & Design Principles](#3-architecture--design-principles)
4. [Git & Branching Strategy](#4-git--branching-strategy)
5. [Code Review Standards](#5-code-review-standards)
6. [Testing Requirements](#6-testing-requirements)
7. [CI/CD & Deployment](#7-cicd--deployment)
8. [Security Guidelines](#8-security-guidelines)
9. [Documentation Standards](#9-documentation-standards)
10. [Tooling & Environment Setup](#10-tooling--environment-setup)

---

## 1. Overview

This is a SvelteKit + Colyseus + Prisma monorepo (`ft-transcendence`). The stack includes:

- **Frontend:** SvelteKit 2 · Svelte 5 (runes mode) · TailwindCSS 4 · shadcn-svelte
- **Backend:** Express 5 · Colyseus 0.17 (game server, bundled into SvelteKit via Vite) · Better-Auth
- **Database:** Prisma 7 + SQLite (better-sqlite3)
- **i18n:** Paraglide JS
- **Package manager:** `pnpm 10.33.0`
- **Runtime:** Node 24

> **Architecture note:** Colyseus runs inside the same Node.js process as SvelteKit — not as a separate service. In development, a custom Vite plugin (`colyseus-dev-server`) attaches Colyseus to Vite's HTTP server. In production, `server.ts` creates a single Express + HTTP server shared by SvelteKit and Colyseus (`WebSocketTransport`). Both use **port 3000**. There is no separate game-server process, no port 2567, and no `devserver` / `devall` scripts.

**Non-negotiable rules:**

- No direct push to `main`. Every change goes through a branch and a Pull Request.
- `main` must always be deployable and in a clean state.
- No merge if CI is red.
- No unformatted, un-linted, or untested code merged into `main`.
- No secrets committed. Sensitive variables belong in `.env`; a `.env.example` must be maintained.
- Every important decision must be written down — not kept in someone's head or only on Discord.

---

## 2. Code Style & Standards

### 2.1 Universal Rules

- One function does one thing.
- Names must be explicit and descriptive.
- Avoid single-letter variables outside trivial loops.
- No needless duplication.
- No business logic hidden inside UI components.
- No magic numbers — use named constants.
- Every expected error must be handled explicitly.
- All user input must be validated on both the frontend and backend.

### 2.2 TypeScript

TypeScript strict mode is enabled. Key `tsconfig.json` flags:

```json
{
	"compilerOptions": {
		"strict": true,
		"allowJs": true,
		"checkJs": true,
		"moduleResolution": "bundler",
		"rewriteRelativeImportExtensions": true,
		"forceConsistentCasingInFileNames": true,
		"resolveJsonModule": true,
		"esModuleInterop": true,
		"experimentalDecorators": true,
		"useDefineForClassFields": false
	}
}
```

- No `any` unless explicitly justified and scoped.
- `no-undef` ESLint rule is disabled for TypeScript files (TypeScript handles this natively).
- `experimentalDecorators: true` and `useDefineForClassFields: false` are required for Colyseus `@type` schema decorators — they live in the root `tsconfig.json`. There is no separate `tsconfig.server.json`.

### 2.3 Svelte

- Svelte 5 **runes mode** is enforced for all project files (not `node_modules`).

```js
// svelte.config.js
compilerOptions: {
	runes: ({ filename }) => (filename.split('/').includes('node_modules') ? undefined : true);
}
```

- No top-level browser globals in `.svelte` files (`svelte/no-top-level-browser-globals`).
- `<script lang="ts">` is mandatory in all `.svelte` files (`svelte/block-lang`).

### 2.4 Prettier

Configuration (`.prettierrc`):

```json
{
	"useTabs": true,
	"singleQuote": true,
	"trailingComma": "none",
	"printWidth": 100,
	"plugins": ["prettier-plugin-svelte", "prettier-plugin-tailwindcss"],
	"overrides": [
		{
			"files": "*.svelte",
			"options": {
				"parser": "svelte",
				"svelteStrictMode": true,
				"svelteAllowShorthand": true,
				"svelteIndentScriptAndStyle": true
			}
		}
	]
}
```

Run the formatter:

```bash
pnpm format   # prettier --write . && prisma format
```

### 2.5 ESLint

The ESLint config extends `js.configs.recommended`, `ts.configs.recommendedTypeChecked`, `svelte.configs.recommended`, and `eslint-config-prettier`. Ignored paths include `.github/`, `src/lib/components/ui/`, `src/lib/paraglide/`, and `*.config.{js,ts}`.

Run the linter:

```bash
pnpm lint:eslint   # eslint .
```

### 2.6 Prisma

Schema lives at `prisma/schema.prisma`. The datasource URL defaults to `file:./dev.db` (SQLite), overridable via `DATABASE_URL` env var.

```bash
pnpm lint:prisma   # prisma format --check
pnpm db:generate   # prisma generate
pnpm db:push       # prisma db push
pnpm db:migrate    # prisma migrate
pnpm db:studio     # prisma studio
```

### 2.7 What Is Forbidden

- Linter warnings in `main`.
- `TODO` comments not tracked as GitHub issues.
- Dead code merged into `main`.
- Comments that restate the code (comments explain _why_, not _what_).

---

## 3. Architecture & Design Principles

### 3.1 Layered Separation

- Clearly separate UI, business logic, data access, and external integrations.
- No circular imports.
- A shared vocabulary for domain concepts — no four different names for the same thing.

### 3.2 Scope Map

| Scope      | What it covers                                                      |
| ---------- | ------------------------------------------------------------------- |
| `frontend` | SvelteKit routes, Svelte components, shadcn-svelte, Vite config     |
| `backend`  | Server-side services, API routes, `hooks.server.ts`                 |
| `auth`     | OAuth 42, JWT, TOTP, session injection                              |
| `game`     | Phaser engine, Colyseus rooms, schemas, game logic                  |
| `db`       | Prisma schema, migrations, database client, queries                 |
| `shared`   | `packages/game-shared` — code used by both game-server and frontend |
| `infra`    | Docker, `compose.yaml`, deployment, `.github`                       |
| `i18n`     | Paraglide translations, `messages.json`                             |

`auth` is intentionally separate from `backend`: auth issues are security-sensitive, span the frontend/backend boundary, and require a distinct resolution path.

### 3.3 Game Server Layout

All Colyseus server-side code lives under `src/lib/game/colyseus/`:

```
src/lib/game/colyseus/
├── TankRoom.ts          # Room definition — registered in hooks.server.ts
└── schema/              # GameRoomState, TankSchema, TerrainSchema, ProjectileSchema
```

- Rooms are registered via `matchMaker.defineRoomType('tankroom', TankRoom)` inside the `handleColyseus` hook in `src/hooks.server.ts`.
- `globalThis.gameServer` guards against double-initialisation across HMR reloads.
- Client connections use `ws://localhost:3000` in development and `wss://<host>` in production — no port 2567.

### 3.4 Architecture Decision Records (ADRs)

Any architectural decision with lasting impact must be documented as an ADR:

```
docs/adr/0001-use-sveltekit-and-prisma.md
docs/adr/0002-server-authoritative-game-state.md
```

### 3.5 Anti-patterns

- No god functions or mega-components.
- No feature logic in route files.
- No direct DB calls from UI components.
- No implicit trust in client-side data for authorization.

---

## 4. Git & Branching Strategy

### 4.1 Branch Naming

```
<type><issue-number>-<slug>
```

| Example branch             | Meaning               |
| -------------------------- | --------------------- |
| `feat/42-jwt-auth`         | Feature — issue #42   |
| `fix/67-login-redirect`    | Bug fix — issue #67   |
| `ci/15-docker-healthcheck` | CI change — issue #15 |
| `docs/8-api-reference`     | Docs — issue #8       |

The issue number is mandatory. A slug is 3–4 lowercase, hyphen-separated words derived from the issue title.

**Special prefixes:**

- `dev/<name>` — personal sandbox, never merged into `main`. Delete by hand.
- `test/` — reserved for actual test code (unit tests, integration tests, fixtures).
- `integration` — shared staging area for wiring dependent branches together before any hits `main`. Not a source of truth.

### 4.2 Creating a Branch

Always branch from an up-to-date `main`:

```bash
git checkout main
git pull origin main
git checkout -b feat/42-jwt-auth
```

Keep branches short-lived. A branch open for more than 2–3 days without a PR is a signal to split into sub-issues.

### 4.3 Commit Format (Conventional Commits)

```
<type>(<scope>): <short description>

[optional body — explain WHY, not WHAT]
```

**Rules:**

- Description is lowercase, imperative mood (`add` not `added`), under 72 characters.
- Scopes are flat and coarse-grained — use the domain name, not the file or subcomponent.
- If a commit touches two scopes, pick the primary one.
- Use a body when reasoning is non-obvious or future contributors need context.

**Commit types:**

| Type       | When to use                                           |
| ---------- | ----------------------------------------------------- |
| `feat`     | New functionality visible in the product              |
| `fix`      | Bug correction                                        |
| `refactor` | Code restructured, no behavior change                 |
| `style`    | Formatting/linting pass — zero logic change           |
| `test`     | Adding or updating tests                              |
| `ci`       | CI pipelines, GitHub Actions, workflow changes        |
| `chore`    | Dependency updates, config files, tooling maintenance |
| `docs`     | Documentation only                                    |
| `perf`     | Performance improvement                               |
| `security` | Auth, JWT, OAuth, 2FA, session, input validation      |

**`style` vs `chore`:** `style` is a bulk formatting pass (run Prettier, apply ESLint auto-fixes). `chore` is a tooling or dependency change (bump Prisma, update tsconfig). A reviewer can skim a `style` PR — nothing in it affects logic.

**Examples:**

```
feat(backend): add JWT token generation
fix(frontend): correct auth redirect on logout
chore(infra): bump Prisma to 7.8.0
```

### 4.4 Merge Policy

- **Squash merge only** — one clean commit per feature on `main`.
- The PR title becomes the squash commit message — it is the permanent record.
- No direct pushes to `main`, including from maintainers.
- Rebase on `main` before merge if the branch is behind.

### 4.5 Working on Dependent Branches

If your work depends on an open branch not yet in `main`:

1. Branch from the open branch, not from `main`.
2. Open a PR targeting the open branch — the diff shows only your new work.
3. Once the upstream branch merges into `main`:
   ```bash
   git fetch origin
   git merge origin/main
   git push origin <your-branch>
   ```
4. Update the PR base branch in GitHub from the old branch to `main`.

---

## 5. Code Review Standards

### 5.1 What Reviewers Check

- Does the code do what the linked issue says?
- Is the code readable?
- Are edge cases handled?
- Are errors handled properly?
- Is naming consistent?
- Is basic security respected?
- Is the solution overly complex for the need?

Approving code you do not understand is not a review.

### 5.2 Reviewer Conduct

- Criticize the code, never the person.
- Reviews must be precise and actionable.
- Every change request must explain _why_.
- If a point is blocking, say so clearly. If it's a suggestion, say that too.

### 5.3 PR Size

| Lines changed | Assessment                                 |
| ------------- | ------------------------------------------ |
| 50–400        | Ideal — reviewable in under 30 minutes     |
| 400–800       | Acceptable if well scoped                  |
| 800+          | Must be split into smaller PRs if possible |

### 5.4 Review Requirements

- At least **1 required approval** (team decision: 1 or 2).
- Stale reviews are dismissed when new commits are pushed.
- CODEOWNERS review is required for files in their area.
- All CI checks must be green.
- All conversations must be resolved before merge.

### 5.5 PR Checklist (author, before requesting review)

- [ ] Code compiles
- [ ] Tests pass
- [ ] Lint passes
- [ ] Formatting applied
- [ ] DB migrations included if schema changed
- [ ] Documentation updated if necessary
- [ ] PR is linked to an issue (`Closes #N` in the body)
- [ ] Screenshots or logs attached for UI or infra changes

---

## 6. Testing Requirements

### 6.1 Test Pyramid

| Layer       | Scope                              | Tool                 |
| ----------- | ---------------------------------- | -------------------- |
| Unit        | Business logic, isolated functions | Vitest               |
| Integration | API ↔ DB ↔ WebSocket               | Docker Compose stack |
| E2E         | Critical user journeys             | Playwright           |

### 6.2 Coverage Priorities

- Authentication and authorization flows
- Permission and role checks
- Critical business flows
- Input validation
- Error states
- WebSocket reconnection and concurrent actions (required by project spec)

### 6.3 Policy

- Every important bug fixed must have a regression test.
- No critical feature merged without tests.
- Tests must be readable and deterministic.
- Flaky tests are treated as bugs — address immediately.

---

## 7. CI/CD & Deployment

### 7.1 Pipeline Overview

Each CI workflow is a single-job, single-concern file. Checks are independently visible and re-runnable in the GitHub Actions UI — the same pattern used by Vite, SvelteKit, and ESLint.

Every workflow:

- Sets up **Node 24.15.0** and **pnpm 10.x** via `pnpm/action-setup`
- Runs `pnpm install --frozen-lockfile`
- Has read-only permissions at the job level (`contents: read`)
- Declares a concurrency group scoped to branch/PR with `cancel-in-progress: true`

### 7.2 CI Triggers by Branch Prefix

| Branch prefix          | CI on push                  |
| ---------------------- | --------------------------- |
| `feat`, `fix`, `chore` | Lint, typecheck, unit tests |
| `ci`, `infra`          | Docker build                |
| All other prefixes     | Full CI on PR to `main`     |

Full CI runs on every PR to `main`.

### 7.3 Required Status Checks (gate on `main`)

| Check                      | What it runs                                          |
| -------------------------- | ----------------------------------------------------- |
| `ci-lint-eslint`           | `pnpm lint:eslint`                                    |
| `ci-lint-prettier`         | `pnpm lint:prettier`                                  |
| `ci-lint-prisma`           | `prisma format --check`                               |
| `ci-lint-pr-title`         | Conventional Commit regex on PR title                 |
| `ci-typecheck-frontend`    | `svelte-check`                                        |
| `ci-typecheck-game-server` | `tsc --noEmit` (root `tsconfig.json`)                 |
| `ci-test-unit`             | Vitest                                                |
| `ci-test-e2e`              | Playwright (PR to `main` only)                        |
| `ci-test-integration`      | Docker Compose stack + assertions (PR to `main` only) |
| `ci-docker-build`          | Build Dockerfile via `compose.yaml` (no push)         |

### 7.4 Automation Workflows

| Workflow                  | Trigger                      | Effect                                                          |
| ------------------------- | ---------------------------- | --------------------------------------------------------------- |
| `automation-label-issue`  | Issue opened                 | Reads scope dropdown → applies `scope` label                    |
| `automation-label-pr`     | PR opened/edited             | Reads PR title → applies `type` + `scope` labels                |
| `automation-state-branch` | Branch created               | Parses `type/NN-slug` → sets `status: in progress` on issue #NN |
| `automation-state-pr`     | PR opened / ready for review | Sets `status: in review` on linked issue                        |
| `automation-state-pr`     | PR merged                    | Sets `status: done` on linked issue                             |

**Important:** Create all 29 labels before pushing the first branches. Applying a label that does not exist is a silent no-op.

### 7.5 Post-Merge Deployment

`ci-docker-push.yaml` triggers on push to `main` only. It builds and pushes Docker images to the registry. This runs post-merge — it is not a gate.

---

## 8. Security Guidelines

### 8.1 Checklist

- [ ] Passwords hashed with a robust algorithm (bcrypt / argon2)
- [ ] Strict input validation on every sensitive route
- [ ] Access control checked on every protected endpoint
- [ ] Permissions verified server-side — never trust the client
- [ ] File uploads protected and scoped
- [ ] Logs contain no tokens, passwords, or cookies
- [ ] Service permissions are minimal

### 8.2 Forbidden

- Hardcoded secrets anywhere in the codebase.
- Logs containing tokens, passwords, or session cookies.
- Hidden admin routes without real access control.
- Trusting the frontend for user rights.

### 8.3 Secrets Management

- All sensitive values go in `.env`, which is git-ignored.
- A `.env.example` with placeholder values must be kept up to date. Required variables include `BETTER_AUTH_URL` and `ORIGIN` (SvelteKit CSRF origin check in production).
- CI secrets are stored in GitHub Actions Secrets — never in workflow YAML files.

### 8.4 Dependency Auditing

```bash
pnpm audit
```

Run before any major dependency update. Address `high` and `critical` advisories before merging.

### 8.5 Vulnerability Reporting

Report security issues directly to the repository maintainer via a private channel. Do not open a public issue for a vulnerability.

---

## 9. Documentation Standards

### 9.1 Inline Comments

- Comments explain _why_, never _what_.
- No comment that simply restates the code.
- Use comments to explain non-obvious reasoning, constraints, or trade-offs.

```ts
// Tokens were issued without an upper bound on expiry duration.
// A client-supplied value could produce indefinitely valid tokens.
clampExpiry(duration, MAX_TOKEN_EXPIRY_MS);
```

### 9.2 Required Documents

| File                             | Purpose                                              |
| -------------------------------- | ---------------------------------------------------- |
| `README.md`                      | Project description, setup instructions, stack, team |
| `docs/engineering-guidelines.md` | This file                                            |
| `docs/architecture.md`           | High-level architecture, diagrams                    |
| `docs/runbook.md`                | Operational procedures                               |
| `docs/adr/`                      | Architecture Decision Records                        |
| `CHANGELOG.md`                   | Notable changes per release                          |

### 9.3 What to Document

- How to start the project
- How to run tests
- How to fill `.env`
- How to run a migration
- How to open a PR
- How to roll back a service locally
- Who owns what in the project

### 9.4 API Documentation

Every new API route or WebSocket message type must be documented in `docs/architecture.md` or an inline JSDoc comment at minimum. Document: method, path, auth requirement, request shape, response shape, and error codes.

### 9.5 Keeping Guidelines Up to Date

This file is a living document. When a convention changes, open a `docs(infra): update engineering guidelines` PR. Do not let the document drift from reality.

---

## 10. Tooling & Environment Setup

### 10.1 Required Tools

| Tool             | Version       | Install                                   |
| ---------------- | ------------- | ----------------------------------------- |
| Node.js          | 24.x          | [nodejs.org](https://nodejs.org) or `nvm` |
| pnpm             | 10.33.0       | `npm install -g pnpm@10.33.0`             |
| Docker + Compose | Latest stable | [docker.com](https://www.docker.com)      |
| Git              | 2.x+          | System package manager                    |

### 10.2 IDE Recommendations

| Editor  | Extensions                                                              |
| ------- | ----------------------------------------------------------------------- |
| VS Code | Svelte for VS Code, ESLint, Prettier, Tailwind CSS IntelliSense, Prisma |
| Any     | EditorConfig support (respect `.editorconfig`)                          |

Shared settings should be committed to `.vscode/settings.json` for consistent behavior across the team.

### 10.3 Labels Setup (one-time, infra role)

Create all 29 labels before pushing any branches — automation workflows depend on them:

**Type labels (10):** `type: feat` · `type: fix` · `type: refactor` · `type: style` · `type: test` · `type: ci` · `type: chore` · `type: docs` · `type: perf` · `type: security`

**Scope labels (8):** `scope: frontend` · `scope: backend` · `scope: auth` · `scope: game` · `scope: db` · `scope: shared` · `scope: infra` · `scope: i18n`

**Status labels (5):** `status: todo` · `status: in progress` · `status: in review` · `status: done` · `status: blocked`

**Priority labels (3):** `priority: critical` · `priority: high` · `priority: low`

Every issue and PR must have at least one label from `type`, `scope`, and `status`. Priority is optional — medium is the implicit default and gets no label.

---

_Last updated: May 2026 — open a PR to keep this accurate._
