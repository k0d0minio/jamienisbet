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
`_system/` edits land on this repo's `main`; they must not trigger four app deploys. Each
`vercel.json` has an `ignoreCommand` of `npx turbo-ignore <workspace name>`, e.g.
`npx turbo-ignore @jamie-nisbet/portfolio`. That is the only reason turbo is in this repo — it
is **not** a build orchestrator or a cache here. CI still builds each app with `pnpm build`.

`turbo-ignore` skips the build unless the push changed that workspace or something it depends on,
reading the answer from the root [`turbo.json`](../turbo.json) `build` task plus each app's own
`package.json` dependencies. **Nothing to maintain by hand:** add `@jamie-nisbet/services` to an
app and that app starts deploying on `packages/services` changes automatically. Two inputs live
outside the dependency graph and are wired explicitly:

- Root `package.json` and `pnpm-workspace.yaml` are listed in `turbo.json`'s
  `globalDependencies`, so touching either rebuilds all four. (`pnpm-lock.yaml` needs no entry —
  turbo diffs the lockfile and rebuilds only the apps whose resolved dependencies actually moved.)
- `.icm/onboarding/` is an input to the **dashboard** only, and turbo cannot see it — it is not a
  package. So that one app chains a second check onto the ignore command:
  `npx turbo-ignore @jamie-nisbet/admin && git diff --quiet ${VERCEL_GIT_PREVIOUS_SHA:-HEAD^} HEAD -- ':(top).icm/onboarding'`.
  `ignoreCommand` exit 0 means *skip*, so the `&&` means both checks must agree to skip and either
  one alone can force the build.

Two properties carried over from the hand-written rule this replaced:

- **It compares against the last *deployed* commit,** not `HEAD^`. On Vercel, `turbo-ignore` uses
  `VERCEL_GIT_PREVIOUS_SHA` (the last successful deployment of this branch); `HEAD^` alone only
  sees the final commit of a multi-commit push, which is how the first version of this rule skipped
  four real deploys.
- **It fails open.** If no previous deployment exists (first deploy of a branch) or that commit is
  unreachable (force push, shallow clone), `turbo-ignore` builds rather than skips — so no
  `--fallback` is set, since supplying one would trade that safety for `HEAD^`. Every other failure
  path — unreadable `turbo.json`, missing workspace, turbo itself erroring — also builds.

## Notes
- Apps are deployed as separate Vercel projects off this monorepo (pnpm workspaces; shared packages ship TS source via `transpilePackages`).
- Client sites are external repos; the delivery link lives on each lead's profile in the admin dashboard.
