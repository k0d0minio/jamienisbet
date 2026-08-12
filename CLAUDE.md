# CLAUDE.md — Layer 0: Repository Identity & Routing

> This is the **first file any Claude session reads.** It says what this repo is and where
> to go for a given task. Keep it short; detail lives in each folder's own `README.md`.

## What this repo is

The personal web estate of **Jamie Nisbet** — a software engineer / AI consultant based in
Mafra, Portugal. Deliberately small: a pnpm monorepo with **four apps and three shared
packages**, nothing more.

- **[`websites/portfolio/`](websites/portfolio/)** — the public portfolio (i18n, markdown
  case studies, contact form → Neon `biz.clients` + Resend).
- **[`websites/admin-dashboard/`](websites/admin-dashboard/)** — the owner-only cockpit.
  Four screens: *Leads*, a *lead's profile*, *Tickets* (every active repo's `.icm/intake/`
  backlog in one read-only board), and *Money* (Stripe). Business state lives in **one**
  store — the Neon `biz.*` schema — operated through the dashboard, never mirrored into git.
- **[`websites/payment-gateway/`](websites/payment-gateway/)** — the client-facing pay page
  (`/pay/[invoice]`, Stripe Embedded Checkout + signature-verified webhook).
- **[`websites/sellers-site/`](websites/sellers-site/)** — the affiliate program's public
  front door (referral intake → Neon + Resend).
- **[`packages/`](packages/)** — `ui` (the design system; **the** brand source of truth,
  human guide in [`packages/ui/BRAND.md`](packages/ui/BRAND.md)) · `app-shell`
  (marketing-site chrome/i18n) · `services` (Neon `biz.*` data layer).

This repo used to carry a full ICM business factory (`_config/`, `shared/`, `workspaces/`).
That ambition was retired in 2026-08 — history and rationale in
[`.icm/docs/decisions.md`](.icm/docs/decisions.md) and
[`.icm/docs/founder-brief.md`](.icm/docs/founder-brief.md). Don't recreate it.

## Routing — "if the task is… → go to…"

| The task | Go to |
|---|---|
| Change the portfolio (content, case studies, contact form) | [`websites/portfolio/`](websites/portfolio/) |
| Change the admin cockpit (Leads, Tickets, Money) | [`websites/admin-dashboard/`](websites/admin-dashboard/) |
| Change how clients pay an invoice | [`websites/payment-gateway/`](websites/payment-gateway/) |
| Change the affiliate/referral intake | [`websites/sellers-site/`](websites/sellers-site/) |
| Brand colours, tokens, components, voice | [`packages/ui/`](packages/ui/) + [`packages/ui/BRAND.md`](packages/ui/BRAND.md) |
| Data model / queries (`biz.*`) | [`packages/services/`](packages/services/) |
| Plan or track engineering work on this repo | one markdown ticket per task in [`.icm/intake/`](.icm/intake/) (estate spec: `_system/TICKETS-SPEC.md` beside this repo) |
| Customer questionnaires / onboarding forms (questions only — answers live in Neon) | [`.icm/onboarding/`](.icm/onboarding/) (convention in its README) |
| Engineering work in the other repos | each repo's own `.icm/intake/`; viewed on the dashboard's Tickets screen — read-only there |
| Daily business todos / compliance deadlines | the working-list strip on the dashboard's Leads screen (`biz.tasks` + `biz.compliance_dates`) |

## Standing rules (do not break these)

- **Brand is one source of truth** — [`packages/ui`](packages/ui/) (tokens + components +
  assets + `BRAND.md`). Websites consume the package; never fork tokens per site.
- **Planning is tickets.** Any plan, backlog, or task list becomes markdown tickets in
  `.icm/intake/` (`JN-NNN-slug.md`) — never a loose `TODO.md`/`BACKLOG.md` at the root.
- **No outbound action without review.** Invoices are raised as drafts; finalizing and
  emailing is a separate, deliberate click. Outreach email is composed and sent by a human.
- **CI is the source of truth.** Never run `build`/`lint`/`typecheck` locally; push and read
  the checks.
