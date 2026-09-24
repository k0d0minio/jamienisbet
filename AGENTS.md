# AGENTS.md — Layer 0: Repository Identity & Routing

> This is the **first file any agent session reads.** It says what this repo is and where
> to go for a given task. Keep it short; detail lives in each folder's own `README.md`.

## What this repo is

The personal web estate of **Jamie Nisbet** — a software engineer / AI consultant based in
Mafra, Portugal. A pnpm monorepo, deliberately small: four Next.js apps and three shared
packages, deployed as four Vercel projects.

- **[`websites/portfolio/`](websites/portfolio/)** — the public portfolio (i18n, markdown
  case studies, contact form → Neon `biz.clients` + Resend).
- **[`websites/admin-dashboard/`](websites/admin-dashboard/)** — the owner-only cockpit.
  Four screens: *Needs you* (the triaged attention feed that is home), *Leads* and a *lead's
  profile*, *Tickets* (every active repo's `.icm/intake/` backlog in one read-only board),
  and *Money* (Stripe). Business state lives in **one**
  store — the Neon `biz.*` schema — operated through the dashboard, never mirrored into git.
- **[`websites/sellers-site/`](websites/sellers-site/)** — the affiliate program's public
  front door (referral intake → Neon + Resend).
- **[`packages/`](packages/)** — `ui` (the design system; **the** brand source of truth,
  human guide in [`packages/ui/BRAND.md`](packages/ui/BRAND.md)) · `app-shell`
  (marketing-site chrome/i18n) · `services` (Neon `biz.*` data layer).

### This repo is one of many, and it is not the orchestrator

Jamie's estate is ~22 client repos plus this one. The rules they all share — the ticket
contract, the project register, the analysis lenses, the client lifecycle, the `/project`,
`/day` and `/icm-check` commands — live in a **separate repo, `k0d0minio/icm-board`**,
which on his machine sits one level up at `~/Apps` with this repo checked out beneath it as
`projects/jamienisbet`.

That means: **nothing here reaches into `_system/`**, and a cloud session on this repo has
everything it needs. [`.icm/intake/README.md`](.icm/intake/README.md) is a deliberate
micro-copy of the ticket contract for exactly that reason. If a task is about how repos are
structured rather than about this product, it belongs in `icm-board`.

Split out 2026-08-26 — see [`.icm/docs/decisions.md`](.icm/docs/decisions.md). This repo
kept the remote, the history, the CI and the `JN-*` series; the control layer left.

## Routing — "if the task is… → go to…"

| The task | Go to |
|---|---|
| Change the portfolio (content, case studies, contact form) | [`websites/portfolio/`](websites/portfolio/) |
| Change the admin cockpit (Leads, Tickets, Money) | [`websites/admin-dashboard/`](websites/admin-dashboard/) |
| Change the affiliate/referral intake | [`websites/sellers-site/`](websites/sellers-site/) |
| Brand colours, tokens, components, voice | [`packages/ui/`](packages/ui/) + [`packages/ui/BRAND.md`](packages/ui/BRAND.md) — the per-turn UI checklist auto-loads from [`.claude/skills/design-dna/`](.claude/skills/design-dna/SKILL.md) |
| Data model / queries (`biz.*`) | [`packages/services/`](packages/services/) |
| Deployment, Vercel Root Directories, build skipping | [`websites/README.md`](websites/README.md) § Deployment |
| CI, DB migrations | [`.github/workflows/`](.github/workflows/) |
| Plan or track engineering work on **this** repo | stubs in [`.icm/intake/`](.icm/intake/) — epics + triage, identity is the path — contract in [its README](.icm/intake/README.md) |
| Customer questionnaires / onboarding forms (questions only — answers live in Neon) | the house forms live in **icm-board**, `workspaces/sell/references/forms/` (the deal workspace owns them); a client's own `.icm/onboarding/` in their delivery repo for theirs |
| Daily business todos / compliance deadlines | the dashboard's **Needs you** feed at `/` — its Overdue section (`biz.tasks` + `biz.compliance_dates`) |
| How repos are structured · the ticket/project/lens contracts · `/project` `/day` `/icm-check` | the **`icm-board`** repo — not here |

## Standing rules (do not break these)

- **Brand is one source of truth** — [`packages/ui`](packages/ui/). Websites consume the
  package; never fork tokens per site.
- **Planning is stubs.** Any plan, backlog, or task list becomes markdown stubs in
  `.icm/intake/` — never a loose `TODO.md`/`BACKLOG.md`. Identity is the path
  (`<epic>/<slug>`) and status is positional: done is a `git mv` to `_done/`, never a
  field. Today lives estate-wide in icm-board's `.icm/today.md` (≤10 entries), not in
  ticket files. Ticket-only changes go straight to `main` by a direct commit (D39), shape in
  [`pr-conventions`](.claude/skills/pr-conventions/SKILL.md) → Ticket commits; everything
  else through a PR on a `claude/` branch.
- **No outbound action without review.** Invoices are raised as drafts; finalizing and
  emailing is a separate, deliberate click. Outreach email is composed and sent by a human.
- **CI is the source of truth.** Never run `build`/`lint`/`typecheck` locally; push and
  read the checks.
- **Business state lives in Neon, not git.** `biz.*` is operated through the dashboard and
  never mirrored into markdown. Tickets are the exception that proves it — they live in
  repos, and the dashboard only reads them.
- **Gates are human checkboxes** — read them, never tick them.
- **No secrets in git, ever.** Env vars only; flag any plaintext credential found.
