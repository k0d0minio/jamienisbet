# admin-dashboard (`@jamie-nisbet/admin`) — "Consultancy JN"

> **ICM role:** Layer 1 — a web app under [`websites/`](../README.md).
> **Purpose:** The owner-only environment for operating the business off the shared Neon
> database — the read/write surface behind the forms.

## What it is

A Next.js 16 (App Router) app, owner-only, that reads and operates the business data in the
shared Neon Postgres database via [`@jamie-nisbet/services`](../../packages/services/). It is
the counterpart to the public sites: where the portfolio and sellers forms **capture** intakes,
the admin is where each becomes a **client** that gets worked.

It is **mobile-first and installable** — branded **Consultancy JN**, it ships a web app
manifest, icons, and a service worker so it can be added to a phone home screen and launched
fullscreen like a native app (see [Mobile & PWA](#mobile--pwa)).

**Today:** a unified **Clients** surface — every portfolio contact and sellers referral is one
client row, opened into a profile (contact details, notes) and moved along an intake → delivery
**status pipeline** (`new` → `contacted` → `qualified` → `proposed` → `won` → `delivered`, or
`lost`) — plus a **Stripe billing** surface: a live financial overview (balance, outstanding,
recent payments), invoicing (raise a draft → finalize & send), and shareable payment links.
**Next:** the per-client pipeline is fleshed out with projects, quotes/proposals, and linked
invoices (added as new sections + tables keyed to `clients`).

## Stripe billing

The admin talks to Stripe directly via the server-side secret key (`STRIPE_SECRET_KEY`) — this
is owner-only surface, so no publishable key or client SDK is involved. Stripe is the source of
truth for money (as in [`workspaces/finance/`](../../workspaces/finance/)); every figure shown
is read live from Stripe, and nothing about an amount comes from the browser.

- **Finances** (`/finances`) — available + pending balance, total outstanding, and recent payments.
- **Invoices** (`/invoices`) — list every Stripe invoice with status/amount/hosted link, and raise
  a new one **against a client picked from the database** (no free-text customer details). Raising
  it resolves — and, first time, creates + links — that client's Stripe customer, storing the id on
  the client row (`clients.stripe_customer_id`) so the two stay joined. Honoring the repo's *no
  outbound action without review* rule, a new invoice is created as a **draft**; emailing it to the
  client is a deliberate second step ("Finalize & send").
- **Payment links** (`/payment-links`) — mint a reusable, fixed-amount payment link (copy to share),
  or deactivate one.

Clients and Stripe customers are kept in sync from here: editing a linked client's name/email/phone
pushes the change to their Stripe customer, and a client can be linked ahead of billing from their
profile page. See [`lib/clients-stripe.ts`](lib/clients-stripe.ts).

With `STRIPE_SECRET_KEY` unset the app still runs: these pages show a "not configured" notice and
the leads surfaces are unaffected. The client-facing pay page lives in
[`websites/payment-gateway`](../payment-gateway/); this admin is where invoices are *raised*.

## Auth

Single owner, single password. `ADMIN_PASSWORD` unlocks the app; a signed (HMAC via
`ADMIN_SESSION_SECRET`) httpOnly session cookie keeps you in. [`proxy.ts`](proxy.ts) gates
every route and bounces unauthenticated requests to `/login`. See [`lib/auth.ts`](lib/auth.ts).

The gate's matcher skips any path containing a `.` (static files), so the PWA assets
(`/manifest.webmanifest`, `/sw.js`, `/offline.html`, `/icon.svg`, `/apple-icon.png`,
`/icon-192.png`, `/icon-512.png`) are all publicly reachable **by design** — a phone must be
able to fetch the manifest and icons to install the app before you sign in. None of them expose
business data.

## Mobile & PWA

The app is built mobile-first and installs to a phone home screen as **Consultancy JN**.

- **Navigation** ([`components/nav.tsx`](components/nav.tsx)) — a sticky top bar (brand + sign
  out) on every size, inline text links on desktop, and a fixed icon **tab bar** pinned to the
  bottom on phones (the primary way to move around when installed). Content is padded to clear
  the tab bar and respects the home-indicator safe area.
- **Manifest** ([`app/manifest.ts`](app/manifest.ts)) — name/short-name `Consultancy JN`,
  `standalone` display, brand-blue theme (`#3A5A78`), and PNG icons.
- **Icons** — one favicon SVG ([`public/icon.svg`](public/icon.svg)) plus PNGs rendered on the
  fly from the JN monogram via `next/og` `ImageResponse` ([`lib/app-icon.tsx`](lib/app-icon.tsx)):
  `/icon-192.png`, `/icon-512.png` (also maskable), and `/apple-icon.png` (180×180 for iOS). No
  build-time image pipeline or committed binaries.
- **Service worker** ([`public/sw.js`](public/sw.js), registered by
  [`components/service-worker-register.tsx`](components/service-worker-register.tsx)) — makes the
  app installable and serves [`public/offline.html`](public/offline.html) for navigations when the
  network is gone. It **does not cache app responses** — this is a live, per-request dashboard, so
  caching authenticated pages would risk stale or wrong-session data.
- Theme colour, standalone launch, and the apple-touch-icon are wired in the root
  [`app/layout.tsx`](app/layout.tsx) (`metadata` + `viewport`).

## Layout

```
app/
  layout.tsx            # root <html> + design-system styles + PWA metadata/viewport + SW register
  manifest.ts           # /manifest.webmanifest (PWA install manifest — "Consultancy JN")
  icon-192.png/         # generated PNG icons (next/og ImageResponse); dotted paths bypass the auth gate
  icon-512.png/
  apple-icon.png/       # 180×180 apple-touch-icon for iOS home screen
  login/                # /login page + login/logout server actions
  (app)/                # authenticated area (route group — no URL segment)
    layout.tsx          # nav chrome (mobile-first spacing + tab-bar clearance)
    page.tsx            # dashboard (client counts + Stripe billing summary)
    clients/            # clients table (list) + status control; actions.ts (status/profile/archive/delete)
    clients/[id]/       # client profile: editable details + notes, read-only intake, pipeline scaffold
    finances/           # Stripe financial overview (balance, outstanding, payments)
    invoices/           # Stripe invoice list + create-draft form; actions.ts (send/void)
    payment-links/      # Stripe payment-link list + create form; actions.ts (create/deactivate)
components/             # login form, nav (top bar + mobile tab bar), service-worker register, billing forms
lib/                    # auth, formatting, stripe client, money, finance reads, app-icon (PNG renderer)
public/                 # icon.svg (favicon), sw.js (service worker), offline.html (offline fallback)
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
