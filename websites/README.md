# Websites

> **ICM role:** Layer 1 — router
> **Purpose:** Routes to every web app Jamie hosts under his own roof — portfolio, admin dashboard, and the public sellers site — all sharing one brand identity.

## What this folder accomplishes
This is the home for Jamie's **own** front-facing and internal web apps — four live Next.js (App Router) applications deployed on Vercel. The unifying thread is brand identity: every app consumes the design system from [`packages/ui`](../packages/ui/), so the whole estate looks coherent. **Client websites do not live here** — each client site is its own external repo; the admin dashboard records the link on that lead's `biz.clients` record.

## How it connects to the architecture
- **Upstream / reads from:** [`packages/ui`](../packages/ui/) (design system), [`packages/services`](../packages/services/) (Neon `biz.*` data layer), [`packages/app-shell`](../packages/app-shell/) (marketing-site chrome/i18n).
- **Downstream / feeds:** Vercel deployments; leads into Neon `biz.clients` (portfolio contact form + sellers referral form, each also notifying via Resend); payments via Stripe (admin invoicing).

## Contents
- `portfolio/` — Jamie's public portfolio and proof-of-work showcase. i18n (en/fr/pt), markdown case studies, contact form wired to Neon (`biz.clients`) + Resend.
- `admin-dashboard/` — **the business cockpit.** Owner-only, password-gated, installable PWA. Four screens, operating the Neon `biz.*` store via [`@jamie-nisbet/services`](../packages/services/): **Leads** (every lead and customer in one staleness-sorted list, with todos and compliance dates folded above it), a **lead's profile** (contact, value, notes, delivery repo, Stripe link), **Tickets** (every active repo's `.icm/intake/` backlog, read-only), and **Money** (Stripe balance, invoices, payment links, payments).
- `sellers-site/` — public affiliate + partner referral intake (the 10% program's front door), wired to Neon + Resend like the portfolio.

## Brand-as-code
Each app consumes the shared design system from [`packages/ui`](../packages/ui/) (`@jamie-nisbet/ui`): import `@jamie-nisbet/ui/styles.css` once at the app root for the tokens + fonts (light + dark via `data-theme`), then compose the exported React primitives (`import { Button, Card } from '@jamie-nisbet/ui'`). One brand change updates every site. No per-app brand overrides.

## Deployment (Vercel)

Three Vercel projects on the **kodominio** team, all off this repo. Each app carries its own
`vercel.json` (framework + skip-build rule); the one setting `vercel.json` cannot express is the
**Root Directory**, so a fresh import needs exactly this mapping (everything else — pnpm
workspace install at the repo root, `next build` — is auto-detected):

| Vercel project | Root Directory | Production domain |
|---|---|---|
| `portfolio` | `websites/portfolio` | `jamienisbet.com` |
| `jamie-nisbet` | `websites/admin-dashboard` | `app.jamienisbet.com` |
| `client-referrals` | `websites/sellers-site` | `sell.jamienisbet.com` |

Env vars live in each Vercel project (never in git) — each app's README lists what it needs.

**Skipped builds.** Ticket flips in `.icm/intake/` land on this repo's `main` alongside app work,
and three Vercel projects watch the same repo. (Estate-control edits no longer do: `_system/` and the
three commands left for `k0d0minio/icm-board` on 2026-08-26, which removed a whole class of
global-change commit from this repo.) Skipping is handled by **Vercel's built-in monorepo skipping**, which is on by default
and needs no configuration — there is deliberately no `ignoreCommand` in any `vercel.json`.

Vercel reads the pnpm workspace graph and deploys a project only when its own source changed, one
of its internal `package.json` dependencies changed, or a lockfile change affects its dependencies.
**Nothing to maintain by hand:** add `@jamie-nisbet/services` to an app and that app starts
deploying on `packages/services` changes automatically.

### Why not an ignoreCommand

Because on the free tier the scarce resource is the **100 deployments per day** cap, and the two
mechanisms differ in exactly that respect:

- An **Ignored Build Step** runs *after* Vercel creates the deployment. The build is skipped, but
  per Vercel's docs the cancelled deployment still "count[s] towards your deployment and concurrent
  build limits". Four projects means four deployments per push, always.
- **Built-in skipping** decides *before* a deployment exists. An unaffected project gets no
  deployment at all, so it costs nothing against the cap.

So a portfolio-only commit costs one deployment instead of four. This is also Vercel's own
recommendation for "monorepos with many projects", and `turbo-ignore` — which this repo used
between JN-013 and JN-014 — is deprecated in favour of it.

**There is no turbo in this repo.** It was only ever here to run `turbo-ignore`, never as a build
orchestrator or a cache, so JN-014 removed the dependency and `turbo.json` along with the ignore
commands. CI builds each app with `pnpm build`; Vercel builds each app with `next build` from its
own Root Directory.

### The cost, and it is deliberate

Anything **outside the workspace definition** (`packages/*`, `websites/*`) counts as a global change
and deploys all three apps: `.icm/`, `.claude/`, `.github/`, `AGENTS.md`/`CLAUDE.md`, root configs. Ticket-only
commits therefore build all three apps where the old `ignoreCommand` skipped them.

That trade is taken knowingly. Those commits already cost three deployments under either mechanism —
the ignore step never saved the quota, only the build minutes — and app commits, which are the
majority of pushes, now cost one deployment instead of three.

`.icm/onboarding/` needs no special handling as a result. It is an input to the dashboard only
(traced into the bundle by [`next.config.ts`](admin-dashboard/next.config.ts)), it sits outside the
workspace, and a global change redeploys the dashboard along with everything else.

### Preview deployments are off for one app

Previews are the bulk of the spend — every branch push otherwise costs up to three
deployments. `sellers-site` is rarely worth a preview URL, so it
opts out of everything except `main` in its own `vercel.json`:

```json
{ "git": { "deploymentEnabled": { "*": false, "**": false, "main": true } } }
```

Branch keys are [minimatch](https://github.com/isaacs/minimatch) patterns and **unspecified
branches default to `true`**, so the denial has to be explicit — `{ "main": true }` alone is
a no-op. `*` covers flat names like `chore-x`, `**` covers slashed ones like `claude/x`, and
`main` wins over both because a branch matching several rules deploys if *any* of them is
`true`.

`portfolio` and `admin-dashboard` keep previews: they are the two whose UIs are worth looking
at before merge. Extend the pattern to them only if the daily cap starts biting again.

## Notes
- Apps are deployed as separate Vercel projects off this monorepo (pnpm workspaces; shared packages ship TS source via `transpilePackages`).
- Client sites are external repos; the delivery link lives on each lead's profile in the admin dashboard.
