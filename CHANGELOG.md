# Changelog

All notable changes to Transcendance are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project does not use versioned releases yet — changes are grouped by category.

---

## [Unreleased]

### Infrastructure

- CI/CD pipeline with 10 required status checks (lint, typecheck, test, docker build)
- GitHub Actions automation: labels, branch status, PR state tracking
- 29 labels across type, scope, status, and priority categories
- Issue templates (10 YAML templates) with scope dropdown and task checklists
- PR template with checklist and size limits
- Docker and Docker Compose deployment with Caddy reverse proxy on port 4443
- Makefile for local setup (certs, envfile, up/down/fclean)
- Docusaurus documentation site deployed on GitHub Pages

### Authentication

- Better-Auth with SvelteKit integration
- OAuth 2.0 via 42 intranet
- Google OAuth provider with username collision handling
- TOTP two-factor authentication (enable, scan, disable)
- Session injection and route protection via SvelteKit hooks
- Hidden TOTP for Google-connected accounts
- Redirect already-logged-in users away from login/register pages
- Security: sensitive fields omitted from public profile API

### Frontend

- Svelte 5 (runes mode) with SvelteKit 2
- TailwindCSS 4 with shadcn-svelte component library (accordion, alert-dialog, badge, button, card, checkbox, dialog, form, input, label, separator, sheet, skeleton, sonner, tabs, tooltip)
- Dark/light theme with shader-based transitions
- Homepage, login, register, profile, settings, legal (terms/privacy), error pages
- Avatar upload and display with edge case handling
- Friend system: add, accept, pending zone, live friend list updates
- Real-time notification system (toasts for invites, friend requests)
- Game lobby UI with invite notifications
- Language picker with Paraglide i18n (English, French, Spanish)
- Responsive design across all pages
- Show password checkbox on login/register
- Account deletion from settings
- Change password from settings

### Game

- Phaser 4 engine embedded in SvelteKit via a game window component
- Colyseus 0.17 authoritative multiplayer server (in-process, shared port 3000)
- Tank-based combat: movement, aiming, projectiles with balanced damage and trajectories
- Weapons: multiple types with reworked design and balancing
- Terrain system: destructible and indestructible terrain with physics
- Real-time chat in battle with dynamic sizing
- SSR support for game canvas
- Game reconnection after disconnect
- Opponent disconnect game-over state with i18n message
- Room cleanup: Colyseus room destroyed at game end
- Online status tracking (StatusRoom)
- Invitation system: invite friends to games with notification
- Leave button during game
- End game window redesign
- Fuel and projectile info hidden from opponent view
- Game colors synced with frontend theme (light/dark mode auto-switch)
- Resolution scaling improvements
- i18n in game UI
- Phaser warnings resolved
- Colyseus message payloads validated with Zod

### Backend

- Express 5 + SvelteKit in single process (index.ts)
- Prisma 7 ORM with SQLite (better-sqlite3)
- Database schema: User, Session, Account, Verification, FriendRequest, TwoFactor
- Friend system CRUD with live updates via notifications
- Route protection with public route allowlist
- Colyseus rooms defined and registered in hooks.server.ts
- Database seeding script

### Shared

- Realtime notification system between users (Colyseus-based)
- Online presence/status tracking
- Game state, physics, and terrain logic shared across client and server
- Game colors theme sync
- Avatar serving from uploads directory
- Game invite notification delivery

### Developer Experience

- pnpm workspace with strict engine and build allowlist
- ESLint (recommendedTypeChecked) + Prettier (tabs, single quotes, trailing comma none)
- Prisma format in lint pipeline
- svelte-check + tsc --noEmit unified typecheck
- Vite dev server with custom colyseus-dev-server plugin
- Hot module replacement alongside WebSocket game traffic
- Conventional Commits with 10 types and 8 scopes
- Squash-merge only on main, branch naming with issue numbers
- Dead code cleaned up, Gamescene.ts split into focused files

---

## Contributing

See [docs/engineering-guidelines.md](docs/engineering-guidelines.md) for commit format, branch naming, PR workflow, and code standards.
