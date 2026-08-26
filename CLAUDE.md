# CLAUDE.md — Layer 0: Repository Identity & Routing

> This is the **first file any Claude session reads.** It says what this repo is and where
> to go for a given task. Keep it short; detail lives in each folder's own `README.md`.

## What this repo is

The estate control layer **and** the personal web estate of **Jamie Nisbet** — a software
engineer / AI consultant based in Mafra, Portugal. Two halves, one repo (consolidated
2026-08-12, formerly split with `k0d0minio/apps-estate`, now archived):

**The control layer — this repo's root, and nothing else.** `_system/` (contracts, estate
scripts, audit), `.icm/` (the `JN-*` backlog, house onboarding forms, preserved docs), and
`.claude/` (three commands, two agents, session hook). The root carries no `package.json`
and no application code: it is the ICM layer, and every folder that isn't `projects/` is
part of it.

**The work — [`projects/`](projects/), one folder per repo.** The client repos are separate
git repos, deliberately **gitignored here** (`/projects/*` is the mechanism; the single
`!/projects/jamienisbet/` re-include is the only exception, and a second one would start
tracking a client's files — never add one). They exist only on this machine.

**[`projects/jamienisbet/`](projects/jamienisbet/) is the house web estate** — the one
folder under `projects/` that *is* tracked here, because it is this repo's own product
rather than a client's. A pnpm monorepo (its root, not the repo root), deliberately small:
four apps + three shared packages, deployed as four Vercel projects whose Root Directory
points inside it.

- **[`projects/jamienisbet/websites/portfolio/`](projects/jamienisbet/websites/portfolio/)** — the public
  portfolio (i18n, markdown case studies, contact form → Neon `biz.clients` + Resend).
- **[`projects/jamienisbet/websites/admin-dashboard/`](projects/jamienisbet/websites/admin-dashboard/)** —
  the owner-only cockpit. Four screens: *Leads*, a *lead's profile*, *Tickets* (every active
  repo's `.icm/intake/` backlog in one read-only board), and *Money* (Stripe). Business state
  lives in **one** store — the Neon `biz.*` schema — operated through the dashboard, never
  mirrored into git.
- **[`projects/jamienisbet/websites/payment-gateway/`](projects/jamienisbet/websites/payment-gateway/)** —
  the client-facing pay page (`/pay/[invoice]`, Stripe Embedded Checkout + verified webhook).
- **[`projects/jamienisbet/websites/sellers-site/`](projects/jamienisbet/websites/sellers-site/)** — the
  affiliate program's public front door (referral intake → Neon + Resend).
- **[`projects/jamienisbet/packages/`](projects/jamienisbet/packages/)** — `ui` (the design system;
  **the** brand source of truth, human guide in
  [`BRAND.md`](projects/jamienisbet/packages/ui/BRAND.md)) · `app-shell` (marketing-site
  chrome/i18n) · `services` (Neon `biz.*` data layer).

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
| Change the portfolio (content, case studies, contact form) | [`projects/jamienisbet/websites/portfolio/`](projects/jamienisbet/websites/portfolio/) |
| Change the admin cockpit (Leads, Tickets, Money) | [`projects/jamienisbet/websites/admin-dashboard/`](projects/jamienisbet/websites/admin-dashboard/) |
| Change how clients pay an invoice | [`projects/jamienisbet/websites/payment-gateway/`](projects/jamienisbet/websites/payment-gateway/) |
| Change the affiliate/referral intake | [`projects/jamienisbet/websites/sellers-site/`](projects/jamienisbet/websites/sellers-site/) |
| Brand colours, tokens, components, voice | [`projects/jamienisbet/packages/ui/`](projects/jamienisbet/packages/ui/) + [`BRAND.md`](projects/jamienisbet/packages/ui/BRAND.md) |
| Data model / queries (`biz.*`) | [`projects/jamienisbet/packages/services/`](projects/jamienisbet/packages/services/) |
| Plan or track engineering work on **this** repo | tickets in [`.icm/intake/`](.icm/intake/) (`JN-NNN-slug.md`) |
| Engineering work in a **client** repo | that repo's own `.icm/intake/` under `projects/<repo>` — each repo owns its pipeline semantics |
| Build, deploy or CI paths for the web estate | [`projects/jamienisbet/websites/README.md`](projects/jamienisbet/websites/README.md) · workflows stay at [`.github/workflows/`](.github/workflows/) (GitHub only reads them at the repo root) |
| Customer questionnaires / onboarding forms (questions only — answers live in Neon) | [`.icm/onboarding/`](.icm/onboarding/) for house forms; a client's own `.icm/onboarding/` for theirs |
| Daily business todos / compliance deadlines | the working-list strip on the dashboard's Leads screen (`biz.tasks` + `biz.compliance_dates`) |

## Standing rules (do not break these)

- **Brand is one source of truth** — [`projects/jamienisbet/packages/ui`](projects/jamienisbet/packages/ui/).
  Websites consume the package; never fork tokens per site.
- **Planning is tickets.** Any plan, backlog, or task list becomes markdown tickets in
  `.icm/intake/` — never a loose `TODO.md`/`BACKLOG.md`. Tickets ARE the plan: day =
  `Status: today` (≤3 estate-wide), week = Priority rows. Ticket-only commits go straight
  to `main`; everything else through a PR.
- **No outbound action without review.** Invoices are raised as drafts; finalizing and
  emailing is a separate, deliberate click. Outreach email is composed and sent by a human.
- **CI is the source of truth.** Never run `build`/`lint`/`typecheck` locally; push and
  read the checks.
- **Client repos in `projects/` are never tracked here** and never created by hand —
  the dashboard creates them (`createClientRepo`); `/project` adopts them. The lone
  tracked exception is `projects/jamienisbet/`, the house web estate; it is not a
  separate repo and never becomes one.
- **The repo root stays the ICM layer.** Application code, `package.json`, lockfiles and
  build config belong under `projects/jamienisbet/`. `.github/workflows/` is the one
  forced exception — GitHub only reads workflows at the repo root — so its steps name
  their working directory explicitly.
- **Sustentus is exempt** from the estate baseline — its `.icm/` is authoritative (own
  pipeline semantics, not the ticket spec). Gates everywhere are human checkboxes: read,
  never tick.
- **No secrets in git, ever.** Env vars only; flag any plaintext credential found.
