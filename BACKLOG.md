# BACKLOG.md — System-Build Tasks (go-live)

> **ICM role:** Layer 4 — working artifact (the build backlog).
> **Purpose:** The engineering / system-build tasks needed to take this repo from
> "architecturally complete" to "operationally running." This is **distinct from**
> [`tracker/business/todos.md`](tracker/business/todos.md), which holds Jamie's *business*
> todos (chase a lead, send a proposal). Build/dev work lives here so the tracker stays a
> business-only hub.

## How to read this
Each ticket is `ID · Title · Priority`, followed by **Why**, **Files**, and **Acceptance**.
Scope is deliberately narrow: **go-live operational readiness only** — entity facts and
light-touch CI. Larger build-out (per-stage narrative READMEs, wiring the website integration
TODOs, populating the knowledge base) is parked under **Deferred** at the bottom so the exclusion
is a conscious choice, not an oversight. Tickets that were built on the retired markdown state
model (B1, B2, B4) are recorded as **Dropped** at the bottom — IDs are kept stable so B3/B5 don't
shift under references elsewhere.

The current state: the ICM architecture, 6 workspaces (24 stage contracts), brand-as-code
(`@jamie-nisbet/ui`), the automation scripts, all 4 websites (including the admin dashboard that
operates the Neon `biz.*` pipeline), and the `@jamie-nisbet/services` data model are built. What's
missing is the entity facts and CI below.

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

- **Per-stage narrative `README.md`s** — stages currently ship only `CONTEXT.md`; the convention
  wants a narrative README beside each. ~24 files; cosmetic until onboarding others.
- **Website integration TODOs** — Resend send in `websites/portfolio/app/actions/contact.ts` and
  sellers lead-routing in `websites/sellers-site/app/actions/referral.ts`. Correctly stubbed
  behind the review-gate rule; wire when the sites go live.
- **`shared/knowledge/` case studies** — empty; populate from the first won deals / delivered
  projects (feeds the portfolio and the negotiation playbook).
- **Date-stamping legal/tax references** — add "source + as-of date" to
  `workspaces/legal-and-tax/references/*` so PT-law notes don't silently go stale.

---

## Dropped — superseded by the single-store decision (issue #26)

The state model was unified onto the Neon `biz.*` schema as the sole store; the repo holds no
pipeline state or generated dashboard. These tickets were built on the retired markdown model and
no longer apply. IDs are retained so B3/B5 keep their numbers.

- **B1 — Generate the state dashboard.** There is no `state/dashboard.md` and no per-entity
  front-matter to aggregate; "where the business stands" is read live in the admin dashboard.
- **B2 — Stand up the tracker morning routine.** The routine scanned `shared/clients/` + `state/`,
  which no longer exist; the tracker is now a manual business-todo hub and pipeline visibility
  lives in the admin.
- **B4 — Model the retainer client in the front-matter data model.** Client/deal data lives in
  `biz.*`, not front-matter; a retainer is modelled there if/when needed, not in the repo.
