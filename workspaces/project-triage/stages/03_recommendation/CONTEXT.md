# 03 — Recommendation — Contract
<!-- ICM Layer 2 — machine-loaded stage contract. Human narrative is in README.md. -->

## Inputs
- Layer 4 (working): [`../02_assessment/output/`](../02_assessment/output/) scored assessment
- Layer 3 (reference): [`../../references/`](../../references/) thresholds; [`_config/brand/voice/`](../../../../_config/brand/voice/)

## Process
Apply the cut-offs to reach GO / NO-GO / REDIRECT; write Jamie's internal rationale and next action; generate a customer-ready feedback page that is honest, useful, and brand-consistent — safe to share even on a NO-GO.

## Outputs
- `decision-<slug>.md` -> output/
- `customer-feedback-<slug>.md` -> output/

## Integrations
- none

## Verify
- Decision matches the assessment score against [`../../setup/`](../../setup/) thresholds; customer page contains no internal margin/rate numbers; tone matches [`_config/brand/voice/`](../../../../_config/brand/voice/); GO triggers a named downstream handoff

## Review gate
- none
