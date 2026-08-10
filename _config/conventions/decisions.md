# Architecture Decisions (register)

> **ICM role:** Layer 3 — reference (convention)
> **Purpose:** A terse register of the decisions that shaped this repo, so an agent loads the *what* without re-reading the full Q&A. This register is the record.

Decided 2026-06 from the founding questionnaire (~50 answers). Most load-bearing first.

## Structure
- **Stage contract = split:** `README.md` (narrative) + `CONTEXT.md` (contract). Root `CLAUDE.md`
  stays the only Layer-0 file. → [`readme-as-context.md`](readme-as-context.md)
- **Delivery lives in the client's external repo** — docs *and* code. _(The founding "`projects/` =
  in-repo, docs-only per client" model is retired — see the 2026-07 dashboard-first reversal; the
  dashboard seeds delivery docs into the client repo.)_ → [`client-and-slug.md`](client-and-slug.md)
- **`websites/` here = `portfolio/`, `payment-gateway/`, `admin-dashboard/`, `sellers-site/`**
  (Next.js + Vercel). Client sites are **external repos**. No `clients/` or `personal/` here.
- **Daily todos + morning brief = the dashboard's working list.** _(The founding standalone
  `tracker/` — and its personal/business privacy wall — are both retired; see the 2026-07
  dashboard-first reversal.)_
- **Repo is private forever.** Not handed to clients; sensitive global config is injected at
  run-time, not referenced from a shared workspace.

## Automation & integrations
- **Scripts = bash**, agent-invoked, each with a tiny contract. Shipped: `send-email` (Resend) and
  the read-only `stripe-*` fetchers. (`new-client` was planned but never built — client creation is
  the dashboard's job; `new-project` shipped and was later retired with `projects/`, see the 2026-07
  reversal.) → [`scripts-and-integrations.md`](scripts-and-integrations.md)
- **Wired services: Stripe, Vercel, GitHub.** Accounting via Stripe.
- **Hard boundary:** no outbound action without a human-reviewed `output/` file first. No
  exceptions. Per-stage `## Integrations` declares any external call.

## State & process
- **State = the Neon `biz.*` schema, the sole store.** The repo holds no pipeline state (no client
  records, statuses, or generated dashboard); the admin dashboard drives the pipeline, and there
  is no sync-back. → [`state-and-status.md`](state-and-status.md)
  _(Reverses the original "State = per-entity YAML front-matter" decision — see the 2026-07 entry
  below.)_
- **Status vocabularies are defined in code** (`@jamie-nisbet/services`: `clientStatuses`,
  `billingTypes`) and referenced, never restated, by docs.
- **Output versioning:** `output/<client>/<vN>/` side-by-side; run header on each; commit per
  stage/run.
- **Verify mandatory; provenance markers in real outputs; edit→source-fix loop.**
- **Client record created only once qualified.** Triage is both a gate-before-proposals and a
  standalone fast-feedback mode.

## Reversals
- **2026-07 — Dashboard-first: the dashboard is the cockpit, the repo is the factory.** The admin
  dashboard is where the business *runs* day-to-day (pipeline, deals, invoices, daily brief,
  outreach drafts); the repo carries the AI factory (stage contracts, references, brand, templates)
  that the ICM runtime reads, plus the code that ships it. Consequences: `projects/` and
  `scripts/new-project.sh` retired (delivery docs are seeded into the client's external repo by the
  dashboard from `shared/templates/delivery/`); `tracker/` retired (the morning brief is the
  dashboard's working list, todos live in `biz.tasks`); empty `shared/knowledge/` deleted;
  outreach is drafted in the dashboard (draft-only — sending stays manual and off-platform).
- **2026-07 — State store: one DB, not a repo mirror.** The founding "State = per-entity YAML
  front-matter in `shared/clients/`, aggregated into a generated `state/dashboard.md`" model is
  **retired**, along with the later "repo is a synced mirror maintained by sync-back" plan. The
  Neon `biz.*` schema is the **sole** source of truth; the repo carries no pipeline state and
  nothing is written back to git on approval. Zero real entities existed in the markdown model, so
  this removed specification and scaffolding, not data. → [`state-and-status.md`](state-and-status.md)

- **2026-08 — The dashboard tracks people, it does not generate documents.** The three-step AI
  deal pipeline in the admin dashboard (brainstorm with web research → pitch → proposal →
  milestone invoicing), its versioned review-gated `biz.documents`, AI provenance/spend tracking,
  draft-only outreach composition, and the won-deal onboarding checklist are **retired**. ~14
  screens became **three**: Leads, a lead's profile, and Money. Consequences: the `deals`,
  `documents`, `generations`, `touches` and `workshop_messages` tables dropped; the
  `app/api/ai/*` routes and the `@jamie-nisbet/icm` package deleted (those routes were its only
  consumer); **one row per person** — a lead who comes back for more work is the same
  relationship, carrying `value_minor` + `billing_type` (`one_off` | `monthly`) instead of a
  deal record; the leads list sorts on `coalesce(last_touched_at, created_at)` so whoever has
  waited longest is at the top. The markdown factory (`_config/`, `shared/templates/`,
  `workspaces/*/stages/`) is **untouched** — those contracts are now walked directly by an agent,
  writing a reviewed file to the stage's `output/`, rather than being loaded by a route handler.
  Reason: too much machinery for a one-person consultancy whose actual need is knowing who is
  waiting to hear back. → [`macro-pipeline.md`](macro-pipeline.md) ·
  [`state-and-status.md`](state-and-status.md)

## Business parameters (used by later passes)
- **All pricing numbers live in [`_config/business/rates.md`](../business/rates.md)** — the single
  source of truth for rate, anchor, floor, retainer reduction, affiliate percentage and the
  landing-page minimum. Never restate figures elsewhere. Tiered good/better/best by default; price
  against client upside. **Account for a retainer client type from the start** (one is live).
- **Affiliate:** sellers quote the landing-page offer freely at/above the `rates.md` minimum without
  approval; anything more complex needs Jamie's sign-off. Commission paid on payment received. Lead
  intake + partner referrals via the public `sellers-site/`.
- **Triage rubric:** fit, budget, strategic value. May recommend a competitor/SaaS when it serves
  the client better; standalone mode = a 5-minute verbal-ready summary.
- **Legal/tax:** nothing set up yet (sole trader likely, undecided); **decision-support only**;
  source + as-of-date on every note; compliance calendar does **not** auto-feed Google Calendar.
- **Brand:** name "Jamie Nisbet"; English-first; friendly + informative + expert; designing from
  zero; email `contact@jamienisbet.com`. Brand emits machine-readable design tokens consumed by
  documents and websites.
- **Models:** heavy for negotiation/triage; cheap for formatting/scans.
- **Goal of "powerful":** fewer admin hours, higher close rate, never miss a deadline.
