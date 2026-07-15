# Stage 01 — Intake

> **ICM role:** Layer 2 — stage (narrative; contract in CONTEXT.md)
> **Purpose:** Rapidly capture a project or idea — the ask, scope, who, and constraints — fast and low-friction enough to run live in a meeting.

## What this folder accomplishes
This is the fast-capture front door. While Jamie is on a call or face-to-face, the agent records the essentials with minimum friction: what the customer actually wants, rough scope, who they are, budget/timeline/tech constraints, and any hard deal-breakers. The output is a clean, structured intake note that the assessment stage can score immediately — no homework, no "I'll get back to you".

## How it connects to the architecture
- **Upstream / reads from:** human input (live meeting / call); the client record in the admin dashboard (Neon `biz.clients`) if the customer already exists; [`lead-generation/`](../../../lead-generation/) qualifying notes
- **Downstream / feeds:** [`../02_assessment/`](../02_assessment/) reads this stage's `output/`
- **Draws on (Layer 3 reference):** [`../../references/`](../../references/) for the intake field checklist; [`_config/business/founder-brief.md`](../../../../_config/business/founder-brief.md)

## Contents
- [`CONTEXT.md`](CONTEXT.md) — the Layer 2 contract this stage executes.
- `output/` — the captured intake note(s), one per triaged idea (Layer 4 handoff)
- `intake-template.md` — planned: the rapid-capture field set (ask / scope / who / constraints / budget / timeline / red flags)

## Notes
Optimize for speed over completeness — an 80%-complete intake captured live beats a perfect one sent later. Mark assumptions clearly so they surface at the review gate before assessment.

> Contract: see [CONTEXT.md](CONTEXT.md).
