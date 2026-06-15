# 02 — Assessment — Contract
<!-- ICM Layer 2 — machine-loaded stage contract. Human narrative is in README.md. -->

## Inputs
- Layer 4 (working): [`../01_intake/output/`](../01_intake/output/) intake note
- Layer 3 (reference): [`../../references/scoring-rubric.md`](../../references/scoring-rubric.md), [`../../references/existing-solutions-heuristics.md`](../../references/existing-solutions-heuristics.md); [`../../setup/output/config.md`](../../setup/output/config.md) (weights, floor)

## Process
Score the three dimensions — fit, budget, strategic value (scoring-rubric.md); compute the weighted total; run an existing-solutions scan and classify BUILD / BUY / REDIRECT (existing-solutions-heuristics.md); flag any deal-breaker from setup.

## Outputs
- `assessment-<slug>.md` -> output/

## Integrations
- none

## Verify
- Each of the three dimensions scored with a one-line rationale; the build/buy/redirect call names at least one concrete alternative or "none found"; budget is checked against the floor in [`../../setup/output/config.md`](../../setup/output/config.md); any deal-breaker is flagged.

## Review gate
- none
