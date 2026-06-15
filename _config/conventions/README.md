# Conventions — The ICM Protocol for This Repo

> **ICM role:** Layer 3 — reference
> **Purpose:** The canonical explainer of how this whole repo works — the five ICM layers, the README-as-context convention, how to build a workspace, and the discipline that keeps it scalable.

## What this folder accomplishes
This is the document a new collaborator (human or agent) reads first to understand the system. It localizes the Interpretable Context Methodology — "folder structure as agent architecture" — to Jamie's business: each folder is a stage that does one job and writes to its own `output/`; everything is plain-text markdown a human can edit; an agent loads only the context a stage needs; every output is reviewed at a human "review gate" before the next stage runs; and the factory (`_config/`) is configured once so each run just produces a new deliverable.

## How it connects to the architecture
- **Upstream / reads from:** human input; the root [`CLAUDE.md`](../../CLAUDE.md) (Layer 0 identity/router).
- **Downstream / feeds:** every workspace router and stage README across [`workspaces/`](../../workspaces/), [`projects/`](../../projects/), [`shared/`](../../shared/), and [`websites/`](../../websites/) follows the rules defined here.
- **Draws on (Layer 3 reference):** [`_config/brand/`](../brand/) and [`_config/business/`](../business/) as the canonical reference targets stages cite.

## Contents
- `the-five-layers.md` — Layer 0 root `CLAUDE.md`; Layer 1 workspace `README.md` (router); Layer 2 stage `README.md` (contract); Layer 3 reference (`_config/`, `shared/`, `references/`); Layer 4 working artifacts (`output/`).  *(planned — do not create)*
- `readme-as-context.md` — why each folder's `README.md` doubles as its ICM context file (human- and agent-readable); only root `CLAUDE.md` is a separate Layer 0 file.  *(planned)*
- `building-a-workspace.md` — copy [`workspaces/_template-workspace/`](../../workspaces/); stage numbering `01_x`, `02_y`, `03_z` (snake_case) encodes execution order; stage N's `output/` is stage N+1's input.  *(planned)*
- `review-gates.md` — the edit-surface discipline: a human reviews/edits each `output/` before the next stage runs.  *(planned)*
- `provenance-and-verify.md` — forward-looking practices: outputs cite their sources (traceability), each stage contract has a `Verify` section, fix the Layer 3 reference not the one-off output (edit-source), and re-run only changed stages (incremental re-runs).  *(planned)*

## Notes
These conventions are stable across all runs — they are the protocol, not any deliverable. When the methodology evolves, update it here so every workspace inherits the change. New per-project pipelines are created by copying [`projects/_template-project/`](../../projects/_template-project/) and following these same rules.
