# admin-dashboard (`@jamie-nisbet/admin`) — "Consultancy JN"

> **ICM role:** Layer 1 — a web app under [`websites/`](../README.md).
> **Purpose:** Somewhere to track leads and customers, and to get paid. Nothing else.

## What it is

A Next.js 16 (App Router) app, owner-only, that reads and operates the business data in the
shared Neon Postgres database via [`@jamie-nisbet/services`](../../packages/services/). It is
the counterpart to the public sites: where the portfolio and sellers forms **capture** intakes,
the admin is where each becomes a lead that gets worked.

It is **mobile-first and installable** — branded **Consultancy JN**, it ships a web app
manifest, icons, and a service worker so it can be added to a phone home screen and launched
fullscreen like a native app (see [Mobile & PWA](#mobile--pwa)).

**Three screens.** That is the whole app, and it is deliberate — see
[Deliberately not here](#deliberately-not-here).

| Screen | Route | What it is |
|---|---|---|
| **Leads** | `/` | Every lead and customer in one list, longest-waiting first. |
| **Lead** | `/leads/<id>` | One person's profile: contact, value, notes, repo, Stripe link, todos. |
| **Money** | `/money` | Stripe: balance, invoices, payment links, recent payments. |

## Leads — the screen the app opens on

One row per person. A portfolio contact enquiry, a sellers-site referral, and someone met at a
meetup are all the same kind of record; `source` is the only thing that tells them apart. There
is no second table for opportunities — a lead who comes back for more work is still the same
relationship, and what was actually billed lives in Stripe.

- **Sorted by who has waited longest.** The list orders on
  `coalesce(last_touched_at, created_at)` ascending, so the page opens on the work rather than
  on the newest arrival. Anything open and untouched for 7+ days is flagged in red. Changing a
  status, editing a profile, or hitting **Mark touched** all stamp the row and drop it back down
  the list.
- **Filters** — All / Open / Customers / Lost, each with a count, in a rail that scrolls
  sideways on a phone rather than wrapping onto a second line. The **Archived** view is a switch
  beside the page title, not another chip — it changes what you are looking at rather than
  filtering it. Status itself is a dropdown on every row, changed in place.
- **On a phone, a row is one tap target.** The whole card opens the lead; the strip underneath
  holds only what is worth doing without opening them — change status, call, email. Archive and
  delete are deliberately absent there (they live on the lead's own page, one tap away), except
  in the archive, where restoring is the point. The wide table is the desktop view of the same
  list, not the source the phone shrinks down from.
- **Value** — each lead carries what it is worth (`value_minor`) and whether that is a one-off
  or charged **every month** (`billing_type`). The header adds them up: open one-offs as
  *in play*, monthly customers as */ month*. Both are Jamie's own figures — Stripe stays the
  authority on what was actually invoiced and paid.
- **Add lead / add customer** — leads mostly arrive by word of mouth, so adding someone by hand
  is a first-class button, not an afterthought: a floating button in the thumb zone above the tab
  bar on a phone (opening the form as a bottom sheet), an ordinary button beside the heading on
  desktop. The public contact form is one way in, not the only one. Because a lead and a customer
  are the same row, the sheet opens on a **Lead / Customer** choice, which is all that sets
  `status` — `new` or `won`. A lead needs only a name; a customer also gets **Value** and
  **Billed**, so entering one who has been paying since before this dashboard existed doesn't
  leave the recurring-revenue total understated from the moment they're added. The free-text box
  follows the same split: a lead's words are intake (`intake_message`), a customer's are working
  notes (`notes`). Anywhere else along the pipeline — contacted, proposed, delivered, lost — is
  the status dropdown on the row itself.
- **The working list** — todos and Portuguese compliance dates live in a strip above the list,
  collapsed by default (a native `<details>`, so it costs no JavaScript). The summary line says
  whether anything is overdue; that is all it needs to say on a normal day. Compliance rows are
  **decision-support only** and need the contabilista's confirmation.

A lead's own page adds the read-only intake provenance (how they came in, what they asked for),
their **delivery repo**, their **Stripe customer**, and the todos filed against them. It is
ordered by what you actually do on a phone: reach them (call / email / mark touched, as a rail
of real buttons), move their status, then the profile and their todos. Reference material and
irreversible actions sink to the bottom — **Intake** folds into a tap-to-open `<details>` below
`lg`, connecting a delivery repo folds away until asked for, and archive/delete live in a
**Danger zone** card rather than beside the title where a thumb could find them.

### Delivery repos

Each lead can carry a GitHub delivery repository ([`lib/github.ts`](lib/github.ts),
[`components/client-repo-link.tsx`](components/client-repo-link.tsx)): connect an existing repo
or create a fresh one from the profile. The pointer is stored on the row
(`clients.github_repo`) so the dashboard always knows where a customer's work lives. Needs
`GITHUB_TOKEN` (see [`.env.example`](.env.example)); with it unset the profile shows a "not
configured" note and the rest of the admin is unaffected.

## Money

The admin talks to Stripe directly via the server-side secret key (`STRIPE_SECRET_KEY`) — this
is owner-only surface, so no publishable key or client SDK is involved. Stripe is the source of
truth for money (as in [`workspaces/finance/`](../../workspaces/finance/)); every figure shown
is read live from Stripe, and nothing about an amount comes from the browser. One page, four
sections:

- **Balance** — available, pending, and total outstanding across open invoices.
- **Invoices** — every Stripe invoice with status/amount/hosted link, and a form to raise a new
  one **against a lead picked from the database** (no free-text customer details). Raising it
  resolves — and, first time, creates + links — that lead's Stripe customer, storing the id on
  the row (`clients.stripe_customer_id`) so the two stay joined. Honoring the repo's *no
  outbound action without review* rule, a new invoice is created as a **draft**; emailing it is
  a deliberate second step ("Finalize & send").
- **Payment links** — mint a reusable, fixed-amount payment link (copy to share), or deactivate one.
- **Recent payments** — what actually landed.

Leads and Stripe customers are kept in sync from here: editing a linked lead's name/email/phone
pushes the change to their Stripe customer, and a lead can be linked ahead of billing from their
profile. See [`lib/clients-stripe.ts`](lib/clients-stripe.ts).

With `STRIPE_SECRET_KEY` unset the app still runs: this page shows a "not configured" notice and
the Leads screen is unaffected. The client-facing pay page lives in
[`websites/payment-gateway`](../payment-gateway/); this admin is where invoices are *raised*.

## Deliberately not here

The dashboard used to run a three-step AI deal pipeline (brainstorm with web research → pitch →
proposal → milestone invoicing), with versioned review-gated documents, AI provenance and spend
tracking, draft-only outreach composition, and a won-deal onboarding checklist — around 14
screens in total. It was removed in favour of the three above: too much machinery for a
one-person consultancy whose actual need is knowing who is waiting to hear back.

Gone with it: the `deals`, `documents`, `generations`, `touches` and `workshop_messages` tables,
the `app/api/ai/*` routes, and the `@jamie-nisbet/icm` package (its only consumer was those
routes). The markdown factory those runs read — `_config/`, `shared/templates/`,
`workspaces/*/stages/` — is untouched and still drives workspace runs done by agents directly.

If any of it comes back, it should come back as a workspace run producing a reviewed file, not
as another screen here.

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
  out) on every size, inline text links on desktop, and a fixed two-tab bar pinned to the bottom
  on phones (Leads, Money). Each tab is a full 3.5rem target; content is padded to clear the bar
  and respects the home-indicator safe area.
- **Touch targets and safe areas** ([`app/globals.css`](app/globals.css)) — the design system is
  sized for a mouse (h-8/h-9 controls, a 16px checkbox), so rather than annotate every call site
  the floor is lifted once under `@media (pointer: coarse)`: every button, input and select
  trigger gets a 44px minimum, and the checkbox grows a transparent hit area without changing
  size. Nothing there affects a desktop pointer. The same file defines the `pb-safe`,
  `bottom-above-tabs` and `no-scrollbar` utilities the fixed chrome and the horizontal rails use.
- **Anything hover-only is a bug on a phone.** Row deletes in the todo and compliance lists are
  always visible below `sm` and only fade in on hover from `sm` up.
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
  globals.css           # design-system link + phone plumbing (safe areas, coarse-pointer targets)
  layout.tsx            # root <html> + design-system styles + PWA metadata/viewport + SW register
  manifest.ts           # /manifest.webmanifest (PWA install manifest — "Consultancy JN")
  icon-192.png/         # generated PNG icons (next/og ImageResponse); dotted paths bypass the auth gate
  icon-512.png/
  apple-icon.png/       # 180×180 apple-touch-icon for iOS home screen
  login/                # /login page + login/logout server actions
  (app)/                # authenticated area (route group — no URL segment)
    layout.tsx          # nav chrome (mobile-first spacing + tab-bar clearance)
    page.tsx            # Leads — the list, staleness-sorted, with the collapsed working list
    actions.ts          # lead + todo + compliance server actions (both lead screens use these)
    leads/[id]/         # one lead: profile, intake, delivery repo, Stripe link, their todos
    money/              # Stripe: balance, invoices, payment links, payments; actions.ts alongside
components/             # login form, nav, service-worker register, lead + money UI
                        #   chip.tsx     — filter/view chips (finger-sized, rail-friendly)
                        #   fold-card.tsx — a card that folds into <details> below `lg`
                        #   client-create-form.tsx — add a lead or a customer by hand
lib/                    # auth, formatting, stripe client, money, finance reads, github, app-icon
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
`DATABASE_URL`), and set `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `STRIPE_SECRET_KEY` (the
same Stripe account the payment-gateway uses), and optionally `GITHUB_TOKEN` for the delivery-repo
connect/create (plus `GITHUB_REPO_OWNER` to home new client repos under a specific user/org).
Consumes the shared packages as source (`transpilePackages` in [`next.config.ts`](next.config.ts)).
