# admin-dashboard (`@jamie-nisbet/admin`)

> **ICM role:** Layer 1 — a web app under [`websites/`](../README.md).
> **Purpose:** The owner-only environment for operating the business off the shared Neon
> database — the read/write surface behind the forms.

## What it is

A Next.js 16 (App Router) app, owner-only, that reads and operates the business data in the
shared Neon Postgres database via [`@jamie-nisbet/services`](../../packages/services/). It is
the counterpart to the public sites: where the portfolio and sellers forms **capture** leads,
the admin is where they **live** and get worked.

**Today:** captured leads — contact submissions and referral leads (with a status pipeline).
**Next:** hourly billing, Stripe invoicing, proposal building (added as new sections + tables).

## Auth

Single owner, single password. `ADMIN_PASSWORD` unlocks the app; a signed (HMAC via
`ADMIN_SESSION_SECRET`) httpOnly session cookie keeps you in. [`proxy.ts`](proxy.ts) gates
every route and bounces unauthenticated requests to `/login`. See [`lib/auth.ts`](lib/auth.ts).

## Layout

```
app/
  layout.tsx            # root <html> + design-system styles
  login/                # /login page + login/logout server actions
  (app)/                # authenticated area (route group — no URL segment)
    layout.tsx          # nav chrome
    page.tsx            # dashboard (counts + latest)
    leads/contact/      # contact submissions table
    leads/referrals/    # referral leads table + status control
    leads/actions.ts    # updateReferralStatus server action
components/             # login form, nav, status select
lib/                    # auth, formatting
```

## Local development

```bash
cp .env.example .env.local   # fill DATABASE_URL, ADMIN_PASSWORD, ADMIN_SESSION_SECRET
pnpm --filter @jamie-nisbet/admin dev
```

Requires the `biz` schema to exist — run the migration in
[`packages/services`](../../packages/services/) first (`pnpm --filter @jamie-nisbet/services db:migrate`).

## Deploy

Import as a new Vercel project, attach the **same** Neon integration as the other sites (for
`DATABASE_URL`), and set `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET`. Consumes the shared
packages as source (`transpilePackages` in [`next.config.ts`](next.config.ts)).
