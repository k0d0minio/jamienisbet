# Stages — The Pipeline

> **ICM role:** Layer 1 — router (stage index)
> **Purpose:** Hold the numbered, single-job stages that make up this capability and define the order in which an agent runs them.

## What this folder accomplishes
This is the assembly line. Each child folder is exactly one stage that does exactly one job (Principle 1) and writes its result to its own `output/`. Stages are numbered to encode execution order (`01_x`, `02_y`, `03_z`), and stage N's `output/` becomes stage N+1's input — that handoff is the Layer 4 interface (Principle 2: plain text as the interface). Between stages sits a **review gate**: a human reads/edits the output before the next stage runs (Principle 4). The example `01_stage/` is a fill-in-the-blanks model of the required stage-contract format.

## How it connects to the architecture
- **Upstream / reads from:** [`../setup/`](../setup/) (the configured factory) and the first stage's own inputs.
- **Downstream / feeds:** the final stage's `output/` rolls up to [`../output/`](../output/), then typically to [`shared/clients/`](../../../shared/clients/) or a per-project pipeline in [`projects/`](../../../projects/).
- **Draws on (Layer 3 reference):** [`../references/`](../references/) and repo-wide references under [`_config/`](../../../_config/) and [`shared/`](../../../shared/).

## Contents
- `01_stage/` — example stage; the canonical stage-contract template (Inputs / Process / Outputs / Verify) to copy and rename.
- `02_*/`, `03_*/` — *(planned, do not create yet)* real stages, numbered in execution order, each with its own README contract and `output/`.

## How to add a stage
Copy `01_stage/` to the next number (e.g. `02_draft/`), rename it to its single job, fill in the stage contract, and list it here in order. Renumber if you insert a stage mid-pipeline. Keep one job per stage — if a stage does two things, split it.

## Notes
Layered context loading (Principle 3): a stage agent should load only this stage's README, its inputs, and the specific references it names — not the whole repo. This keeps runs cheap and focused, which matters for a solo consultancy.
