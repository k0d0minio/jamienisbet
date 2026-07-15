# BACKLOG.md — System-Build Tasks

> **ICM role:** Layer 4 — working artifact (the build backlog).
> **Purpose:** The engineering / system-build tasks needed to take this repo from
> "architecturally complete" to "operationally running." Business todos (chase a lead, send a
> proposal) live in the admin dashboard, not here.

## How to read this
Each ticket is `ID · Title · Priority`, followed by **Why**, **Files**, and **Acceptance**.
Dropped/superseded tickets are recorded at the bottom — IDs are kept stable so cross-references
don't shift.

The current state: the ICM architecture, the workspace contracts, brand-as-code
(`@jamie-nisbet/ui`), all 4 websites (fully implemented — i18n, Resend + Neon intake forms,
Stripe checkout, and the admin dashboard that operates the Neon `biz.*` pipeline with its
ICM-driven AI document generation), and the `@jamie-nisbet/services` data model are **built and
live**. The 2026-07 dashboard-first restructure (see
[`_config/conventions/decisions.md`](_config/conventions/decisions.md)) retired `projects/`,
`tracker/`, and `shared/knowledge/`, and added the dashboard's `/today` brief, won-deal
onboarding, delivery-repo seeding, and draft-only outreach.

---

## B3 — Populate `_config/business/` entity facts · **High** _(gated on the entity decision — needs Jamie)_

**Why.** Templates render `{{business.nif}}`, `{{business.iban}}`, address and contact tokens.
Until the PT structure is chosen and these are filled, no proposal, quote, contract or invoice can
be produced with real facts. Business facts (NIF, IBAN, address) live in the repo in plain text;
only secrets go in `.env` / Vercel.

**Files.** `_config/business/contact.md`, new `_config/business/entity.md`;
consumers `shared/templates/*.md`.

**Acceptance.**
- A decided entity (sole trader vs Unipessoal Lda) is recorded with NIF, IBAN, registered
  address, and `contact@jamienisbet.com`.
- No `{{business.*}}` placeholders remain unresolved in a generated proposal/invoice.

---

## B6 — Seed the compliance calendar · **High** _(needs Jamie / the contabilista)_

**Why.** The dashboard's `/today` page surfaces upcoming compliance dates from
`biz.compliance_dates`, but the actual PT dates (IRS payments-on-account, quarterly Segurança
Social declarations, IES, IVA if applicable) must come from Jamie's contabilista — the
legal-and-tax compliance-calendar stage was only partially run.

**Files.** None (data entry in the dashboard `/today` page);
`workspaces/legal-and-tax/stages/05_compliance_calendar/` for the source run.

**Acceptance.**
- The known annual/quarterly PT obligations are entered with source + as-of date in the notes.
- `/today` shows the next deadline correctly; recurring items re-arm on completion.

---

## Migrated from the retired tracker — re-enter on `/today` (needs Jamie)

The open items from `tracker/business/todos.md` at retirement (2026-07-15). Enter the ones still
relevant as tasks on the dashboard's `/today` page, then delete this section:

- Decide the PT business structure (sole trader vs Unipessoal Lda) — see `workspaces/legal-and-tax/`
- Appoint a *contabilista certificado* to validate the structure & tax setup
- Run the legal-and-tax workspace to produce the decision-support pack
- Register the existing recurring retainer client in the admin dashboard
- Kick off the retainer client's delivery (won-deal onboarding checklist seeds the repo)
- Secure the `jamienisbet.com` domain and the `contact@jamienisbet.com` inbox
- Once the entity is live: record NIF / IBAN / registered address into `_config/business/` (→ B3)

## Deferred — conscious exclusions

- **Date-stamping legal/tax references** — add "source + as-of date" to
  `workspaces/legal-and-tax/references/*` so PT-law notes don't silently go stale.
- **Case-study content** — the portfolio's case studies are placeholders; populate from the first
  delivered engagements.
- **In-repo Vercel deploy config** (`vercel.json`) — deployment is currently configured in the
  Vercel UI per project; commit it if reproducibility becomes a need.

---

## Done / dropped (IDs retained)

- **B1 — Generate the state dashboard.** Dropped — superseded by the single-store decision
  (issue #26); "where the business stands" is read live in the admin dashboard.
- **B2 — Stand up the tracker morning routine.** Dropped — `tracker/` is retired; the morning
  brief is the dashboard's `/today` page (2026-07 dashboard-first reversal).
- **B4 — Model the retainer client in the front-matter data model.** Dropped — client/deal data
  lives in `biz.*`.
- **B5 — Light-touch CI.** **Done** — `.github/workflows/ci.yml` runs typecheck + lint + builds
  for all apps/packages alongside the existing `db-migrations.yml`.
- **Per-stage narrative READMEs.** **Done** — all 24 stages ship both `README.md` and
  `CONTEXT.md`.
- **Website integration TODOs.** **Done** — portfolio contact and sellers referral forms write
  `biz.clients` and send via Resend.
