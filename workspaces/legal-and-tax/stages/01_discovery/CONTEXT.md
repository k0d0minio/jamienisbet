# 01 — Discovery (Situation Confirmation) — Contract
<!-- ICM Layer 2 — machine-loaded stage contract. Human narrative is in README.md. -->

## Inputs
- Layer 4 (working): `../../setup/output/config.md` (the locked situation + decision)
- Layer 3 (reference): `../../references/decision-basis.md`; `../../references/portugal-business-structure-analysis.md`

## Process
Walk each parameter in the locked config and confirm it still holds; test the three revisit triggers (income ~€100k+, real liability exposure, profit retention becoming possible). Record confirmation, or flag any delta that warrants re-opening the structure decision.

## Outputs
- `situation-brief.md` -> output/

## Integrations
- none

## Verify
- Every config parameter is explicitly confirmed or flagged; no revisit trigger is silently ignored; any flagged delta names which downstream stage must react.

## Review gate
- Jamie confirms nothing material has changed (or approves re-opening the decision in Stage 02).
