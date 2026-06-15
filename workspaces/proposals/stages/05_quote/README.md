# Stage 05 — Quote (Priced to the Target Rate)

> **ICM role:** Layer 2 — stage
> **Purpose:** Produce the formal quote with line-item pricing set to the strategy's target rate, not a default rate.

## What this folder accomplishes
This stage prices the approved proposal. It takes the target price and tiered options from the negotiation strategy and turns them into a clean, itemized quote rendered on Jamie's brand. The whole point of the upstream coaching is realized here: the headline number reflects the negotiated target, sits at or above Jamie's configured standard rate, and never drops below his floor. The quote also states payment terms and validity so the negotiation has structure.

## How it connects to the architecture
- **Upstream / reads from:** [`../04_proposal/output/`](../04_proposal/) (scope/tiers); [`../03_negotiation_strategy/output/`](../03_negotiation_strategy/) (target vs floor)
- **Downstream / feeds:** [`../06_contract/`](../06_contract/)
- **Draws on (Layer 3 reference):** [`shared/templates/`](../../../../shared/templates/) (quote template); [`../../references/`](../../references/) (pricing models); [`_config/business/`](../../../../_config/business/) (rate card, IBAN, NIF/VAT, payment terms); [`_config/brand/`](../../../../_config/brand/)

## Contents
- `output/` — Layer 4: the priced quote for this deal.

## Stage contract
### Inputs
- Layer 4 (working): proposal scope + strategy target/floor
- Layer 3 (reference): [`shared/templates/`](../../../../shared/templates/), [`../../references/`](../../references/), [`_config/business/`](../../../../_config/business/)
### Process
Build line items, apply the target rate, set payment terms and validity, render on brand.
### Outputs
- `quote.md` -> output/
### Verify
- Headline price = strategy target and ≥ configured floor; line items reconcile to the proposal scope; business/payment details correct.
### Review gate
- Jamie confirms the number before it is sent or rolled into a contract.

## Notes
Pricing here is commercial decision-support. VAT/IVA treatment and any tax-inclusive figures must be confirmed with a licensed Portuguese contabilista certificado before issuing.
