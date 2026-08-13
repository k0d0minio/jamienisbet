# Websites

> **ICM role:** Layer 1 — router
> **Purpose:** Routes to every web app Jamie hosts under his own roof — portfolio, payment gateway, admin dashboard, and the public sellers site — all sharing one brand identity.

## What this folder accomplishes
This is the home for Jamie's **own** front-facing and internal web apps — four live Next.js (App Router) applications deployed on Vercel. The unifying thread is brand identity: every app consumes the design system from [`packages/ui`](../packages/ui/), so the whole estate looks coherent. **Client websites do not live here** — each client site is its own external repo; the admin dashboard records the link on that lead's `biz.clients` record.

## How it connects to the architecture
- **Upstream / reads from:** [`packages/ui`](../packages/ui/) (design system), [`packages/services`](../packages/services/) (Neon `biz.*` data layer), [`packages/app-shell`](../packages/app-shell/) (marketing-site chrome/i18n).
- **Downstream / feeds:** Vercel deployments; leads into Neon `biz.clients` (portfolio contact form + sellers referral form, each also notifying via Resend); payments via Stripe (payment gateway + admin invoicing).

## Contents
- `portfolio/` — Jamie's public portfolio and proof-of-work showcase. i18n (en/fr/pt), markdown case studies, contact form wired to Neon (`biz.clients`) + Resend.
- `payment-gateway/` — Stripe Embedded Checkout surface where clients pay invoices (`/pay/[invoice]`), with a signature-verified Stripe webhook. Stripe is the invoice source of truth.
- `admin-dashboard/` — **the business cockpit.** Owner-only, password-gated, installable PWA. Four screens, operating the Neon `biz.*` store via [`@jamie-nisbet/services`](../packages/services/): **Leads** (every lead and customer in one staleness-sorted list, with todos and compliance dates folded above it), a **lead's profile** (contact, value, notes, delivery repo, Stripe link), **Tickets** (every active repo's `.icm/intake/` backlog, read-only), and **Money** (Stripe balance, invoices, payment links, payments).
- `sellers-site/` — public affiliate + partner referral intake (the 10% program's front door), wired to Neon + Resend like the portfolio.

## Brand-as-code
Each app consumes the shared design system from [`packages/ui`](../packages/ui/) (`@jamie-nisbet/ui`): import `@jamie-nisbet/ui/styles.css` once at the app root for the tokens + fonts (light + dark via `data-theme`), then compose the exported React primitives (`import { Button, Card } from '@jamie-nisbet/ui'`). One brand change updates every site. No per-app brand overrides.

## Deployment (Vercel)

Four Vercel projects on the **kodominio** team, all off this repo. Each app carries its own
`vercel.json` (framework + skip-build rule); the one setting `vercel.json` cannot express is the
**Root Directory**, so a fresh import needs exactly this mapping (everything else — pnpm
workspace install at the repo root, `next build` — is auto-detected):

| Vercel project | Root Directory | Production domain |
|---|---|---|
| `portfolio` | `websites/portfolio` | `jamienisbet.com` |
| `jamie-nisbet` | `websites/admin-dashboard` | `app.jamienisbet.com` |
| `payment-gateway` | `websites/payment-gateway` | `pay.jamienisbet.com` |
| `client-referrals` | `websites/sellers-site` | `sell.jamienisbet.com` |

Env vars live in each Vercel project (never in git) — each app's README lists what it needs.

**Skipped builds.** Since the 2026-08-12 consolidation, ticket flips in `.icm/intake/` and
`_system/` edits land on this repo's `main` alongside app work, and four Vercel projects watch the
same repo. Skipping is handled by **Vercel's built-in monorepo skipping**, which is on by default
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

### The cost, and it is deliberate

Anything **outside the workspace definition** (`packages/*`, `websites/*`) counts as a global change
and deploys all four apps: `.icm/`, `_system/`, `.claude/`, `.github/`, `CLAUDE.md`, root configs.
Ticket-only commits therefore build all four apps where the old `ignoreCommand` skipped them.

That trade is taken knowingly. Those commits already cost four deployments under either mechanism —
the ignore step never saved the quota, only the build minutes — and app commits, which are the
majority of pushes, now cost one deployment instead of four.

`.icm/onboarding/` needs no special handling as a result. It is an input to the dashboard only
(traced into the bundle by [`next.config.ts`](admin-dashboard/next.config.ts)), it sits outside the
workspace, and a global change redeploys the dashboard along with everything else.

### If deployments still run short

The next lever is preview deployments, which are the bulk of the spend — every branch push costs up
to four. Adding this to an app's `vercel.json` stops that project deploying anything but `main`:

```json
{ "git": { "deploymentEnabled": { "main": true } } }
```

That trades away preview URLs for that app, so apply it per app rather than across the board.

## Notes
- Apps are deployed as separate Vercel projects off this monorepo (pnpm workspaces; shared packages ship TS source via `transpilePackages`).
- Client sites are external repos; the delivery link lives on each lead's profile in the admin dashboard.
