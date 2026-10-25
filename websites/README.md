# Websites

> **ICM role:** Layer 1 — router
> **Purpose:** Routes to the one web app Jamie hosts under his own roof — the portfolio.

## What this folder accomplishes
This is the home for Jamie's **own** front-facing web app — one live Next.js (App Router) application deployed on Vercel. It consumes the design system from [`packages/ui`](../packages/ui/). **Client websites do not live here** — each client site is its own external repo.

## How it connects to the architecture
- **Upstream / reads from:** [`packages/ui`](../packages/ui/) (design system), [`packages/app-shell`](../packages/app-shell/) (marketing-site chrome/i18n).
- **Downstream / feeds:** Vercel deployments; leads into the desk's pool (the portfolio contact form, which also notifies via Resend).

## Contents
- `portfolio/` — Jamie's public portfolio and proof-of-work showcase. i18n (en/fr/pt), markdown case studies, contact form wired to the desk's pool API + Resend.

## Brand-as-code
The app consumes the shared design system from [`packages/ui`](../packages/ui/) (`@jamie-nisbet/ui`): import `@jamie-nisbet/ui/styles.css` once at the app root for the tokens + fonts (light + dark via `data-theme`), then compose the exported React primitives (`import { Button, Card } from '@jamie-nisbet/ui'`). No per-app brand overrides.

## Deployment (Vercel)

One Vercel project on the **kodominio** team, off this repo. The app carries its own
`vercel.json` (framework + skip-build rule); the one setting `vercel.json` cannot express is the
**Root Directory**, so a fresh import needs exactly this mapping (everything else — pnpm
workspace install at the repo root, `next build` — is auto-detected):

| Vercel project | Root Directory | Production domain |
|---|---|---|
| `portfolio` | `websites/portfolio` | `jamienisbet.com` |

Env vars live in the Vercel project (never in git) — the app's README lists what it needs.

**Skipped builds.** Vercel's built-in monorepo skipping is on by default and needs no
configuration — there is deliberately no `ignoreCommand` in `vercel.json`. Vercel reads the pnpm
workspace graph and deploys the portfolio only when its own source, one of its internal
`package.json` dependencies, or a lockfile change that affects it changed. Anything outside the
workspace definition (`packages/*`, `websites/*`) counts as a global change and deploys it:
`.icm/`, `.claude/`, `.github/`, `AGENTS.md`/`CLAUDE.md`, root configs. An Ignored Build Step
would not save quota: per Vercel's docs the cancelled deployment still counts towards the
**100 deployments per day** cap.

**There is no turbo in this repo.** JN-014 removed it along with the ignore commands.

### Turning previews off for an app

Previews are the bulk of the spend — every branch push costs a deployment. The portfolio
keeps previews today: its UI is worth looking at before merge. If the daily cap starts
biting again, it opts out of everything except `main` in its own `vercel.json`:

```json
{ "git": { "deploymentEnabled": { "*": false, "**": false, "main": true } } }
```

Branch keys are [minimatch](https://github.com/isaacs/minimatch) patterns and **unspecified
branches default to `true`**, so the denial has to be explicit — `{ "main": true }` alone is
a no-op. `*` covers flat names like `chore-x`, `**` covers slashed ones like `claude/x`, and
`main` wins over both because a branch matching several rules deploys if *any* of them is
`true`.

## Notes
- The app is deployed as one Vercel project off this monorepo (pnpm workspaces; shared packages ship TS source via `transpilePackages`).
- Client sites are external repos.
