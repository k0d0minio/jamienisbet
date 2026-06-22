# Conventions — The ICM Protocol for This Repo

> **ICM role:** Layer 3 — reference
> **Purpose:** The canonical explainer of how this whole repo works — the five ICM layers, the README/CONTEXT convention, how to build a workspace, and the discipline that keeps it lean and scalable.

## What this folder accomplishes
This is the document set a new collaborator (human or agent) reads first to understand the system.
It localizes the Interpretable Context Methodology — "folder structure as agent architecture" — to
Jamie's business: each stage does one job and writes to its own `output/`; everything is plain-text
markdown a human can edit; an agent loads only the context a stage needs; every output is reviewed
at a human "review gate" before the next stage runs; and the factory (`_config/`) is configured
once so each run just produces a new deliverable.

## How it connects to the architecture
- **Upstream / reads from:** human input; the root [`CLAUDE.md`](../../CLAUDE.md) (Layer 0 identity/router).
- **Downstream / feeds:** every workspace router, stage `CONTEXT.md`, script, and `output/` across
  [`workspaces/`](../../workspaces/), [`projects/`](../../projects/), [`shared/`](../../shared/),
  [`websites/`](../../websites/), [`scripts/`](../../scripts/), and [`state/`](../../state/) follows
  the rules defined here.
- **Draws on (Layer 3 reference):** [`_config/brand/`](../brand/) and [`_config/business/`](../business/)
  as the canonical reference targets stages cite.

## Contents

### The method (ICM core)

- [`the-five-layers.md`](the-five-layers.md) — the five context layers and how this repo maps onto them.
- [`readme-as-context.md`](readme-as-context.md) — the `README.md` (narrative) / `CONTEXT.md` (contract) split.
- [`building-a-workspace.md`](building-a-workspace.md) — create a capability by copying a folder, not writing code.
- [`review-gates.md`](review-gates.md) — the edit-surface discipline and the autonomy policy.
- [`provenance-and-verify.md`](provenance-and-verify.md) — Verify, provenance markers, and the edit→source loop.
- [`stage-contracts.md`](stage-contracts.md) — the canonical six-section `CONTEXT.md` schema, numbering, versioning.

### Operations

- [`scripts-and-integrations.md`](scripts-and-integrations.md) — the `scripts/` layer and the outbound-action boundary.
- [`state-and-status.md`](state-and-status.md) — per-entity front-matter, status sets, and the metrics dashboard.
- [`client-and-slug.md`](client-and-slug.md) — the client slug and the per-client footprint (in-repo vs external repo).
- [`macro-pipeline.md`](macro-pipeline.md) — how a client flows across workspaces (the pipeline-of-pipelines).

### Governance & scale

- [`governance.md`](governance.md) — decision-support disclaimer, GDPR/RGPD, secrets.
- [`model-and-scaling.md`](model-and-scaling.md) — model policy, the new-workspace rule, the validation checklist.

### Record

- [`decisions.md`](decisions.md) — terse register of the locked decisions.

## Notes
These conventions are stable across all runs — they are the protocol, not any deliverable. When the
methodology evolves, update it here so every workspace inherits the change (fix the source, not the
output). New per-project pipelines are created by copying [`projects/_template-project/`](../../projects/_template-project/);
new capabilities by copying [`workspaces/_template-workspace/`](../../workspaces/_template-workspace/) —
both following these same rules.
