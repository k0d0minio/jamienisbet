# admin-dashboard (`@jamie-nisbet/admin`)

> **ICM role:** Layer 1 — a web app under [`websites/`](../README.md).
> **Purpose:** The owner-only environment for operating the business off the shared Neon
> database — the read/write surface behind the forms.

## What it is

A Next.js 16 (App Router) app, owner-only, that reads and operates the business data in the
shared Neon Postgres database via [`@jamie-nisbet/services`](../../packages/services/). It is
the counterpart to the public sites: where the portfolio and sellers forms **capture** leads,
the admin is where they **live** and get worked.

**Today:** captured leads — contact submissions and referral leads (with a status pipeline) —
plus a **Stripe billing** surface: a live financial overview (balance, outstanding, recent
payments), invoicing (raise a draft → finalize & send), and shareable payment links.
**Next:** hourly billing and proposal building (added as new sections + tables).

## Stripe billing

The admin talks to Stripe directly via the server-side secret key (`STRIPE_SECRET_KEY`) — this
is owner-only surface, so no publishable key or client SDK is involved. Stripe is the source of
truth for money (as in [`workspaces/finance/`](../../workspaces/finance/)); every figure shown
is read live from Stripe, and nothing about an amount comes from the browser.

- **Finances** (`/finances`) — available + pending balance, total outstanding, and recent payments.
- **Invoices** (`/invoices`) — list every Stripe invoice with status/amount/hosted link, and raise
  a new one. Honoring the repo's *no outbound action without review* rule, a new invoice is created
  as a **draft**; emailing it to the client is a deliberate second step ("Finalize & send").
- **Payment links** (`/payment-links`) — mint a reusable, fixed-amount payment link (copy to share),
  or deactivate one.

With `STRIPE_SECRET_KEY` unset the app still runs: these pages show a "not configured" notice and
the leads surfaces are unaffected. The client-facing pay page lives in
[`websites/payment-gateway`](../payment-gateway/); this admin is where invoices are *raised*.

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
    page.tsx            # dashboard (lead counts + Stripe billing summary)
    leads/contact/      # contact submissions table
    leads/referrals/    # referral leads table + status control
    leads/actions.ts    # updateReferralStatus server action
    finances/           # Stripe financial overview (balance, outstanding, payments)
    invoices/           # Stripe invoice list + create-draft form; actions.ts (send/void)
    payment-links/      # Stripe payment-link list + create form; actions.ts (create/deactivate)
components/             # login form, nav, status select, billing forms + row actions
lib/                    # auth, formatting, stripe client, money, finance reads
```

## Local development

```bash
cp .env.example .env.local   # DATABASE_URL, ADMIN_PASSWORD, ADMIN_SESSION_SECRET, STRIPE_SECRET_KEY (test)
pnpm --filter @jamie-nisbet/admin dev
```

Requires the `biz` schema to exist — run the migration in
[`packages/services`](../../packages/services/) first (`pnpm --filter @jamie-nisbet/services db:migrate`).

## Deploy

Import as a new Vercel project, attach the **same** Neon integration as the other sites (for
`DATABASE_URL`), and set `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, and `STRIPE_SECRET_KEY` (the
same Stripe account the payment-gateway uses). Consumes the shared packages as source
(`transpilePackages` in [`next.config.ts`](next.config.ts)).
