# Stage 03 — Setup Execution (Início de Atividade Plan)

> **ICM role:** Layer 2 — stage (narrative; contract in CONTEXT.md)
> **Purpose:** Turn the decided structure into a concrete, ordered registration plan to execute with the contabilista.

## What this folder accomplishes
This produces the step-by-step path to actually register as a *trabalhador independente* under the simplified regime. It sequences (from the root analysis §7): declaring **início de atividade** at the Portal das Finanças under the regime simplificado; setting the **activity / CIRS code** (carrying the 0.75/0.35 coefficient question for the contabilista to decide); choosing a **start date** that maximises the year-1 social-security exemption and the reduced-coefficient window; **VIES** registration for intra-EU B2B services; and the **invoice wording** for reverse-charge / out-of-scope foreign clients. Each item names who does it (Jamie vs contabilista) and where. It is a decision-support pack to hand to the contabilista — nothing is filed by the agent.

> **DISCLAIMER:** Decision-support only. Do not file anything without a licensed Portuguese contabilista certificado reviewing the codes, regime, coefficient, and start date.

## How it connects to the architecture
- **Upstream / reads from:** [`../02_entity_options/output/`](../02_entity_options/)
- **Downstream / feeds:** [`../04_tax_optimization/`](../04_tax_optimization/); on registration, write entity facts (CIRS code, IVA/VIES status, start date) back to [`_config/business/entity.md`](../../../../_config/business/)
- **Draws on (Layer 3 reference):** [`../../references/`](../../references/) (accounting-regimes, iva-vat-notes, social-security-notes), [`../../../../portugal-business-structure-analysis.md`](../../../../portugal-business-structure-analysis.md) §7

## Contents
- [`CONTEXT.md`](CONTEXT.md) — the Layer 2 contract this stage executes.
- `output/` — the início-de-atividade action plan + status tracker

## Notes
Runs once at registration. The start date is a lever, not an afterthought — it sets when the SS-exempt and reduced-coefficient clocks start.

> Contract: see [CONTEXT.md](CONTEXT.md).
