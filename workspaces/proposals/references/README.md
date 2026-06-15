# Proposals — References (Negotiation Playbook & Pricing Models)

> **ICM role:** Layer 3 — reference
> **Purpose:** Hold the stable, run-agnostic knowledge the negotiation pipeline reasons from: how to question, how to negotiate, how to price.

## What this folder accomplishes
This is the recipe, not the meal. It stores the material that stays constant across every deal: the exhaustive discovery question bank that powers Stage 1, the negotiation playbook (anchoring patterns, value-vs-cost framing, a reusable objection library, hold/walk rules), and Jamie's pricing models (rate logic, tiered-option structures, value-estimation method). Stages load from here every run but never modify it — it changes only when Jamie deliberately refines his method.

## How it connects to the architecture
- **Upstream / reads from:** human input (Jamie's refinements); [`_config/business/`](../../../_config/business/) (canonical rates the pricing models are anchored to); [`shared/knowledge/`](../../../shared/knowledge/) (any cross-business playbooks)
- **Downstream / feeds:** [`../stages/01_intake/`](../stages/01_intake/) (question bank), [`../stages/02_deal_analysis/`](../stages/02_deal_analysis/) (value/price models), [`../stages/03_negotiation_strategy/`](../stages/03_negotiation_strategy/) (negotiation playbook), [`../stages/05_quote/`](../stages/05_quote/) (pricing models)
- **Draws on (Layer 3 reference):** [`../setup/`](../setup/) (workspace defaults that instantiate these models per Jamie)

## Contents
- `discovery-questions.md` — planned: the question-maximizing intake bank, grouped by topic (client, problem, budget, deciders, timeline, competition, drivers, value). Describe only.
- `negotiation-playbook.md` — planned: anchoring, framing, tiering, objection handling, hold/walk rules.
- `pricing-models.md` — planned: rate logic, tier structures, value-to-client estimation method.

## Notes
Keep pricing models aligned with [`_config/business/`](../../../_config/business/); if the canonical rate card moves, update here too. Pricing/value methods are commercial decision-support, not tax guidance — VAT/IVA and any statutory figures require a licensed contabilista certificado.
