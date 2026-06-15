# Stage 01 — Intake

> **ICM role:** Layer 2 — stage
> **Purpose:** Rapidly capture a project or idea — the ask, scope, who, and constraints — fast and low-friction enough to run live in a meeting.

## What this folder accomplishes
This is the fast-capture front door. While Jamie is on a call or face-to-face, the agent records the essentials with minimum friction: what the customer actually wants, rough scope, who they are, budget/timeline/tech constraints, and any hard deal-breakers. The output is a clean, structured intake note that the assessment stage can score immediately — no homework, no "I'll get back to you".

## How it connects to the architecture
- **Upstream / reads from:** human input (live meeting / call); [`shared/clients/`](../../../../shared/clients/) if the customer already exists; [`lead-generation/`](../../../lead-generation/) qualifying notes
- **Downstream / feeds:** [`../02_assessment/`](../02_assessment/) reads this stage's `output/`
- **Draws on (Layer 3 reference):** [`../../references/`](../../references/) for the intake field checklist; [`_config/business/founder-brief.md`](../../../../_config/business/founder-brief.md)

## Contents
- `output/` — the captured intake note(s), one per triaged idea (Layer 4 handoff)
- `intake-template.md` — planned: the rapid-capture field set (ask / scope / who / constraints / budget / timeline / red flags)

## Stage contract
### Inputs
- Layer 4 (working): human input captured live; existing client record from [`shared/clients/`](../../../../shared/clients/)
- Layer 3 (reference): [`../../references/`](../../references/) intake checklist
### Process
Agent prompts only for the fields needed to make a triage decision, fills them in real time, flags anything ambiguous, and keeps it brief. No evaluation happens here — capture only.
### Outputs
- `intake-<slug>.md` -> output/
### Verify
- All required fields present (ask, scope, who, constraints); customer name reconciled against [`shared/clients/`](../../../../shared/clients/); open questions explicitly listed so the assessment stage isn't guessing
## Notes
Optimize for speed over completeness — an 80%-complete intake captured live beats a perfect one sent later. Mark assumptions clearly so they surface at the review gate before assessment.
