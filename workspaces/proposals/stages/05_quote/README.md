# Stage 05 — Quote (Priced to the Target Rate)

> **ICM role:** Layer 2 — stage (narrative; contract in CONTEXT.md)
> **Purpose:** Produce the formal quote with line-item pricing set to the strategy's target rate, not a default rate.

## What this folder accomplishes
This stage prices the approved proposal. It takes the target price and tiered options from the negotiation strategy and turns them into a clean, itemized quote rendered on Jamie's brand. The whole point of the upstream coaching is realized here: the headline number reflects the negotiated target, sits at or above Jamie's configured standard rate, and never drops below his floor. The quote also states payment terms and validity so the negotiation has structure.

## How it connects to the architecture
- **Upstream / reads from:** [`../04_proposal/output/`](../04_proposal/) (scope/tiers); [`../03_negotiation_strategy/output/`](../03_negotiation_strategy/) (target vs floor)
- **Downstream / feeds:** [`../06_contract/`](../06_contract/)
- **Draws on (Layer 3 reference):** [`shared/templates/`](../../../../shared/templates/) (quote template); [`../../references/`](../../references/) (pricing models); [`_config/business/`](../../../../_config/business/) (rate card, IBAN, NIF/VAT, payment terms); [`_config/brand/`](../../../../_config/brand/)

## Contents
- [`CONTEXT.md`](CONTEXT.md) — the Layer 2 contract this stage executes.
- `output/` — Layer 4: the priced quote for this deal.

## Notes
Pricing here is commercial decision-support. VAT/IVA treatment and any tax-inclusive figures must be confirmed with a licensed Portuguese contabilista certificado before issuing.

> Contract: see [CONTEXT.md](CONTEXT.md).
