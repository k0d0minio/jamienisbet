# Payment Gateway

> **ICM role:** Layer 4 — working (a hosted web app; this README routes into it)
> **Purpose:** Jamie's own Stripe-powered payment surface — where clients pay invoices, deposits, and retainers on-brand.

## What this folder accomplishes
A small Next.js (App Router) app, deployed on Vercel, that takes payments via Stripe. Clients land here from an invoice link to pay a deposit, a milestone, a final invoice, or a monthly retainer. It is Jamie's own site (not a client deliverable), and it looks like the brand because it pulls the same design tokens as every other site. This folder is the skeleton — intent, not code.

## How it connects to the architecture
- **Upstream / reads from:** an invoice/payment request raised in [workspaces/finance/](../../workspaces/finance/); the bill-from identity in [_config/business/](../../_config/business/).
- **Downstream / feeds:** Stripe (payment capture) and, on payment, the finance ledgers + the invoice `status` (-> `paid`). Per the outbound boundary, a payment is only ever *requested* from a reviewed invoice — never auto-captured without that file.
- **Draws on (Layer 3 reference):** [_config/brand/visual/](../../_config/brand/visual/) (tokens), [_config/brand/voice/](../../_config/brand/voice/) (copy), [_config/conventions/scripts-and-integrations.md](../../_config/conventions/scripts-and-integrations.md) (the Stripe boundary), [_config/conventions/governance.md](../../_config/conventions/governance.md) (secrets).

## Contents
- `app/` — (planned) Next.js App Router pages: a checkout/payment page, success/cancel.
- `theme.config` — (planned) imports brand tokens from `_config/brand/visual/`.
- Stripe keys live in `.env` / the Vercel env store, never in this folder.

## Notes
- One job: take a payment that traces to a reviewed invoice. No pricing logic is invented here.
- Stack intent: Next.js App Router on Vercel + Stripe. Domains/deploy come later — skeleton only.
