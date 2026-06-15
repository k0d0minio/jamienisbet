# Output — Project-Level Deliverable Rollup

> **ICM role:** Layer 4 — working
> **Purpose:** Hold the final, accepted deliverable and the project's closing record — the single place to look for "what did we ship and was it accepted?"

## What this folder accomplishes
This is the project's top-level handoff point, distinct from the per-stage `output/` folders inside `../stages/`. While each stage writes its own working artifacts, this folder collects the *rolled-up* result of the whole engagement: the final deliverable (or pointers to where it lives, e.g. a repo in `websites/` or an external client system), the signed acceptance, and a one-page project summary. It is the artifact `workspaces/finance/` references for final invoicing and the durable record left behind when the project is archived.

## How it connects to the architecture
- **Upstream / reads from:** `../stages/03_delivery/output/` (handoff, acceptance, retro) and the build artifacts referenced in `../stages/02_build/output/`.
- **Downstream / feeds:** `workspaces/finance/` (final/closing invoice draws on the accepted deliverable), `shared/clients/<client>/` (outcome logged to CRM-lite), and `shared/knowledge/` (reusable lessons from the retro).
- **Draws on (Layer 3 reference):** `_config/brand/` (final client-facing packaging), `shared/templates/` (closing summary format).

## Contents
- `final-deliverable.md` — what was shipped, plus links to where the actual artifact lives (repo, hosted site, client system).  *(planned)*
- `accepted-acceptance.md` — copy of the signed acceptance from `03_delivery/output/`.  *(planned)*
- `project-summary.md` — one-page close-out: scope vs delivered, dates, final value.  *(planned)*

## Notes
Per Principle 1, this folder is the project's own output surface — it does not duplicate stage internals, it summarises them. Any figures here (value delivered, invoice triggers) are decision-support only; final invoicing and any tax/financial treatment must be reviewed in `workspaces/finance/` and, where it has financial/legal weight, by a licensed Portuguese contabilista certificado / lawyer before issuance.
