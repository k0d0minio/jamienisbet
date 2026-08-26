# Architecture Decisions (register)

> **ICM role:** Layer 3 — reference (convention)
> **Purpose:** A terse register of the decisions that shaped this repo, so an agent loads the *what* without re-reading the full Q&A. This register is the record.

Decided 2026-06 from the founding questionnaire (~50 answers). Most load-bearing first.

## Structure
- **Stage contract = split:** `README.md` (narrative) + `CONTEXT.md` (contract). Root `CLAUDE.md`
  stays the only Layer-0 file. _(The per-decision companion docs referenced throughout this
  register were retired with the factory in 2026-08; this register is the surviving record.)_
- **Delivery lives in the client's external repo** — docs *and* code. _(The founding "`projects/` =
  in-repo, docs-only per client" model is retired — see the 2026-07 dashboard-first reversal.
  Dashboard-driven delivery-doc seeding was itself retired in 2026-08 along with the templates it
  seeded from. Repos are seeded from the estate template by `icm-check.sh --fix`; the
  `_system/icm-template` path and the `/onboard` command named here are both retired, and
  since 2026-08-26 the template itself lives in `k0d0minio/icm-board`.)_
- **`websites/` here = `portfolio/`, `payment-gateway/`, `admin-dashboard/`, `sellers-site/`**
  (Next.js + Vercel). Client sites are **external repos**. No `clients/` or `personal/` here.
- **Daily todos + morning brief = the dashboard's working list.** _(The founding standalone
  `tracker/` — and its personal/business privacy wall — are both retired; see the 2026-07
  dashboard-first reversal.)_
- **Repo is private forever.** Not handed to clients; sensitive global config is injected at
  run-time, not referenced from a shared workspace.

## Automation & integrations
- **Scripts = bash**, agent-invoked, each with a tiny contract. _(The `scripts/` folder is gone
  entirely: `send-email` and the `stripe-*` fetchers were retired with the factory in 2026-08;
  `new-client` was planned but never built — client creation is the dashboard's job; `new-project`
  shipped and was retired with `projects/`, see the 2026-07 reversal. The estate scripts that
  remain live in `_system/` — which left this repo for `k0d0minio/icm-board` on 2026-08-26.)_
- **Wired services: Stripe, Vercel, GitHub.** Accounting via Stripe.
- **Hard boundary:** no outbound action without a human-reviewed `output/` file first. No
  exceptions. Per-stage `## Integrations` declares any external call.

## State & process
- **State = the Neon `biz.*` schema, the sole store.** The repo holds no pipeline state (no client
  records, statuses, or generated dashboard); the admin dashboard drives the pipeline, and there
  is no sync-back.
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
  `scripts/new-project.sh` retired (delivery docs moved to the client's external repo; the
  dashboard-seeding mechanism that replaced the script was itself retired in 2026-08); `tracker/` retired (the morning brief is the
  dashboard's working list, todos live in `biz.tasks`); empty `shared/knowledge/` deleted;
  outreach is drafted in the dashboard (draft-only — sending stays manual and off-platform).
- **2026-07 — State store: one DB, not a repo mirror.** The founding "State = per-entity YAML
  front-matter in `shared/clients/`, aggregated into a generated `state/dashboard.md`" model is
  **retired**, along with the later "repo is a synced mirror maintained by sync-back" plan. The
  Neon `biz.*` schema is the **sole** source of truth; the repo carries no pipeline state and
  nothing is written back to git on approval. Zero real entities existed in the markdown model, so
  this removed specification and scaffolding, not data.

- **2026-08 — The dashboard tracks people, it does not generate documents.** The three-step AI
  deal pipeline in the admin dashboard (brainstorm with web research → pitch → proposal →
  milestone invoicing), its versioned review-gated `biz.documents`, AI provenance/spend tracking,
  draft-only outreach composition, and the won-deal onboarding checklist are **retired**. ~14
  screens became **four**: Leads, a lead's profile, the read-only Tickets board, and Money.
  Consequences: the `deals`,
  `documents`, `generations`, `touches` and `workshop_messages` tables dropped; the
  `app/api/ai/*` routes and the `@jamie-nisbet/icm` package deleted (those routes were its only
  consumer); **one row per person** — a lead who comes back for more work is the same
  relationship, carrying `value_minor` + `billing_type` (`one_off` | `monthly`) instead of a
  deal record; the leads list sorts on `coalesce(last_touched_at, created_at)` so whoever has
  waited longest is at the top. The markdown factory (`_config/`, `shared/templates/`,
  `workspaces/*/stages/`) survived this decision but was **retired later the same month** with the
  estate consolidation (2026-08-12): the whole ICM-factory ambition is gone, and the control layer
  that replaced it is the lean `_system/` + `.claude/` pair — which itself moved out to
  `k0d0minio/icm-board` on 2026-08-26 (see below).
  Reason: too much machinery for a one-person consultancy whose actual need is knowing who is
  waiting to hear back.

## Business parameters (used by later passes)
- **Pricing numbers are never restated in docs.** _(Their former single source of truth,
  `_config/business/rates.md`, was retired with the factory in 2026-08; deal terms now live per
  client in Neon `biz.*` via the dashboard.)_ Tiered good/better/best by default; price
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

## 2026-08-26 — the control layer gets its own repo

- **`icm-board` is the orchestrator; this repo is one of its projects.** `_system/`, the
  three commands (`/project`, `/day`, `/icm-check`) and the two agents left for
  `k0d0minio/icm-board`, which sits at `~/Apps` with every repo — this one included —
  checked out beneath it as `projects/<name>`. This repo kept the remote, the history, the
  CI, the Vercel wiring and the `JN-*` series.
  Reason: **tickets and workflows belong next to the logic they describe.** A ticket about
  `_system/scripts/` was being filed against a repo full of Next.js apps, and CI here was
  building four websites on commits that only touched estate doctrine.
- **The `JN-*` series split by subject, not by convenience.** Estate/process work became
  `ICM-*` in the new repo (the heartbeat, the `/day` run log, ticket lint, housekeeping,
  discovery templates, and the two open security P0s); product work stayed here. Numbers
  were **not** reused on either side — `JN-016`, `-022`, `-025`, `-026`, `-028`, `-029`,
  `-030` are retired here and their successors are named in each moved ticket.
- **The dashboard's board shows both house repos.** `lib/tickets.ts` gained a
  `HOUSE_REPOS` list, so estate tickets stay visible next to product and client work —
  the board is now the only surface where the whole estate is seen at once, which is the
  point of it.
- **This repo must stand alone.** Nothing here reads `_system/` any more. Where a contract
  is needed locally it is restated (`.icm/intake/README.md`) rather than linked, so a cloud
  session on this repo is not missing half its rules.
