_This project has been created as part of the 42 curriculum by jaubry--, pabellis, amidigov, tdaclin, okientzl._

---

## Description

Transcendence is a real-time, turn-based multiplayer tank game. Two players each control a tank on a procedurally generated 2D terrain, take turns aiming and firing seven different weapons, and the first to drop the opponent's HP to zero wins the match.

The whole thing runs in a single Docker container behind a Caddy reverse proxy with TLS, one `make` command and you're playing. Under the hood it's SvelteKit (frontend + backend), Colyseus (authoritative WebSocket game server), Phaser 4 (canvas game engine), Better-Auth (authentication), and Prisma over SQLite (database).

Key features:

- Real-time 2-player tank duels over WebSockets, server-authoritative physics
- Turn-based gameplay: aim, pick a weapon, move within your fuel budget, fire
- 7 weapons (Shell, Heavy, Bouncer, Split, Airstrike, Strike Bomb, Sniper) with distinct damage, blast radius, and behaviours
- Destructible terrain, craters change the battlefield every shot
- Friends with real-time online status, game invites, and in-game chat
- Email/password auth, Google OAuth, and TOTP 2FA
- Profiles with avatar upload, name and password changes
- 3 languages (English, French, Spanish) with instant switching
- Dark and light themes that extend into the game canvas itself
- Reconnection logic for network drops
- Privacy Policy and Terms of Service pages

---

## Instructions

### Prerequisites

Docker with Compose (the deployment path), or Node 24.15.0 + pnpm 11.4.0 for bare metal. You'll also need build-essential and python3 for native compilation of better-sqlite3.

### Environment

Copy `.env.example` to `.env` and fill in:

```
BETTER_AUTH_SECRET=*** openssl rand -base64 32
GOOGLE_CLIENT_ID=    # from Google Cloud Console
GOOGLE_CLIENT_SECRET=*** from Google Cloud Console
```

Optional in dev: `ORIGIN` and `BETTER_AUTH_URL` (Better-Auth guesses them if omitted).

### Docker (single command)

```bash
git clone https://github.com/ketodin/transcendance.git
cd transcendance
make
```

This generates self-signed TLS certs, creates the Docker env file, and starts two containers: the app (port 3000) and Caddy (port 4443 with TLS). Open https://localhost:4443 or `https://<hostname>:4443`.

### Bare metal (development)

```bash
pnpm install
cp .env.example .env       # fill in secrets
pnpm generate              # Prisma client + Paraglide i18n
pnpm db:push               # create the SQLite database
pnpm dev                   # http://localhost:3000
```

### Production (bare metal)

```bash
pnpm build
pnpm start    # tsx index.ts on port 3000
```

### Makefile targets

`make` / `make up`, build and start. `make down`, stop. `make fclean`, stop and clean. `make re`, full rebuild.

---

## Team Information

| Member (login) | Role(s)                       | Responsibilities                                                                                                                                                                                                                                                                           |
| -------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| pabellis       | Developer                     | Frontend design lead, the whole UI look and feel, shader backgrounds, error pages, CSS, settings page, profile page, home page, friend request UI, registration hardening, legal pages                                                                                                     |
| amidigov       | Developer                     | The entire game, Phaser 4 implementation, tank and weapon design, mouse aiming, projectile physics and balancing, GameScene architecture, Colyseus auth, message validation with Zod, game i18n, initial TankRoom structure                                                                |
| tdaclin        | Tech Lead + Developer         | A bit of everything, mostly backend and linking parts together: game reconnection, invite system wiring, route protection, profile page API, WebSocket fixes, console error cleanup, infra fixes, database seeding                                                                         |
| okientzl       | PM / Scrum Master + Developer | In-game chat and text bubbles, a big chunk of auth (Better-Auth setup, Google OAuth, TOTP 2FA, password change), lobby UI, UX design, mobile adaptation, TOTP light-mode fix                                                                                                               |
| jaubry--       | Product Owner + Developer     | All GitHub infrastructure (repo setup, CI, issue/PR templates, labels, CODEOWNERS, guidelines, docs, Makefile), then backend work on the Colyseus rework with tdaclin, friend status, invites, notification logic, check-room endpoints, reconnection fixes, error handling, documentation |

### Project Management

We organized the work through GitHub Issues with YAML templates and 29 labels covering type, scope, status, and priority. Branches follow `<type>/<issue-number>-<slug>` naming with Conventional Commits (mandatory scope, 10 types, 8 scopes). Squash merge only, never push directly to main. At least one teammate reviews each PR, and all CI checks (ESLint, Prettier, Prisma format, svelte-check, Docker build) must pass before merge.

jaubry-- set up all the GitHub infrastructure early on, the repo, CI workflows, issue/PR templates, labels, CODEOWNERS, engineering guidelines, and the documentation structure. That gave the team a clear framework to work in from the start.

We used Discord for day-to-day communication and GitHub Issues/PRs for async discussion. Weekly syncs kept everyone aligned on progress and blockers.

The git log shows commits from all five members across frontend, backend, game, auth, and infra scopes.

### Individual Contributions

**jaubry--**, Started by building the entire GitHub and CI infrastructure: the repo, issue templates (10 YAML templates), PR template, CODEOWNERS, 29 labels, CI workflows (lint, typecheck, Docker build), automation scripts, engineering guidelines, documentation stubs, ADRs, Dockerfile, compose.yaml, Makefile, Caddy setup, and the Docusaurus site. Once the team had a solid foundation to work in, he moved into backend development, the Colyseus integration rework (PR #124), real-time online status for friends (PR #142), the notification system between users (PR #146), game invite notifications (PR #188), HTTPS setup (PR #172), and later a series of fixes: the locale-change presence desync race (PR #264), matchmaking cancel deadlock (PR #265), Colyseus error code normalization, check-room endpoints (PR #277), profile page reactivity, and the full project documentation update (PR #263). Also added the CHANGELOG, README rewrite, and .env.docker updater.

**pabellis**, Owned the frontend design from day one. Built the initial homepage, then the settings page, profile page, friend request UI (add button, pending zone), error page with shader, the shader theme system implementation, CSS throughout, favicon, language support, password show/hide checkbox, privacy policy and terms of service pages, the i18n integration into auth error messages, and the overall UI rework (PRs #184, #200, #208). Later fixed light mode contrast (PR #251), legal pages for logged-out users (PR #257), blur background with sidebar open (PR #256), registration hardening (PR #269), WebGL instance cleanup (PR #286), account deletion notifications (PR #276), and superform fixes (PR #291). Also did the delete account button and the mobile-responsive friend section footer.

**amidigov**, Built the entire game. Started with the Phaser 4 implementation inside SvelteKit (PR #19), plugged Colyseus (PR #56), then designed the tanks and weapons (PR #131), mouse aiming (PR #141), projectile balancing (PR #149), the GameScene split into modular files (PR #166), Colyseus auth (PR #161), game SSR (PR #153), dynamic chat sizing (PR #156), the leave button (PR #199), end game window redesign (PR #205), game i18n (PR #250), GameOver message with i18n (PR #255), message payload validation with Zod (PR #260), in-game text readability (PR #254), Firefox console fix (PR #285), room exception handling (PR #295), and the initial TankRoom structure. Also synced game colors with the frontend theme system (PR #77) and fixed GameWindow scaling (PR #213). Cleaned dead code (PR #181).

**tdaclin**, Did a bit of everything, mostly backend and linking parts together. Integrated friends into the new frontend (PR #139 friends in front), better route protection (PR #165), game invitation system wiring (PR #180), game reconnection (PR #221), database seeding script (PR #137), profile page API security fix (PR #252), Colyseus room destruction at game end (PR #259), client reconnection cleanup (PR #279 rejoin index override), WebSocket error on leave (PR #289), console error cleanup (PR #283), avatar upload error handling, matchmake error handling, entrypoint fix (PR #297), and miscellaneous backend fixes (PR #293). Acted as Scrum Master, keeping the team synced and unblocked.

**okientzl**, Built the in-game chat system (PR #84) and the client-side text bubble component, then took on a big chunk of the authentication: Better-Auth basics (PR #66), TOTP 2FA (PR #121), moved TOTP and started the home page (PR #127), Google OAuth provider (PR #139), hid TOTP for OAuth accounts (PR #155), password change logic and toast notifications in settings, Google OAuth username collision handling (PR #253), avatar edge cases (PR #258), auth rate limiting (PR #287), and register redirect fix (PR #192). Also did the lobby UI (PR #187), the play game button (PR #185), language refresh fix (PR #160), responsive friend section footer (PR #173), dynamic HTML parameter effect (PR #194), friend notification logic, TOTP backup code light-mode contrast fix, and helped with UX design throughout.

### Challenges

- **Locale-change reconnect race:** switching language destroyed and recreated components managing WebSocket connections. The async cleanup function stayed truthy during `await`, blocking reconnection. Fixed with a synchronous boolean flag set before any await (PR #264).
- **Matchmaking cancel deadlock:** a player disconnecting during the lobby countdown left the other stuck at a spinner. Two-layer fix: server-side pre-game onLeave cleanup + client-side re-queue logic (PR #265).
- **Colyseus SDK console noise:** calling `joinById` on a destroyed room logged errors before our catch block ran. Fixed by pre-verifying room existence server-side via `matchMaker.query` before calling the client SDK (PR #277).
- **Google OAuth name collisions:** OAuth users with duplicate names hit the unique constraint. Fixed by generating a temporary suffixed name and prompting for a permanent one (PR #253).

---

## Technical Stack

**Frontend:** SvelteKit 2, Svelte 5 (runes), TailwindCSS 4, shadcn-svelte (16 component categories), Phaser 4 (game canvas), Paraglide JS (i18n), sveltekit-superforms + Zod (form validation), mode-watcher (theme), svelte-sonner (toasts), Lucide (icons), Inter Variable (typography).

**Backend:** SvelteKit server-side load functions, endpoints, form actions, and hooks, plus Express as the production HTTP wrapper and Colyseus 0.17 as the authoritative game server with WebSocket transport, all running in-process on a single port. Better-Auth handles authentication with rate limiting. Zod 4 validates every Colyseus message payload and every form input.

**Database:** Prisma 7 with the better-sqlite3 adapter over SQLite. SQLite was chosen because a 2-player game doesn't need a separate database server, it keeps the deployment to one container with no external dependencies, and the file persists via a Docker volume.

**Other:** Caddy 2.11 (reverse proxy + TLS), Docker Compose (containerization), pnpm 11.4.0 (package manager), Node 24.15.0 Alpine (runtime).

SvelteKit counts as both the frontend and backend framework, we use its server load functions, endpoints, form actions, and hooks for the backend, and Svelte components for the frontend.

---

## Database Schema

Defined in `prisma/schema.prisma`. Six models with clear relations:

```
User 1──N Session       (token, expiresAt, ipAddress, userAgent)
User 1──N Account       (providerId: "credential"|"google", password hash, OAuth tokens)
User 1──N TwoFactor     (TOTP secret, backup codes)
User 1──N FriendRequest (sentRequests)
User 1──N FriendRequest (receivedRequests)

FriendRequest: senderId, receiverId, status (PENDING|ACCEPTED), unique on [senderId, receiverId]
Verification:  email verification tokens (used by Better-Auth)
```

Key fields: `User.name` (unique, 3-32 chars, regex-validated), `User.email` (unique), `User.image` (avatar path), `User.twoFactorEnabled`, `Account.password` (hashed, only for credential provider), `TwoFactor.secret` + `TwoFactor.backupCodes` (8 codes, 10 chars).

All relations use `onDelete: Cascade` on the User side, deleting a user cleans up sessions, accounts, 2FA records, and friend requests automatically.

---

## Features List

| Feature                                                                                       | Who worked on it                     |
| --------------------------------------------------------------------------------------------- | ------------------------------------ |
| GitHub infrastructure (CI, templates, labels, guidelines, docs, Docker, Makefile, Caddy)      | jaubry--                             |
| Colyseus integration rework, friend status, invites, notification logic, check-room endpoints | jaubry--, tdaclin                    |
| Reconnection logic (allowReconnection, reconnection tokens, pre-game cleanup)                 | tdaclin, jaubry--                    |
| Phaser 4 game client (scenes, rendering, input, HUD, tanks, weapons, aiming)                  | amidigov                             |
| 7 weapon types with distinct stats and behaviours                                             | amidigov                             |
| Initial Colyseus TankRoom structure                                                           | amidigov                             |
| Colyseus message validation with Zod                                                          | amidigov                             |
| Game i18n and in-game text                                                                    | amidigov                             |
| Frontend design (UI, shader, error pages, CSS, settings, profile, home, friends UI)           | pabellis                             |
| Mobile adaptation                                                                             | pabellis, okientzl                   |
| In-game chat and text bubbles                                                                 | okientzl                             |
| Authentication (Better-Auth setup, Google OAuth, TOTP 2FA, password change, rate limiting)    | okientzl                             |
| Google OAuth username collision handling                                                      | okientzl                             |
| Lobby UI and UX design                                                                        | okientzl                             |
| Registration hardening and account deletion                                                   | pabellis                             |
| Privacy Policy and Terms of Service pages                                                     | pabellis                             |
| Route protection and profile page API                                                         | tdaclin                              |
| Game reconnection and invite system wiring                                                    | tdaclin                              |
| Database seeding                                                                              | tdaclin                              |
| Dark/light theme system (CSS variables, game canvas sync)                                     | jaubry--, pabellis                   |
| i18n in 3 languages (134 keys each)                                                           | pabellis (frontend), amidigov (game) |
| Project documentation and ADRs                                                                | jaubry--                             |
| WebSocket fixes and console error cleanup                                                     | tdaclin                              |

---

## Modules

6 Major modules (12 pts) + 9 Minor modules (9 pts) = **21 points** (minimum required: 14).

| #   | Module                                           | Type  | Points |
| --- | ------------------------------------------------ | ----- | ------ |
| 1   | Use a framework for both frontend and backend    | Major | 2      |
| 2   | Real-time features with WebSockets               | Major | 2      |
| 3   | User interaction (chat, profiles, friends)       | Major | 2      |
| 4   | ORM for the database                             | Minor | 1      |
| 5   | [TEMP] Notification system                       | Minor | 1      |
| 6   | Server-Side Rendering                            | Minor | 1      |
| 7   | [TEMP] Custom-made design system                 | Minor | 1      |
| 8   | Multiple languages (3+)                          | Minor | 1      |
| 9   | [TEMP] Additional browser support                | Minor | 1      |
| 10  | Standard user management and authentication      | Major | 2      |
| 11  | OAuth 2.0 remote authentication                  | Minor | 1      |
| 12  | 2FA (TOTP)                                       | Minor | 1      |
| 13  | Web-based game                                   | Major | 2      |
| 14  | Remote players (real-time on separate computers) | Major | 2      |
| 15  | Custom module: dynamic theme system              | Minor | 1      |
|     | **Total**                                        |       | **21** |

---

### 1. Major, Use a framework for both the frontend and backend (2 pts)

**Implemented and verified.**

SvelteKit 2 is the full-stack framework. The subject says full-stack frameworks count as both if you use both capabilities, we do.

Frontend: Svelte 5 components with runes, SvelteKit routing in `src/routes/`, `hooks.client.ts`.

Backend: server load functions (`+page.server.ts`), server endpoints (`+server.ts`), form actions, `hooks.server.ts` (Paraglide → Better-Auth → Colyseus → route protection), and `$app/server` remote functions (`command`, `query`, `form` in `friends.remote.ts` and `invite.remote.ts`). Express wraps the SvelteKit handler in production (`index.ts`).

Evidence: `package.json` has `@sveltejs/kit ^2.57.0`, `svelte ^5.55.2`, `@sveltejs/adapter-node ^5.5.4`. `src/hooks.server.ts` has the full 4-stage hook chain. `index.ts` serves Express + SvelteKit + Colyseus on port 3000.

Who: tdaclin (architecture, hooks, server logic), all members (routes and actions).

---

### 2. Major, Real-time features with WebSockets (2 pts)

**Implemented and verified.**

Colyseus 0.17 with WebSocketTransport. Two room types:

**Game rooms (`tank_room`):** `TankRoom.ts`, `maxClients = 2`, `patchRate = 16` (60fps state sync). Messages: `input`, `fire_direct`, `set_turret_angle`, `select_weapon`, `ready`, `chat`. State changes auto-sync via Colyseus schema delta serialization. Phase transitions broadcast via `room.broadcast('phase_change', ...)`.

**Status rooms (`status`):** `StatusRoom.ts`, `maxClients = 1` per user. Real-time friend online/offline presence via `statusHub`. Notifications pushed via `room.clients[0].send('notification_*', payload)`.

Connection handling: `onJoin` authenticates via Better-Auth, `onLeave` handles pre-game cleanup and in-game forfeit, `onReconnect` restores online status, `onDrop` handles network drops. `allowReconnection(client, 10)` gives a 10-second reconnection window.

Efficient broadcasting: Colyseus delta serialization sends only changed fields. Chat messages are rate-limited (one per `CHAT_BUBBLE_DURATION` per player).

Evidence: `package.json` has `colyseus ^0.17.10`, `@colyseus/ws-transport ^0.17.13`, `@colyseus/sdk ^0.17.42`. `index.ts` creates `WebSocketTransport({ server: httpServer })`. `hooks.server.ts` registers both room types via `matchMaker.defineRoomType`.

Who: amidigov (initial Colyseus structure, auth in Colyseus), jaubry-- (Colyseus rework, statusHub, notifications), tdaclin (disconnect fixes, reconnection).

---

### 3. Major, Allow users to interact with other users (2 pts)

**Implemented and verified.**

Three systems as required:

**Chat:** `chatHandler.ts` registers a `chat` message handler on the game room. `ChatInput.ts` is the in-game input UI. `speechBubble.ts` renders bubbles above tanks. Messages validated with `ChatSchema` (Zod) and rate-limited. `room.broadcast('chat', { playerIndex, text })` sends to both players.

**Profiles:** `src/routes/profile/[id]/+page.server.ts` loads user data from Prisma, omitting security fields (`twoFactorEnabled`, `emailVerified`). `ProfileCard.svelte` and `Avatar.svelte` render the profile.

**Friends:** `friends.ts` has `getFriendList(meId)` returning friends with status (`ACCEPTED`, `RECEIVED`, `SENT`). `friends.remote.ts` provides `list`, `accept`, `remove`, `send` as SvelteKit remote functions with `statusHub.notify()` calls. `FriendList.svelte` and `FriendCard.svelte` are the UI. `StatusRoom` + `statusHub` provide real-time online/offline status. The Prisma `FriendRequest` model has a `PENDING`/`ACCEPTED` enum and a unique constraint on `[senderId, receiverId]`.

Evidence: `chatHandler.ts` uses `validated(ChatSchema, ...)`. `friends.remote.ts` has `sendOrAccept()` and `dismissOrRemove()` with `statusHub.notify()` calls. `prisma/schema.prisma` has the `FriendRequest` model with the status enum.

Who: okientzl (chat, text bubbles), jaubry-- (friends system, statusHub, notifications), pabellis (friend request UI), tdaclin (friends integration in frontend).

---

### 4. Minor, Use an ORM for the database (1 pt)

**Implemented and verified.**

Prisma 7 with the better-sqlite3 adapter. `prisma/schema.prisma` defines all models. `src/lib/server/db.ts` exports the Prisma client. All database access goes through Prisma's type-safe query builder, no raw SQL anywhere.

Better-Auth uses the Prisma adapter directly: `prismaAdapter(db, { provider: 'sqlite' })` in `auth.ts`.

Evidence: `package.json` has `@prisma/client ^7.8.0`, `@prisma/adapter-better-sqlite3 ^7.8.0`, `@better-auth/prisma-adapter ^1.6.11`. Scripts: `db:push`, `db:generate`, `db:migrate`. Examples in code: `db.friendRequest.findMany({ where: { OR: [...] }, include: { sender: true, receiver: true } })` in `friends.ts`.

Who: jaubry-- (schema design), tdaclin (seeding script), all members (queries).

---

### 5. \[TEMP\] Minor, A complete notification system for all creation, update, and deletion actions (1 pt)

**Implemented, completeness pending evaluator assessment.**

Real-time notifications via StatusRoom + statusHub, delivered as toast notifications.

| Action                           | Notification                           | Toast                                  |
| -------------------------------- | -------------------------------------- | -------------------------------------- |
| Friend request sent (create)     | `notification_friend_request_received` | "New friend request received"          |
| Friend request accepted (update) | `notification_friend_request_accepted` | "{name} accepted your friend request"  |
| Friend request denied (delete)   | `notification_friend_request_denied`   | "{name} declined your friend request"  |
| Friend removed (delete)          | `notification_friend_request_removed`  | Friend list refresh                    |
| Game invite sent (create)        | `notification_invite_request_received` | Custom toast with Accept/Deny buttons  |
| Game invite accepted (update)    | `notification_invite_request_accepted` | "{name} accepted your game invite"     |
| Game invite denied (delete)      | `notification_invite_request_denied`   | Toast + redirect home                  |
| Account deletion (delete)        | Notifies all friends of removal        | `notifyRemoval()` iterates all friends |

Architecture: `statusHub.ts` is the in-memory registry (userId → StatusRoom). `notify(userId, type, payload)` sends to the user's status room. `notification-client.ts` attaches listeners on the client and shows toasts via `svelte-sonner`. `GameInviteToast.svelte` is a custom toast with action buttons.

This covers creation, update, and deletion for the social interactions (friends and invites). Actions like avatar or password changes show success toasts to the acting user but don't notify other users, whether this satisfies "all" actions in the subject is up to the evaluator.

Evidence: `notification-client.ts` has 7 notification handlers. `friends.remote.ts` calls `statusHub.notify()` on every friend operation. `invite.remote.ts` calls `statusHub.notify()` on every invite operation. PR #276 added account-deletion notifications.

Who: jaubry-- (notification architecture, statusHub, PRs #146 and #188), okientzl (friend notification logic), pabellis (account deletion notifications, PR #276).

---

### 6. Minor, Server-Side Rendering (SSR) for improved performance and SEO (1 pt)

**Implemented and verified.**

SvelteKit with `@sveltejs/adapter-node` provides SSR out of the box. Server load functions run on the server before rendering. `hooks.server.ts` runs on every request (Paraglide sets locale, Better-Auth fetches session, route protection redirects). `index.ts` serves the SSR handler via Express. The HTML is rendered server-side with `<html lang="..." dir="...">` injected by the Paraglide hook.

Legal pages (`/legal/privacy`, `/legal/terms`) render their content server-side, accessible to crawlers without JavaScript.

Evidence: `package.json` has `@sveltejs/adapter-node ^5.5.4`. `hooks.server.ts` uses `paraglideMiddleware` with `transformPageChunk` to inject locale and text direction server-side. `index.ts` does `app.use(handler)`. PR #153 added SSR for the game.

Who: jaubry-- (SSR setup, hooks), amidigov (game SSR).

---

### 7. \[TEMP\] Minor, Custom-made design system with reusable components (1 pt)

**Implemented, "custom-made" interpretation pending.**

The project combines shadcn-svelte (16 component categories, each with multiple subcomponents) with 13 custom project-specific components and a CSS-variable-based color system that extends into the Phaser game canvas.

**Color palette:** `app.css` defines 11 grayscale steps (`--0` through `--1000`), semantic colors (`--background`, `--foreground`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--chart-1` through `--chart-5`), and 19 game-specific variables. Dark mode overrides via `.dark` class.

**Typography:** Inter Variable via `@fontsource-variable/inter`. Set in `app.css` as `--font-sans`.

**Icons:** Lucide via `@lucide/svelte`.

**Reusable components (16 shadcn-svelte categories + 13 custom = 29 total):**

shadcn-svelte: accordion, alert-dialog, badge, button, card, checkbox, dialog, form, input, label, separator, sheet, skeleton, sonner, tabs, tooltip.

Custom: Avatar, Header, Footer, FriendList, FriendCard, GameLobby, GameWindow, GameInviteToast, LanguagePicker, ThemeToggle, ProfileCard, Shader, TOTPSection.

Whether shadcn-svelte qualifies as "custom-made" is subject to evaluator interpretation. The color palette, typography, icon set, and game-specific theming are custom. The component count (29) exceeds the minimum of 10.

Evidence: `app.css` has 50+ CSS custom properties. `colors.ts` has `syncFromCSS()` linking CSS vars to Phaser colors. `find src/lib/components/ui` returns 16 directories. `find src/lib/components/*.svelte` returns 13 custom components.

Who: pabellis (frontend design, CSS, shader, error pages, UI components), okientzl (mobile adaptation, UX), jaubry-- (theme system, game color sync), amidigov (game color sync, PR #77).

---

### 8. Minor, Support for multiple languages (at least 3) (1 pt)

**Implemented and verified.**

Paraglide JS with 3 languages: English, French, Spanish. 134 translation keys per language, all complete.

`pnpm generate` compiles Paraglide to type-safe message functions in `src/lib/paraglide/messages.ts`. Messages are called as `m.friend_request_received()` or `m.game_invite_accepted({ name })` with parameters. The Paraglide hook in `hooks.server.ts` sets the locale on each request and injects `<html lang="..." dir="...">`. `LanguagePicker.svelte` is the UI switcher. `{#key getReactiveLocale()}` in `+layout.svelte` recreates components on locale change for full reactivity.

All user-facing text is translatable: forms, errors, navigation, settings, legal pages, and in-game text (weapon names, HUD labels, game over messages, chat). Zod validation messages are localized too via `z.config(localeMap[getLocale()]())`.

Evidence: `messages/` has `en.json` (134 keys), `fr.json` (134 keys), `es.json` (134 keys). `package.json` has `@inlang/paraglide-js ^2.15.2`. `hooks.server.ts` has `paraglideMiddleware`. PR #250 added game i18n, PR #255 added the localized GameOver message. PR #160 fixed language refresh, PR #173 fixed responsive friend section footer.

Who: pabellis (frontend i18n, language support, auth error i18n), amidigov (game i18n, GameOver i18n), okientzl (language refresh fix), jaubry-- (Paraglide setup, layout reactivity).

---

### 9. \[TEMP\] Minor, Support for additional browsers (1 pt)

**Implemented, full cross-browser testing pending.**

Firefox compatibility has been explicitly addressed: PR #285 fixed a Firefox-specific console error, PR #283 cleaned up browser-specific console errors, PR #286 fixed WebGL instance cleanup (relevant to Firefox's stricter WebGL context management). The game uses Phaser 4 with WebGL, which is supported in Firefox.

Safari and Edge have not been explicitly tested or documented. No browser-specific limitations are documented in the repository. The general requirement of "no warnings or errors in the browser console" has been actively worked on across multiple PRs.

Evidence: PR #285 `fix(game): firefox console log error 0 fix`, PR #283 `fix(shared): remove some console error`, PR #286 `fix(game): Free the webgl instance`, PR #289 `fix(game): fix ws error when leaving a game`.

Who: amidigov (Firefox fix), tdaclin (console cleanup, WebSocket fix), pabellis (WebGL cleanup).

---

### 10. Major, Standard user management and authentication (2 pts)

**Implemented and verified.**

Better-Auth with the Prisma adapter.

**Signup/login:** registration and login forms with Zod validation. Passwords hashed by Better-Auth. Rate limiting: 100 requests per 60 seconds. Registration validates name (3-32 chars, regex). `hooks.server.ts` redirects unauthenticated users to `/login` (except `/login`, `/register`, `favicon.png`).

**Profile updates:** `settings/+page.server.ts` has 7 form actions: avatar upload (writes to disk, updates `user.image`), name change (validated, unique enforced), password change (requires current password, revokes other sessions).

**Avatar upload:** file written to `static/uploads/`, served via `src/routes/avatar/[id]/+server.ts`. `Avatar.svelte` displays with fallback. PR #258 fixed avatar edge cases.

**Friends and online status:** see Module 3. `StatusRoom` + `statusHub` provide real-time presence. `FriendList.svelte` shows online/offline indicator.

**Profile page:** `src/routes/profile/[id]/+page.server.ts` loads user data, omitting `twoFactorEnabled` and `emailVerified`.

Evidence: `auth.ts` has `betterAuth({ database: prismaAdapter(db, ...), emailAndPassword: { enabled: true }, rateLimit: { enabled: true, window: 60, max: 100 } })`. `settings/+page.server.ts` has the avatar, changeName, changePassword actions. `hooks.server.ts` has `PUBLIC_ROUTES = ['/login', '/register', 'favicon.png']`.

Who: okientzl (Better-Auth setup, password change, TOTP, Google OAuth, rate limiting, avatar edge cases), jaubry-- (settings page, route protection), tdaclin (avatar upload error handling, profile page API), pabellis (registration hardening, settings page frontend).

---

### 11. Minor, OAuth 2.0 remote authentication (1 pt)

**Implemented and verified.**

Google OAuth 2.0 via Better-Auth's social providers.

`auth.ts` has `socialProviders: { google: { clientId: env.GOOGLE_CLIENT_ID!, clientSecret: env.GOOGLE_CLIENT_SECRET! } }`. `login/+page.svelte` has `signInWithGoogle()` calling `authClient.signIn.social({ provider: 'google' })` with a Google logo button. `.env.example` has the Google credential placeholders.

Username collision handling: `auth.ts` `databaseHooks.user.create.before` generates a temporary name (`_tmp_<8-char-uuid>`) when a Google OAuth user's name collides, and `src/routes/setup-username/` lets them choose a permanent name. PR #253.

Evidence: `auth.ts` socialProviders config. `login/+page.svelte` has the `signInWithGoogle` function and Google button. `src/routes/setup-username/` for post-OAuth username setup. PR #139 implemented the Google provider, PR #155 hid TOTP for OAuth accounts, PR #253 handled username collisions.

Who: okientzl (Google OAuth implementation, collision handling, TOTP hiding for OAuth accounts).

---

### 12. Minor, 2FA (Two-Factor Authentication) (1 pt)

**Implemented and verified.**

TOTP 2FA via Better-Auth's `twoFactor` plugin.

Flow: enable (enter password → get TOTP secret + backup codes + QR code) → scan (scan QR with authenticator app) → verify (enter 6-digit code to confirm) → disable (enter password to turn off).

Components: `TOTPSection.svelte` (orchestrates the flow), `TOTPEnable.svelte`, `TOTPScan.svelte`, `TOTPDone.svelte`, `TOTPDisable.svelte`, `schema.ts` (Zod schemas).

Server: `auth.ts` has `twoFactor({ issuer: 'ft_transcendence', TOTPOptions: { window: 1 }, backupCodes: { count: 8, length: 10 } })`. `settings/+page.server.ts` has `enable`, `verify`, `disable` actions calling `auth.api.enableTwoFactor`, `auth.api.verifyTOTP`, `auth.api.disableTwoFactor`.

Prisma `TwoFactor` model: `secret`, `backupCodes`, `userId`, `verified`.

Security: enable and disable both require password. 8 backup codes (10 chars) for recovery. TOTP window of 1 for clock drift. Zod validation on all inputs. Localized error messages.

Evidence: `auth.ts` has the `twoFactor` plugin config. `settings/+page.server.ts` has the three TOTP actions. `prisma/schema.prisma` has the `TwoFactor` model. `package.json` has `qrcode ^1.5.4`. PR #121 added TOTP, PR #287 added auth rate limiting.

Who: okientzl (TOTP implementation, components, rate limiting), jaubry-- (settings page server actions), okientzl (TOTP light-mode contrast fix).

---

### 13. Major, Web-based game (2 pts)

**Implemented and verified.**

Turn-based tank artillery game with Phaser 4 (client) and Colyseus (authoritative server).

**Rules:** two tanks on procedurally generated terrain. Players take turns: aim turret, adjust power, optionally move (fuel-limited to 200 units), select a weapon, fire. Projectile follows ballistic physics (gravity, speed, bounces). Projectiles create craters (destructible terrain) and deal blast damage. Each tank starts at 100 HP. When HP hits 0, the other player wins. Turn timer: 30 seconds. If it runs out, the turn passes. Disconnecting during a game = forfeit.

**7 weapons** (`projectileTypes.ts`): Shell (45 dmg, standard), Heavy (30 dmg, large blast), Bouncer (30 dmg, bounces 2x), Split (30 dmg, splits into 3), Airstrike (calls a strike bomb), Strike Bomb (30 dmg, dropped by airstrike), Sniper (50 dmg, fixed, high precision).

**Server:** `TankRoom.ts`, `maxClients = 2`, `patchRate = 16`. Server runs physics, validates inputs, broadcasts state via `GameRoomState` schema (phase, currentPlayer, projectile, power, weaponIndex, fuel, turnTimeLeft, winner, player names/images). Phase machine: `WAITING` → `READY` → `AIMING` → `OVER`.

**Client:** `GameScene.ts` is the main Phaser scene, split into modules (buttons, effects, hud, server, setup, weaponUI, types). `TankSprite`, `TerrainView`, `ProjectileView`, `ChatInput`, `speechBubble` handle rendering. `GameWindow.svelte` wraps the Phaser canvas. `EventBus.ts` bridges Svelte and Phaser.

**Terrain:** `terrain.ts` has `generateTerrain()`, `getHeightAt()`, `applyCrater()`, heightmap-based with destructible craters.

**Input validation:** `messageSchemas.ts` has Zod schemas for all message types. `validateMessage.ts` wraps handlers with `validated()`. PR #260.

Evidence: `TankRoom.ts` has `maxClients = 2`, `patchRate = 16`, HP system (`t.health = Math.max(0, t.health - dmg)`), win condition, forfeit logic. `projectileTypes.ts` has 7 weapon definitions. `GameScene.ts` is the main scene. `GameRoomState.ts` is the Colyseus schema. `package.json` has `phaser ^4.0.0`. PR #19 was the initial Phaser implementation, PR #56 plugged Colyseus, PR #166 split GameScene into modules.

Who: amidigov (entire game, Phaser implementation, tank/weapon design, aiming, physics, balancing, GameScene architecture, Colyseus auth, message validation, game i18n, initial TankRoom structure).

---

### 14. Major, Remote players (2 pts)

**Implemented and verified.**

Two players on separate computers connect to the same `tank_room` via Colyseus WebSockets and play in real-time. All game state is server-authoritative, the server runs physics, validates inputs, and broadcasts state at 60fps.

**Connection:** Player 1 creates a room via `joinOrCreate('tank_room')` or is invited to a private room. Player 2 joins via `joinById(roomId)` from a game invite or is matched by `joinOrCreate`.

**Disconnection handling:** `TankRoom.ts` calls `allowReconnection(client, 10)`, a disconnected player has 10 seconds to reconnect without forfeiting. `onReconnect` restores their state. `onLeave` has two branches: pre-game (clears the player's slot, lets the other re-queue) and in-game (forfeit, other player wins).

**Client reconnection:** `client.ts` has `reconnectRoom()` that attempts reconnection using a token stored in localStorage. Before calling the Colyseus client SDK, it pre-verifies the room exists via the `/game/check-room-reconnect` endpoint (avoids console errors). Falls back to `joinById` or `joinOrCreate` if reconnection fails.

**Game invites for remote play:** `invite.remote.ts`, `send()` creates a private room via `matchMaker.createRoom('tank_room', { private: true })` and notifies the friend. `accept()` verifies the room still exists via `matchMaker.query({ roomId })`. `deny()` notifies the inviter. `GameInviteToast.svelte` is the custom toast with Accept/Deny buttons.

**UX for remote play:** `GameLobby.svelte`, pre-game lobby with 3-second countdown, searching state, and automatic re-queue (10-second countdown) if the opponent disconnects during the lobby, matching the server's `allowReconnection(10)` window.

Evidence: `TankRoom.ts:208` has `allowReconnection(client, 10)`. `TankRoom.ts:211` has `onReconnect`. `client.ts` has `reconnectRoom()` with localStorage token and `check-room-reconnect` pre-check. `invite.remote.ts` has `matchMaker.createRoom` and `matchMaker.query`. PR #221 added game reconnection, PR #180 added the invitation system, PRs #277, #279, #265 fixed reconnection edge cases.

Who: tdaclin (game reconnection PR #221, invite system wiring PR #180, room destruction PR #259, rejoin index fix PR #279), jaubry-- (check-room endpoints PR #277, matchmaking deadlock fix PR #265, invite notifications PR #188).

---

### 15. Minor, Custom module: Dynamic theme system (1 pt)

**Implemented and verified.**

**Why this module:** a tank game has a lot of visual atmosphere, terrain, projectiles, explosions, HUD, text. Rather than hardcoding colors in the Phaser canvas, we built a system where the entire game's visual identity follows the user's chosen light/dark theme in real-time.

**Technical challenge:** Phaser renders on a WebGL canvas, completely separate from the DOM CSS system. Bridging theme changes between CSS-driven UI and canvas-based game graphics requires reading CSS variables at runtime and syncing them to Phaser color constants.

**Value:** users play in dark mode (neon-on-black, good for low light) or light mode (high contrast, good for bright environments). The entire UI and game canvas transitions together.

**Implementation:**

1. `app.css`, 50+ CSS custom properties: 11 grayscale steps, semantic colors, 19 game-specific variables (`--game-bg`, `--game-terrain`, `--game-neon-glow`, `--game-bar-*`, `--game-fuel-*`, `--game-aiming`, etc.). `.dark` class overrides for dark mode.

2. `shader-theme.ts`, `ShaderTheme = 'dark' | 'light'` store with localStorage persistence and `toggleShaderTheme()`.

3. `ThemeToggle.svelte`, UI toggle button.

4. `colors.ts`, `COLORS` object with 30+ Phaser color constants. `syncFromCSS()` reads CSS variables via `getComputedStyle(document.documentElement).getPropertyValue()` and syncs them to the Phaser colors. Called on theme change (via `MutationObserver` on the `<html>` class in `+page.svelte`) so the game canvas updates in real-time.

Evidence: `app.css` has the full palette. `colors.ts` has `syncFromCSS()` reading 16 CSS variables. `shader-theme.ts` has the store. `+page.svelte` has the `MutationObserver` that calls `syncFromCSS()` on class change. PR #77 synced game colors with frontend, PR #251 fixed light mode contrast.

Who: jaubry-- (theme system architecture, color sync, CSS variables), pabellis (shader implementation, light mode contrast), amidigov (game color sync PR #77).

---

## Resources

### References

- SvelteKit: https://kit.svelte.dev/docs
- Svelte 5 runes: https://svelte.dev/docs/svelte/what-are-runes
- Colyseus: https://docs.colyseus.io/
- Phaser 4: https://phaser.io/learn
- Prisma 7: https://www.prisma.io/docs
- Better-Auth: https://www.better-auth.com/docs
- TailwindCSS 4: https://tailwindcss.com/docs
- shadcn-svelte: https://www.shadcn-svelte.com/docs
- Paraglide JS: https://inlang.com/m/gerre34r
- sveltekit-superforms: https://superforms.rocks/
- Zod 4: https://zod.dev
- Caddy 2: https://caddyserver.com/docs
- Docker Compose: https://docs.docker.com/compose
- Lucide icons: https://lucide.dev
- Inter font: https://rsms.me/inter/

### How AI was used

AI was used as a small helper throughout the project, not to write code for us, but to support us in specific ways:

- **Documentation drafting:** we used AI to help generate initial drafts of documentation, which we then reviewed, corrected against the actual codebase, and rewrote where needed.
- **Gap-knowledge filling:** when we ran into unfamiliar territory (Svelte 5 runes behavior, Colyseus room lifecycle internals, Better-Auth plugin configuration), AI helped fill in the gaps in our knowledge so we could move faster. We always verified what it told us against the actual docs and our code.
- **Mentor and professional insight:** mostly, we used AI as a mentor, asking it to look at our architecture, our workflow, our code production practices, and tell us where we stand on the professionalism spectrum. It gave us insight based on real professional infrastructures and production workflows, which helped us approach what you'd actually see in a professional landscape and context. We used that feedback to improve our conventions, our CI, and our code quality.
- **Translation:** the Spanish translations in `messages/es.json` were produced with AI assistance, then reviewed by team members for accuracy.

Everything AI touched was reviewed, tested, and understood by the team members who integrated it. We take full responsibility for all code in this repository.
