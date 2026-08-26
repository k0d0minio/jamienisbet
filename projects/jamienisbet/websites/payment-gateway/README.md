# Payment Gateway

> **ICM role:** Layer 4 — working (a hosted web app; this README routes into it)
> **Purpose:** Jamie's own Stripe-powered payment surface — where clients pay invoices, deposits, and retainers on-brand.

## What this folder accomplishes
A small Next.js (App Router) app, deployed on Vercel, that takes payments via Stripe. Clients land here from an invoice link (`/pay/<invoice-id>`) to pay a deposit, a milestone, a final invoice, or a monthly retainer. It is Jamie's own site (not a client deliverable), and it looks like the brand because it pulls the same design tokens as every other site — it imports `@jamie-nisbet/ui` and nothing about the brand is forked here.

The amount a client pays **always traces to an existing Stripe invoice** (Stripe is the source of truth, as in [workspaces/finance/](../../workspaces/finance/)). The card form is **Stripe Embedded Checkout**, mounted inside Jamie's branded page — the invoice summary, header, and footer are his; the secure card iframe is Stripe's. No price is invented here.

## How it connects to the architecture
- **Upstream / reads from:** an existing invoice in Stripe (raised via [workspaces/finance/](../../workspaces/finance/)); the bill-from identity in [_config/business/](../../_config/business/).
- **Downstream / feeds:** Stripe (payment capture) and, on payment, the finance ledgers + the invoice `status` (→ `paid`). The repo-side write-back is **deferred behind a reviewed `TODO(send-later)`** in the webhook, per the outbound boundary — a payment is only ever *requested* from a reviewed invoice, never auto-captured against an arbitrary amount.
- **Draws on (Layer 3 reference):** [_config/brand/visual/](../../_config/brand/visual/) (tokens, via the UI package), [_config/brand/voice/](../../_config/brand/voice/) (copy), [_config/conventions/scripts-and-integrations.md](../../_config/conventions/scripts-and-integrations.md) (the Stripe boundary), [_config/conventions/governance.md](../../_config/conventions/governance.md) (secrets).

## Contents
- `app/` — Next.js App Router:
  - `page.tsx` — branded explainer (this surface is reached from a link, not browsed).
  - `pay/[invoice]/page.tsx` — fetches the invoice, renders the branded summary + Embedded Checkout.
  - `pay/[invoice]/return/page.tsx` — post-payment status (retrieves the Checkout Session server-side).
  - `actions/checkout.ts` — server action: creates the embedded Checkout Session from the invoice.
  - `api/webhooks/stripe/route.ts` — verifies the signature, marks the invoice paid, logs; ledger write-back is the reviewed TODO.
- `components/` — shared chrome (header/footer/theme, copied from `sellers-site`), `invoice-summary`, `embedded-checkout`.
- `lib/` — `stripe.ts` (guarded server client), `invoice.ts` (trusted amount source), `demo.ts` (keyless fixture), `site.ts`, `format.ts`.
- Stripe keys live in `.env` / the Vercel env store, never in this folder — see `.env.example`.

## Running it
- **Keyless review:** `pnpm --filter @jamie-nisbet/payment-gateway dev`, then open `/pay/demo`. With no Stripe keys set, a demo invoice renders and the checkout area shows a "demo mode" notice — the brand and layout are fully reviewable.
- **Live test:** copy `.env.example` → `.env`, add Stripe **test** keys, create a test invoice, and run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` for the webhook secret. Visit `/pay/<invoice-id>` and pay with `4242 4242 4242 4242`.

## Notes
- One job: take a payment that traces to a reviewed invoice. No pricing logic is invented here.
- Stack: Next.js App Router on Vercel + Stripe Embedded Checkout. Domains/deploy config come later.
