# 05 — Quote — Contract
<!-- ICM Layer 2 — machine-loaded stage contract. Human narrative is in README.md. -->

## Inputs
- Layer 4 (working): proposal scope + strategy target/floor
- Layer 3 (reference): [`shared/templates/`](../../../../shared/templates/), [`../../references/`](../../references/), [`_config/business/`](../../../../_config/business/)

## Process
Build line items, apply the target rate, set payment terms and validity, render on brand.

## Outputs
- `quote.md` -> output/

## Integrations
- none

## Verify
- Headline price = strategy target and ≥ configured floor; line items reconcile to the proposal scope; business/payment details correct.

## Review gate
- Jamie confirms the number before it is sent or rolled into a contract.
