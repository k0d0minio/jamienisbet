# Stub: Deprecate the payment-gateway website

- lane: tweak
- found-by: Jamie, 2026-09-01 (on cutting the brand logo rollout — the pay page is no
  longer necessary)
- priority: P1
- blocked: deferred while `brand-logo-rollout` lands, so the deprecation doesn't collide
  with the shared `packages/ui` logo change; the epic and this stub were cut in the same
  batch and this can be picked up independently.

## What this is

`websites/payment-gateway` is one of the four Vercel projects in this monorepo — the
client-facing `/pay/[invoice]` page built on Stripe Embedded Checkout. Jamie has decided it
is no longer necessary; the deprecation is a separate unit of work from the logo rollout.

## Prompt

You are picking up work in a pnpm monorepo at the repo root `/`. Read this file first.
Deprecate the `websites/payment-gateway` Next.js app from the estate.

Questions to settle before acting (confirm with Jamie where the answer isn't obvious):
whether the Stripe webhook it served is still needed by another project, whether any link
elsewhere in the estate points into it (grep the other `websites/` for `/pay`, `payment-gateway`,
and any invoice URL), and whether its Vercel project should be deleted or just
dormant. `websites/README.md` § Deployment describes the four Vercel projects and Root
Directories — read it so the four-project story is updated to three.

Then remove or retire the app and its references: the `websites/payment-gateway/` directory,
its entry in `websites/README.md` § Deployment, any workspace/`package.json` references,
and its root-directory entry in root `vercel.json` or the Vercel projects. Do not touch
`packages/ui`, `packages/services`, or the other apps except to clean up a pointer. Run no
local build/lint/typecheck — **CI is the source of truth.** This is a code change, so ship
on a `claude/` branch as a PR (not straight to main). When CI is green, close this stub
with `git mv .icm/intake/triage/deprecate-payment-gateway.md
.icm/intake/triage/_done/`.
