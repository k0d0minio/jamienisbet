# 01 Stage (Example / Fill-in-the-Blanks)

> **ICM role:** Layer 2 — stage (narrative; contract in CONTEXT.md)
> **Purpose:** Demonstrate the canonical ICM stage format; copy and rename this to build a real stage.

## What this folder accomplishes
This is the model every stage follows. It does one job, reads its declared inputs, runs a defined
process, writes its result to `output/`, and verifies that result before the human review gate. The
human-readable narrative lives here in `README.md`; the strict, agent-loaded **contract** lives in
[`CONTEXT.md`](CONTEXT.md) with six mandatory sections — **Inputs / Process / Outputs / Integrations
/ Verify / Review gate**. Replace each `<…>` placeholder with the real thing when you copy this
folder into a real stage (e.g. `01_intake`, `02_draft`).

## How it connects to the architecture
- **Upstream / reads from:** `<previous stage>/output/` — or, for the first stage, [`../../setup/`](../../setup/) plus human input.
- **Downstream / feeds:** `<next stage>/` reads this stage's `output/`; the final stage rolls up to [`../../output/`](../../output/).
- **Draws on (Layer 3 reference):** [`../../references/`](../../references/), plus repo references such as [`_config/brand/voice/`](../../../../_config/brand/voice/), [`shared/templates/`](../../../../shared/templates/) as the job requires.

## Contents
- [`CONTEXT.md`](CONTEXT.md) — the Layer 2 contract this stage executes (the six-section schema).
- `output/` — this stage's Layer 4 handoff folder (where `<deliverable>.md` is written).

## Notes
Every output is an edit surface (Principle 4): the human reviews/edits `output/` before the next
stage runs. For any legal/tax/financial stage, treat outputs as decision-support only and cite the
standard disclaimer in [`_config/conventions/governance.md`](../../../../_config/conventions/governance.md);
never assert tax figures or legal conclusions as fact. Full schema in
[`_config/conventions/stage-contracts.md`](../../../../_config/conventions/stage-contracts.md).

> Contract: see [CONTEXT.md](CONTEXT.md).
