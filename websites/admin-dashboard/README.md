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
recent payments), invoicing (raise a draft → finalize & send), and shareable payment links —
plus the **lead pipeline** (below): per-client deals worked in exactly three steps.

Each client profile also carries a **delivery repo** link ([`lib/github.ts`](lib/github.ts),
[`components/client-repo-link.tsx`](components/client-repo-link.tsx)): when a client comes in,
connect an existing GitHub repo or create a fresh one right there. Once connected, the pipeline's
AI runs load a bounded **snapshot** of it (README, file tree, stack) as Layer-4 working material,
so the brainstorm, pitch, and proposal are grounded in the client's actual codebase rather than a
greenfield guess. The repo is stored on the client row (`clients.github_repo`), mirroring the prose
pointer in `shared/clients/<slug>/repo-link.md`. Needs `GITHUB_TOKEN` (see [`.env.example`](.env.example));
with it unset the profile shows a "not configured" note and the rest of the admin is unaffected.

## The lead pipeline — three steps, one deal

Each client carries **deals** (one per opportunity). A deal's page is one pipeline that mirrors
how Jamie actually closes work — no other workflows to learn:

1. **Brainstorm & pitch** — a persisted, per-deal chat with a **web-connected research
   partner** (a `webResearch` tool runs deep research on a natively search-connected model —
   Perplexity Sonar via the same AI Gateway — and returns findings with sources). When the
   direction is right, **Draft pitch** turns the thread into the meeting-prep pitch document:
   the ask, the research, solution directions with effort bands, the questions to ask over
   coffee, and the recommended angle.
2. **Proposal** — after the meeting, write down what was agreed (plan, timeline, and the
   **payment structure** as milestone rows) and draft the proposal: cost, business
   requirements, technical requirements, basic terms, and the "how we work together"
   communication brief that keeps scope creep out. The milestones are stored structured on the
   deal (`deals.payment_schedule`) and set the deal's value — the document and the billing can
   never say different things.
3. **Get paid** — once the proposal is **approved**, each milestone gets a **Create draft
   invoice** button on the existing Stripe rails (draft → finalize & send from Invoices, never
   sent automatically). The raised invoice's id is linked back to its milestone and its live
   Stripe status shows in place.

Two document kinds exist (**pitch**, **proposal** — see
[`@jamie-nisbet/icm`](../../packages/icm/), which loads exactly the Layer-3 reference files
each kind names, through the **Vercel AI Gateway**). Every output lands as a versioned
**draft** that Jamie reviews, edits, and approves in place:

- **Review gate** — `draft → approved | rejected` on every document. Only an approved proposal
  unlocks invoicing; only approved documents can be exported/downloaded or **repo-synced**
  (approval commits the artifact to `shared/clients/<slug>/documents/` via the GitHub API,
  keeping the repo the canonical business record).
- **Provenance** — every run records model, context files, and token usage; a **Next action**
  card says which of the three steps the deal is at.

With `AI_GATEWAY_API_KEY` unset the AI routes return a "not configured" response and the rest
of the admin still works; with `GITHUB_TOKEN`/`GITHUB_REPO` unset, approval works and sync is
skipped. Models are swappable per tier via `AI_MODEL_HEAVY/STANDARD/FAST`, and the research
tool's model via `AI_MODEL_RESEARCH` (see [`.env.example`](.env.example)).

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
    clients/[id]/       # client profile: editable details + notes, delivery-repo link, read-only intake, deals rail
    deals/              # actions.ts (deal CRUD, document review gate, brainstorm, milestone→draft invoice)
    deals/[id]/         # the 3-step deal pipeline: next action, brainstorm & pitch, proposal, get paid, documents
    deals/[id]/documents/[docId]/  # review surface: edit/approve/reject, versions, provenance, sync
    finances/           # Stripe financial overview (balance, outstanding, payments)
    invoices/           # Stripe invoice list + create-draft form; actions.ts (send/void)
    payment-links/      # Stripe payment-link list + create form; actions.ts (create/deactivate)
  api/ai/               # the pipeline's AI (brainstorm/pitch/proposal) — session-checked, gateway-backed
  api/documents/[id]/export/  # download an APPROVED document (never drafts)
components/             # login form, nav (top bar + mobile tab bar), service-worker register, billing + pipeline UI
lib/                    # auth, api-auth, formatting, stripe client, money, finance reads, deal context (Layer-4
                        # assembly), next-action, repo-sync, github (client delivery repos), kinds, app-icon
public/                 # icon.svg (favicon), sw.js (service worker), offline.html (offline fallback)
```

## Local development

```bash
cp .env.example .env.local   # DATABASE_URL, ADMIN_PASSWORD, ADMIN_SESSION_SECRET, STRIPE_SECRET_KEY (test), AI_GATEWAY_API_KEY
pnpm --filter @jamie-nisbet/admin dev
```

Requires the `biz` schema to exist — run the migration in
[`packages/services`](../../packages/services/) first (`pnpm --filter @jamie-nisbet/services db:migrate`).

## Deploy

Import as a new Vercel project, attach the **same** Neon integration as the other sites (for
`DATABASE_URL`), and set `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `STRIPE_SECRET_KEY` (the
same Stripe account the payment-gateway uses), `AI_GATEWAY_API_KEY`, and optionally
`GITHUB_TOKEN`/`GITHUB_REPO` for the approval sync-back **and** the client delivery-repo
connect/create/analysis (plus `GITHUB_REPO_OWNER` to home new client repos under a specific
user/org). Consumes the shared packages as source (`transpilePackages` in
[`next.config.ts`](next.config.ts)).
