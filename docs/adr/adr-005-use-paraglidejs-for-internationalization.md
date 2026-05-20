# ADR-005 — Use ParaglideJS for Internationalization

| Field   | Value                       |
| ------- | --------------------------- |
| Date    | 2026-05-11                  |
| Status  | Accepted                    |
| Authors | @PabloBellissant, @pabellis |

## Context

Commit `cdcd7f8` added language support, and earlier initialization notes already mentioned including Paraglide in the project setup.
The current codebase contains `messages/en.json`, `messages/es.json`, `messages/fr.json`, and a `generate` script that runs `paraglide-js compile`.

## Decision

We decided to use ParaglideJS for internationalization and message compilation.

## Options Considered

- **ParaglideJS (chosen)** — typed messages, compile step, Svelte-friendly workflow.
- Hand-rolled JSON lookup system — simpler at first, but weaker tooling.
- Another i18n framework — possible, but would have required different conventions.

## Consequences

**Positive**

- Language files became explicit project assets.
- Translation support could be wired into routing and UI early.

**Accepted compromises**

- Message compilation became part of generate/typecheck workflows.
- Generated i18n output had to be excluded from some lint/format steps.

## Links

| Type   | Reference                                           |
| ------ | --------------------------------------------------- |
| Commit | `cdcd7f8 feat(front): add language support`         |
| Docs   | `messages/*.json`, `pnpm exec paraglide-js compile` |
