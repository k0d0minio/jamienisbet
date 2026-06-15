# Legal & Tax — References

> **ICM role:** Layer 3 — reference
> **Purpose:** Hold the stable Portuguese tax/legal reference notes every stage draws on.

## What this folder accomplishes
This is the recipe, not the product: durable notes that stay constant across runs and are cited by the stages rather than re-derived each time. It holds plain-language explainers of the structures Jamie cares about (ENI vs Lda.), the simplified vs organised accounting distinction, how IVA applies to PT/EU/non-EU clients, Segurança Social basics for the self-employed, common deductible categories for a software / AI consultant, and a glossary (NIF, CAE, IES, SAF-T, OSS, início de atividade). Notes describe *how the rules work*, not specific current figures.

> **DISCLAIMER:** Reference notes are decision-support only and may go stale as Portuguese law changes. Nothing here is legal/tax/accounting advice — a licensed Portuguese contabilista certificado / lawyer is the source of truth. Specific rates, thresholds, and conclusions are intentionally not asserted as fact.

## How it connects to the architecture
- **Upstream / reads from:** human-curated knowledge; verified PT sources (Finanças, Segurança Social) — kept updated by Jamie/contabilista
- **Downstream / feeds:** every stage in [`../stages/`](../stages/) cites these notes
- **Draws on (Layer 3 reference):** [`shared/knowledge/`](../../../shared/knowledge/) for cross-workspace playbooks; [`_config/conventions/`](../../../_config/conventions/)

## Contents
- `entity-structures.md` — planned. ENI vs Lda. plain-language comparison.
- `accounting-regimes.md` — planned. Simplified vs organised, when each fits.
- `iva-vat-notes.md` — planned. VAT treatment by client geography (PT/EU/non-EU, OSS).
- `social-security-notes.md` — planned. Segurança Social basics for self-employed.
- `deductible-categories.md` — planned. Typical deductibles for AI consulting.
- `glossary.md` — planned. PT terms and acronyms.
- (Do NOT create these files yet — described as planned.)

## Notes
Stable across runs by design. When law changes, update here once and all stages inherit it. Date-stamp each note and record its source so staleness is visible.
