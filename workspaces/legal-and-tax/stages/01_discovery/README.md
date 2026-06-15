# Stage 01 — Discovery

> **ICM role:** Layer 2 — stage (narrative; contract in CONTEXT.md)
> **Purpose:** Interrogate Jamie's full situation so every downstream decision rests on a complete, human-edited picture.

## What this folder accomplishes
This is the direction-setting first stage and gets the heaviest human editing. The agent asks many questions and records answers: residency status in Mafra and tax residency; current NIF/Finanças status; income sources (consulting day-rate, landing-page websites, future products); where clients are located (Portugal, EU, non-EU — which changes VAT treatment); realistic revenue expectations for the next 12–24 months; liability exposure and risk appetite; goals (maximise take-home vs protect assets vs keep it simple); family/IRS context; and whether a contabilista is already engaged. Output is a structured situation brief that anchors entity selection.

> **DISCLAIMER:** Decision-support only — a licensed Portuguese contabilista certificado / lawyer must review.

## How it connects to the architecture
- **Upstream / reads from:** [`../../setup/questionnaire.md`](../../setup/); [`_config/business/`](../../../../_config/business/)
- **Downstream / feeds:** [`../02_entity_options/`](../02_entity_options/) (reads this `output/`)
- **Draws on (Layer 3 reference):** [`../../references/`](../../references/)

## Contents
- [`CONTEXT.md`](CONTEXT.md) — the Layer 2 contract this stage executes.
- `output/` — the situation brief produced by this stage

## Notes
Bias toward more questions. Wrong assumptions here propagate to entity choice; surface gaps rather than fill them.

> Contract: see [CONTEXT.md](CONTEXT.md).
