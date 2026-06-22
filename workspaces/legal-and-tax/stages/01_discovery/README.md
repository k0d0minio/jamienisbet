# Stage 01 — Discovery (Situation Confirmation)

> **ICM role:** Layer 2 — stage (narrative; contract in CONTEXT.md)
> **Purpose:** Confirm the locked situation config still holds and flag any change that would re-open the structure decision.

## What this folder accomplishes
The structure decision is already made and the situation is captured in [`../../setup/output/config.md`](../../setup/). So this stage is no longer an open interrogation — it is a **confirmation gate**: the agent walks the locked config (residency, ~€50k invoicing, 100% foreign clients, profit fully drawn, no liability need, two dependents) and checks each is still true, then tests the **revisit triggers** (income ~€100k+, real liability exposure, profit retention becoming possible). If everything holds it produces a short situation brief confirming the basis; if something changed it flags it loudly so Stage 02 can re-open the decision.

> **DISCLAIMER:** Decision-support only — a licensed Portuguese contabilista certificado / lawyer must review.

## How it connects to the architecture
- **Upstream / reads from:** [`../../setup/output/config.md`](../../setup/) (locked situation); [`../../references/portugal-business-structure-analysis.md`](../../references/portugal-business-structure-analysis.md) (the decision basis)
- **Downstream / feeds:** [`../02_entity_options/`](../02_entity_options/) (reads this `output/`)
- **Draws on (Layer 3 reference):** [`../../references/decision-basis.md`](../../references/decision-basis.md)

## Contents
- [`CONTEXT.md`](CONTEXT.md) — the Layer 2 contract this stage executes.
- `output/` — the situation brief (confirms the config, or flags deltas)

## Notes
Cheap when nothing changed; important when something did. Surface deltas rather than absorb them.

> Contract: see [CONTEXT.md](CONTEXT.md).
