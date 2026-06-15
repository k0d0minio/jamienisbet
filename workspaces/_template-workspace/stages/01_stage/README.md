# 01 Stage (Example / Fill-in-the-Blanks)

> **ICM role:** Layer 2 — stage (contract)
> **Purpose:** Demonstrate the canonical ICM stage-contract format; copy and rename this to build a real stage.

## What this folder accomplishes
This is the model every stage follows. It does one job, reads its declared inputs, runs a defined process, writes its result to `output/`, and verifies that result before the human review gate. Replace each `<…>` placeholder below with the real thing when you copy this folder into a new stage (e.g. `01_intake`, `02_draft`). The structure — **Inputs / Process / Outputs / Verify** — is mandatory so any agent or human can pick up a stage cold.

## How it connects to the architecture
- **Upstream / reads from:** `<previous stage>/output/` — or, for the first stage, [`../../setup/`](../../setup/) plus human input.
- **Downstream / feeds:** `<next stage>/` reads this stage's `output/`; the final stage rolls up to [`../../output/`](../../output/).
- **Draws on (Layer 3 reference):** [`../../references/`](../../references/), plus repo references such as [`_config/brand/voice/`](../../../../_config/brand/voice/), [`shared/templates/`](../../../../shared/templates/), [`shared/knowledge/`](../../../../shared/knowledge/) as the job requires.

## Contents
- `output/` — this stage's Layer 4 handoff folder (where `<deliverable>.md` is written).

## Stage contract
### Inputs
- Layer 4 (working): `<previous-stage>/output/<file>.md` — or human input for stage 01.
- Layer 3 (reference): `<exact reference path this stage actually needs>`
### Process
`<Plain-language description of the single job: what the agent reads, the questions it asks the human, the transformation it performs. Keep it to one job — if it's two, it's two stages.>`
### Outputs
- `<deliverable>.md` -> `output/`
### Verify
- `<cross-stage consistency checks before the review gate — e.g. every required field from setup is filled; figures match the source input; tone matches _config/brand/voice/; no placeholder text remains.>`

## Notes
Every output is an edit surface (Principle 4): the human reviews/edits `output/` before the next stage runs. For any legal/tax/financial stage, treat outputs as decision-support only and add a one-line note that they require review by a licensed Portuguese contabilista certificado / lawyer; never assert tax figures or legal conclusions as fact.
