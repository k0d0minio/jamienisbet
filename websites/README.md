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

## Notes
- Apps are deployed as separate Vercel projects off this monorepo (pnpm workspaces; shared packages ship TS source via `transpilePackages`).
- Client sites are external repos; the delivery link lives on each lead's profile in the admin dashboard.
