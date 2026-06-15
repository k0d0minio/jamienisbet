# Stage 03 — Recommendation

> **ICM role:** Layer 2 — stage
> **Purpose:** Produce a go/no-go decision PLUS a structured customer-feedback deliverable Jamie can hand over immediately, in the same meeting.

## What this folder accomplishes
This is the payoff stage. It converts the scored assessment into a clear GO / NO-GO / REDIRECT call for Jamie, and — just as importantly — a clean, customer-facing feedback page written in Jamie's brand voice. That page gives the customer real value on the spot (what's strong, what's risky, whether to build or buy, rough direction) so Jamie never has to say "I'll get back to you". If GO, it sets up the handoff to a proposal and a new project pipeline.

## How it connects to the architecture
- **Upstream / reads from:** [`../02_assessment/output/`](../02_assessment/output/); [`../../setup/`](../../setup/) decision thresholds
- **Downstream / feeds:** [`../../output/`](../../output/) (final triage record + customer feedback); on GO -> [`proposals/`](../../../proposals/) and a new pipeline from [`projects/_template-project/`](../../../../projects/_template-project/); outcome logged to [`lead-generation/`](../../../lead-generation/)
- **Draws on (Layer 3 reference):** [`../../references/`](../../references/) decision criteria; [`_config/brand/voice/`](../../../../_config/brand/voice/) and [`_config/brand/assets/`](../../../../_config/brand/assets/) for a polished, on-brand handout; [`shared/templates/`](../../../../shared/templates/) for the email/feedback format

## Contents
- `output/` — the decision + customer-facing feedback deliverable (also surfaced to the workspace `output/`)
- `decision-template.md` — planned: internal go/no-go record
- `customer-feedback-template.md` — planned: the on-brand, hand-to-customer feedback page

## Stage contract
### Inputs
- Layer 4 (working): [`../02_assessment/output/`](../02_assessment/output/) scored assessment
- Layer 3 (reference): [`../../references/`](../../references/) thresholds; [`_config/brand/voice/`](../../../../_config/brand/voice/)
### Process
Apply the cut-offs to reach GO / NO-GO / REDIRECT; write Jamie's internal rationale and next action; generate a customer-ready feedback page that is honest, useful, and brand-consistent — safe to share even on a NO-GO.
### Outputs
- `decision-<slug>.md` -> output/
- `customer-feedback-<slug>.md` -> output/
### Verify
- Decision matches the assessment score against [`../../setup/`](../../setup/) thresholds; customer page contains no internal margin/rate numbers; tone matches [`_config/brand/voice/`](../../../../_config/brand/voice/); GO triggers a named downstream handoff
## Notes
The customer feedback is a deliverable in its own right — it should leave the customer feeling helped even when the answer is no. Any legal/tax/financial guidance included is decision-support only and must be reviewed by a licensed Portuguese contabilista certificado / lawyer before the customer relies on it.
