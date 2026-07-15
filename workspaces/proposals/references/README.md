# Proposals — References (Negotiation Playbook & Pricing Models)

> **ICM role:** Layer 3 — reference
> **Purpose:** Hold the stable, run-agnostic knowledge the negotiation pipeline reasons from: how to question, how to negotiate, how to price.

## What this folder accomplishes
This is the recipe, not the meal. It stores the material that stays constant across every deal: the exhaustive discovery question bank that powers Stage 1, the negotiation playbook (anchoring patterns, value-vs-cost framing, a reusable objection library, hold/walk rules), and Jamie's pricing models (rate logic, tiered-option structures, value-estimation method). Stages load from here every run but never modify it — it changes only when Jamie deliberately refines his method.

## How it connects to the architecture
- **Upstream / reads from:** human input (Jamie's refinements); [`_config/business/`](../../../_config/business/) (canonical rates the pricing models are anchored to)
- **Downstream / feeds:** [`../stages/01_intake/`](../stages/01_intake/) (question bank), [`../stages/02_deal_analysis/`](../stages/02_deal_analysis/) (value/price models), [`../stages/03_negotiation_strategy/`](../stages/03_negotiation_strategy/) (negotiation playbook), [`../stages/05_quote/`](../stages/05_quote/) (pricing models)
- **Draws on (Layer 3 reference):** [`../setup/`](../setup/) (workspace defaults that instantiate these models per Jamie)

## Contents
- [`discovery-questions.md`](discovery-questions.md) — the must-know checklist + the full intake question bank (powers Stage 01).
- [`negotiation-playbook.md`](negotiation-playbook.md) — anchoring, value framing, tiering, objection library, hold/walk, talk-track.
- [`pricing-models.md`](pricing-models.md) — rate logic, good/better/best tiering, value-based pricing, retainer/commission, IVA note.

## Notes
Keep pricing models aligned with [`_config/business/`](../../../_config/business/); if the canonical rate card moves, update here too. Pricing/value methods are commercial decision-support, not tax guidance — VAT/IVA and any statutory figures require a licensed contabilista certificado.
