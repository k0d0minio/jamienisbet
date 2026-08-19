# CLAUDE.md — Layer 0: Repository Identity & Routing

> This is the **first file any Claude session reads.** It says what this repo is and where
> to go for a given task. Keep it short; detail lives in each folder's own `README.md`.

## What this repo is

The personal web estate **and** the estate control layer of **Jamie Nisbet** — a software
engineer / AI consultant based in Mafra, Portugal. Two halves, one repo (consolidated
2026-08-12, formerly split with `k0d0minio/apps-estate`, now archived):

**The product** — a pnpm monorepo, deliberately small: four apps + three shared packages.

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

**The control layer** — `_system/` (contracts, estate scripts, audit) and this
repo's `.claude/` (three commands, two agents, session hook). It operates on the client repos in
**[`projects/`](projects/)** — separate git repos, deliberately **gitignored here**
(the `/projects/` line is the mechanism; never loosen it). They exist only on this
machine: cloud sessions see the product + control layer, and the estate scripts find
only this repo.

This repo used to carry a full ICM business factory; that ambition was retired 2026-08 —
see [`.icm/docs/decisions.md`](.icm/docs/decisions.md). Don't recreate it. The control
layer is lean rules, not a factory.

## Routing — "if the task is… → go to…"

| The task | Go to |
|---|---|
| Adopt a repo · work out what to build · cut a sprint's tickets | **`/project <repo>`** — idempotent, re-run it freely ([`.claude/commands/`](.claude/commands/)) |
| Pick today's ≤3 · reconcile the board · end a session | **`/day [wrap]`** |
| What a project is *for* — intent, business logic, features, decisions | that repo's `.icm/project.md` ([`_system/contracts/PROJECT.md`](_system/contracts/PROJECT.md)) |
| Ticket standard (all repos' `.icm/intake/`) | [`_system/contracts/TICKETS.md`](_system/contracts/TICKETS.md) |
| How a repo gets analysed (the seven lenses) | [`_system/contracts/LENSES.md`](_system/contracts/LENSES.md) |
| What a lead's status means — the client lifecycle and its orthogonal flags | [`_system/contracts/CLIENTS.md`](_system/contracts/CLIENTS.md) |
| Estate doctrine, contracts, the three commands | [`_system/README.md`](_system/README.md) |
| Estate audit — security, broken config, open decisions | [`_system/AUDIT.md`](_system/AUDIT.md) |
| Conformance check / seed a repo's baseline | [`_system/scripts/icm-check.sh`](_system/scripts/icm-check.sh) + `/icm-check` |
| Estate board / drift / pull everything, from a script | [`_system/scripts/tickets-board.sh`](_system/scripts/tickets-board.sh) · [`_system/scripts/ticket-hygiene.sh`](_system/scripts/ticket-hygiene.sh) · [`_system/scripts/pull-all.sh`](_system/scripts/pull-all.sh) |
| Change the portfolio (content, case studies, contact form) | [`websites/portfolio/`](websites/portfolio/) |
| Change the admin cockpit (Leads, Tickets, Money) | [`websites/admin-dashboard/`](websites/admin-dashboard/) |
| Change how clients pay an invoice | [`websites/payment-gateway/`](websites/payment-gateway/) |
| Change the affiliate/referral intake | [`websites/sellers-site/`](websites/sellers-site/) |
| Brand colours, tokens, components, voice | [`packages/ui/`](packages/ui/) + [`packages/ui/BRAND.md`](packages/ui/BRAND.md) |
| Data model / queries (`biz.*`) | [`packages/services/`](packages/services/) |
| Plan or track engineering work on **this** repo | tickets in [`.icm/intake/`](.icm/intake/) (`JN-NNN-slug.md`) |
| Engineering work in a **client** repo | that repo's own `.icm/intake/` under `projects/<repo>` — each repo owns its pipeline semantics |
| Customer questionnaires / onboarding forms (questions only — answers live in Neon) | [`.icm/onboarding/`](.icm/onboarding/) for house forms; a client's own `.icm/onboarding/` for theirs |
| Daily business todos / compliance deadlines | the working-list strip on the dashboard's Leads screen (`biz.tasks` + `biz.compliance_dates`) |

## Standing rules (do not break these)

- **Brand is one source of truth** — [`packages/ui`](packages/ui/). Websites consume the
  package; never fork tokens per site.
- **Planning is tickets.** Any plan, backlog, or task list becomes markdown tickets in
  `.icm/intake/` — never a loose `TODO.md`/`BACKLOG.md`. Tickets ARE the plan: day =
  `Status: today` (≤3 estate-wide), week = Priority rows. Ticket-only commits go straight
  to `main`; everything else through a PR.
- **No outbound action without review.** Invoices are raised as drafts; finalizing and
  emailing is a separate, deliberate click. Outreach email is composed and sent by a human.
- **CI is the source of truth.** Never run `build`/`lint`/`typecheck` locally; push and
  read the checks.
- **Client repos in `projects/` are never tracked here** and never created by hand —
  the dashboard creates them (`createClientRepo`); `/project` adopts them.
- **Sustentus is exempt** from the estate baseline — its `.icm/` is authoritative (own
  pipeline semantics, not the ticket spec). Gates everywhere are human checkboxes: read,
  never tick.
- **No secrets in git, ever.** Env vars only; flag any plaintext credential found.
