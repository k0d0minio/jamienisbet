# BACKLOG.md — System-Build Tasks (go-live)

> **ICM role:** Layer 4 — working artifact (the build backlog).
> **Purpose:** The engineering / system-build tasks needed to take this repo from
> "architecturally complete" to "operationally running." This is **distinct from**
> [`tracker/business/todos.md`](tracker/business/todos.md), which holds Jamie's *business*
> todos (chase a lead, send a proposal). Build/dev work lives here so the tracker stays a
> business-only hub.

## How to read this
Each ticket is `ID · Title · Priority`, followed by **Why**, **Files**, and **Acceptance**.
Scope is deliberately narrow: **go-live operational readiness only** — entity facts, the first
real workspace run, dashboard generation, and the tracker routine. Larger build-out (the
admin-dashboard site, per-stage narrative READMEs, wiring the website integration TODOs,
populating the knowledge base) is parked under **Deferred** at the bottom so the exclusion is a
conscious choice, not an oversight.

The current state: the ICM architecture, 6 workspaces (24 stage contracts), brand-as-code
(`@jamie-nisbet/ui`), 6 scripts, and 3 of 4 websites are built. What's missing is everything
that makes the system *run* day to day.

---

## B1 — Generate the state dashboard · **High**

**Why.** [`state/dashboard.md`](state/README.md) is the single "where does the business stand"
surface, and the tracker's morning brief and Friday review both read it. It can't exist until a
script aggregates the per-entity YAML front-matter (schema in
[`_config/conventions/state-and-status.md`](_config/conventions/state-and-status.md)) plus the
Stripe figures. `scripts/README.md` already lists `gen-dashboard.sh` as planned.

**Files.** `scripts/gen-dashboard.sh` (new), `state/dashboard.md` (generated),
reuse `scripts/stripe-report.sh`; refs `state/README.md`, `scripts/README.md`.

**Acceptance.**
- Running `scripts/gen-dashboard.sh` writes `state/dashboard.md` with the five metrics:
  pipeline value, win rate, monthly revenue, tax reserve, overdue receivables.
- The script is **read-only** over the repo + Stripe (no writes outside `state/`), declares the
  standard `Inputs / Outputs / Side-effects / Invocation` header, and pulls no secrets into output.
- Every figure can be traced to a source path or the `stripe-report` fetch.

---

## B2 — Stand up the tracker morning routine · **High**

**Why.** The daily brief is one of the founder-brief's headline asks and the lowest-risk source
of daily value, but it can't run: `tracker/business/todos.md` and `done.md` are still marked
"planned; do not create," and no brief has ever been produced.
(Note: the *content* of these two files is delivered alongside this backlog — this ticket is the
remaining wiring: produce a brief and document the schedule.)

**Files.** `tracker/business/todos.md`, `tracker/business/done.md` (created with this work),
first `tracker/output/YYYY-MM-DD-brief.md`; follows
[`tracker/routine/CONTEXT.md`](tracker/routine/CONTEXT.md).

**Acceptance.**
- A dated brief exists in `tracker/output/`, assembled per the routine contract (overdue
  invoices → today's deadlines → stalled deals), with every deadline citing its source path.
- The three Claude scheduled routines are documented (where/what they run): **daily** morning
  brief, **Friday** weekly review, **weekly** invoice chaser.
- All upstream scans are read-only; the run writes only inside `tracker/output/`.

---

## B3 — Populate `_config/business/` entity facts · **High** _(gated on the entity decision)_

**Why.** Templates render `{{business.nif}}`, `{{business.iban}}`, address and contact tokens.
Until the PT structure is chosen (see the tracker todo) and these are filled, no proposal, quote,
contract or invoice can be produced with real facts. Per brainstorm G4, business facts (NIF,
IBAN, address) live in the repo in plain text; only secrets go in `.env` / Vercel.

**Files.** `_config/business/contact.md`, new `_config/business/entity.md`;
consumers `shared/templates/*.md`.

**Acceptance.**
- A decided entity (sole trader vs Unipessoal Lda) is recorded with NIF, IBAN, registered
  address, and `contact@jamienisbet.com`.
- No `{{business.*}}` placeholders remain unresolved in a generated proposal/invoice.

---

## B4 — Model the recurring retainer client in the data model · **Medium**

**Why.** Jamie already has one recurring retainer client and wants that client *type* accounted
for "from the jump" (brainstorm H3). Today the client/finance front-matter is shaped around
one-off deals; recurring monthly revenue has nowhere to live and won't surface in B1.

**Files.** `shared/clients/_template-client/finances.md` and `deals.md`,
`workspaces/finance/references/`, schema in `_config/conventions/state-and-status.md`.

**Acceptance.**
- A retainer can be expressed as recurring monthly revenue in client front-matter.
- That recurring revenue is picked up by `gen-dashboard.sh` (B1) in monthly revenue / pipeline.

---

## B5 — Light-touch CI · **Medium**

**Why.** The websites and `@jamie-nisbet/ui` are real code consumed by Vercel; a broken build
should be caught before merge. Per the agreed scope this is **light-touch only** — no unit tests,
no pre-commit hooks.

**Files.** `.github/workflows/ci.yml` (new); existing `package.json` scripts in `websites/*`
and `packages/ui`.

**Acceptance.**
- On every PR, CI runs typecheck + build for `websites/*` and `packages/ui` via pnpm.
- The workflow is green on a no-op PR; no test or lint-staged gates are added.

---

## Deferred — out of go-live scope (conscious exclusions)

Tracked here so they aren't lost, but **not** part of the go-live push:

- **`websites/admin-dashboard/`** — the internal control panel is documented but the folder
  doesn't exist. Build after the dashboard data model (B1) is proven.
- **Per-stage narrative `README.md`s** — stages currently ship only `CONTEXT.md`; the convention
  wants a narrative README beside each. ~24 files; cosmetic until onboarding others.
- **Website integration TODOs** — Resend send in `websites/portfolio/app/actions/contact.ts`,
  Stripe webhook ledger write-back in `websites/payment-gateway/app/api/webhooks/stripe/route.ts`,
  and sellers lead-routing in `websites/sellers-site/app/actions/referral.ts`. Correctly stubbed
  behind the review-gate rule; wire when the sites go live.
- **`shared/knowledge/` case studies** — empty; populate from the first won deals / delivered
  projects (feeds the portfolio and the negotiation playbook).
- **Date-stamping legal/tax references** — add "source + as-of date" to
  `workspaces/legal-and-tax/references/*` so PT-law notes don't silently go stale.
