# 03 — Recommendation — Contract
<!-- ICM Layer 2 — machine-loaded stage contract. Human narrative is in README.md. -->

## Inputs
- Layer 4 (working): [`../02_assessment/output/`](../02_assessment/output/) scored assessment
- Layer 3 (reference): [`../../references/decision-criteria.md`](../../references/decision-criteria.md); [`../../setup/output/config.md`](../../setup/output/config.md) (deal-breakers, modes); [`_config/brand/voice/`](../../../../_config/brand/voice/)

## Process
Apply the hard gates then the cut-offs (decision-criteria.md) to reach GO / REDIRECT / NO-GO; write Jamie's internal rationale and next action. In **standalone mode**, produce a 5-minute verbal-ready summary (decision + the one reason + a concrete suggestion). In **gate mode**, a GO triggers `scripts/new-client.sh` and the handoff to proposals. Generate a customer-ready feedback page — honest and brand-consistent, safe to share even on a REDIRECT/NO-GO.

## Outputs
- `decision-<slug>.md` -> output/
- `customer-feedback-<slug>.md` -> output/

## Integrations
- none

## Verify
- Decision matches the assessment against decision-criteria.md (hard gates first); the customer page contains no internal margin/rate numbers; tone matches [`_config/brand/voice/`](../../../../_config/brand/voice/); a GO names the downstream handoff (client record → proposals).

## Review gate
- none
