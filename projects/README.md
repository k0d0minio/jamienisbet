# Projects — Per-Project Delivery Pipelines

> **ICM role:** Layer 1 — router (over a family of per-client working pipelines)
> **Purpose:** Hold one self-contained ICM mini-pipeline per active client/project, so each engagement Jamie delivers runs through its own discovery -> build -> delivery stages.

## What this folder accomplishes
This is where won work is tracked through delivery. Unlike a reusable capability, a project here is a single, named engagement — one folder per active client, keyed by the client slug (e.g. `projects/acme_lda/`), created by `scripts/new-project.sh` (which copies `_template-project/`) the moment a deal is won. **The actual build lives in the client's own external repo** with its own ICM pipeline; this folder holds only the docs-only delivery record — scope, milestones, acceptance, finances, and a `repo-link.md` pointer — and stays as a permanent, human-readable trail of what was scoped, delivered, and handed over.

## How it connects to the architecture
- **Upstream / reads from:** `workspaces/project-triage/` (is this lead worth doing?) and `workspaces/proposals/` (the signed proposal/scope that closes it) — a new project folder is spun up only after a proposal is accepted.
- **Downstream / feeds:** `workspaces/finance/` (milestone + final invoicing draws on accepted deliverables here) and `shared/clients/<client>/` (engagement outcome logged back to the CRM-lite registry).
- **Draws on (Layer 3 reference):** `_config/business/` (rates, terms), `_config/brand/visual/` + `_config/brand/voice/` (for client-facing deliverables), `shared/templates/` (work-order, acceptance), `shared/knowledge/` (delivery playbooks), and `_config/conventions/` (how ICM pipelines are structured).

## Lifecycle (where projects/ sits)
`workspaces/project-triage/` decides a lead is worth doing -> `workspaces/proposals/` negotiates and closes it -> a **copy of `_template-project/`** is created here as `projects/<client>/` and runs delivery -> `workspaces/finance/` invoices against its accepted milestones.

## projects/ vs workspaces/
- **`projects/`** = *execution*. One folder per concrete client engagement. Disposable-by-instance: a new one is born per lead, lives once, and is archived as a record.
- **`workspaces/`** = *reusable business capabilities* (triage, proposals, finance, marketing). They persist and are run repeatedly across many clients. (Principle 5: configure the factory once, run it per product.)

## Contents
- `_template-project/` — the canonical docs-only pipeline `new-project.sh` copies for every new project (never run in place); includes `repo-link.md`, the pointer to the client's external delivery repo.
- `<client-slug>/` — one live project per active engagement, slug-matched to `shared/clients/<slug>/` (created on win; not a tracked planned file).

## Notes
Keep the default pipeline lean (3 stages) so spinning up a new project is cheap. Bigger engagements may insert extra stages (e.g. `02a_design`, `04_maintenance`) — number them to preserve execution order. Stage outputs are review gates (Principle 4): Jamie approves each `output/` before the next stage runs.
