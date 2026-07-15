# Stages — The Pipeline

> **ICM role:** Layer 1 — router (stage index)
> **Purpose:** Hold the numbered, single-job stages that make up this capability and define the order in which an agent runs them.

## What this folder accomplishes
This is the assembly line. Each child folder is exactly one stage that does exactly one job (Principle 1) and writes its result to its own `output/`. Stages are numbered to encode execution order (`01_x`, `02_y`, `03_z`), and stage N's `output/` becomes stage N+1's input — that handoff is the Layer 4 interface (Principle 2: plain text as the interface). Between stages sits a **review gate**: a human reads/edits the output before the next stage runs (Principle 4). The example `01_stage/` is a fill-in-the-blanks model of the required stage-contract format.

## How it connects to the architecture
- **Upstream / reads from:** [`../setup/`](../setup/) (the configured factory) and the first stage's own inputs.
- **Downstream / feeds:** the final stage's `output/` rolls up to [`../output/`](../output/), then typically to the business state in Neon `biz.*` (via the admin dashboard) or a client's external delivery repo.
- **Draws on (Layer 3 reference):** [`../references/`](../references/) and repo-wide references under [`_config/`](../../../_config/) and [`shared/`](../../../shared/).

## Contents
- `01_stage/` — example stage: a `README.md` (narrative) + `CONTEXT.md` (the six-section contract — Inputs / Process / Outputs / Integrations / Verify / Review gate) to copy and rename.
- `02_*/`, `03_*/` — *(planned, do not create yet)* real stages, numbered in execution order, each with its own `README.md`, `CONTEXT.md`, and `output/`.

## How to add a stage
Copy `01_stage/` to the next number (e.g. `02_draft/`), rename it to its single job, fill in its `CONTEXT.md` contract (and trim the `README.md` to narrative), and list it here in order. Renumber — or use a letter suffix like `02a_` — if you insert a stage mid-pipeline. Keep one job per stage; if a stage does two things, split it. Schema: [`_config/conventions/stage-contracts.md`](../../../_config/conventions/stage-contracts.md).

## Notes
Layered context loading (Principle 3): a stage agent should load only this stage's README, its inputs, and the specific references it names — not the whole repo. This keeps runs cheap and focused, which matters for a solo consultancy.
