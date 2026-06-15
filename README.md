# Transcendance

Multiplayer browser game — SvelteKit + Colyseus + Phaser 4.

| Layer           | Technology                                                  |
| --------------- | ----------------------------------------------------------- |
| Frontend        | SvelteKit 2, Svelte 5 (runes), TailwindCSS 4, shadcn-svelte |
| Game engine     | Phaser 4                                                    |
| Multiplayer     | Colyseus 0.17 (in-process, shared port 3000)                |
| Auth            | Better-Auth                                                 |
| Database        | Prisma 7 + SQLite (better-sqlite3)                          |
| i18n            | Paraglide JS                                                |
| Package manager | pnpm 11.4.0                                                |
| Runtime         | Node 24.15.0                                                |

## Quickstart

### Docker

```bash
git clone https://github.com/ketodin/transcendance.git
cd transcendance
make          # generates certs, envfile, starts Docker Compose
```

This starts two containers: the app (port 3000) and Caddy (port 4443 with TLS). Open https://localhost:4443.

### Bare metal

```bash
git clone https://github.com/ketodin/transcendance.git
cd transcendance
pnpm install
cp .env.example .env      # fill in BETTER_AUTH_URL and ORIGIN
pnpm generate              # Prisma client + Paraglide i18n
pnpm db:push               # create dev.db
pnpm dev                   # http://localhost:3000
```

**System dependencies:** `build-essential` and `python3` are required for `better-sqlite3` native compilation.

### Production (without Docker)

```bash
pnpm build   # build SvelteKit app
pnpm start   # tsx index.ts — one process on port 3000
```

## Project Structure

```
transcendance/
├── src/
│   ├── routes/                    # SvelteKit routes (login, register, profile, game, settings, legal)
│   ├── lib/
│   │   ├── components/            # UI components (shadcn-svelte, Avatar, FriendList, GameWindow, TOTP...)
│   │   ├── game/
│   │   │   ├── client/view/       # Client-side rendering (ChatInput, ProjectileView, TankSprite, TerrainView)
│   │   │   ├── colyseus/          # Authoritative server (TankRoom, StatusRoom, schemas, handlers, validation)
│   │   │   ├── phaser/scenes/     # Phaser 4 game scenes (demoScene, gameScene)
│   │   │   └── shared/            # Shared logic (state, physics, terrain, projectile types)
│   │   ├── server/                # Backend utilities (auth client, Prisma db client)
│   │   ├── hooks/                 # Client hooks (is-mobile)
│   │   └── stores/                # Svelte stores (sidebar)
│   ├── hooks.server.ts            # Hook chain: Paraglide → Better-Auth → Colyseus → Route Protection
│   └── app.d.ts                   # Type declarations
├── prisma/schema.prisma           # Database schema (User, Session, Account, FriendRequest, TwoFactor...)
├── messages/                      # i18n translations (en.json, fr.json, es.json)
├── docs/                          # Architecture, runbook, engineering guidelines, ADRs
├── .github/                       # CI workflows, issue/PR templates, automation scripts
├── docusaurus/                    # Documentation site (serves docs/ automatically)
├── compose.yaml                   # Docker Compose (app + Caddy)
├── index.ts                       # Production entrypoint (Express + SvelteKit + Colyseus)
├── Makefile                       # Local setup shortcuts (make, make up, make down)
├── CHANGELOG.md                   # Project history
└── README.md
```

## Documentation

- [Architecture Overview](docs/architecture.md) — stack, process model, scope map, hook chain
- [Runbook](docs/runbook.md) — bootstrap, day-to-day commands, CI debugging, resets
- [Engineering Guidelines](docs/engineering-guidelines.md) — code style, commit format, branch naming, PR workflow, CI/CD
- [Architecture Decision Records](docs/adr/) — 9 ADRs covering every major architectural choice
- [Changelog](CHANGELOG.md) — all notable changes organized by category

## Contributing

See [docs/engineering-guidelines.md](docs/engineering-guidelines.md) for the full workflow. Quick summary:

- Branch naming: `<type>/<issue-number>-<slug>` (issue required before branching)
- Commit format: `<type>(<scope>): <description>` (Conventional Commits, scope required, 10 types, 8 scopes)
- Squash merge only, never push directly to `main`
- All 10 CI checks must pass before merge
