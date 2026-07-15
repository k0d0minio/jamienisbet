# Legal & Tax — References

> **ICM role:** Layer 3 — reference
> **Purpose:** Hold the stable Portuguese tax/legal reference notes every stage draws on.

## What this folder accomplishes
This is the recipe, not the product: durable notes cited by the stages rather than re-derived each time. Because the **structure decision is made** (self-employed *trabalhador independente* under the *regime simplificado* — see [`decision-basis.md`](decision-basis.md)), these notes **operationalise** it: the chosen status and why it won, the simplified-regime mechanics and the open coefficient lever, social security, IVA for foreign clients, costs vs the deemed allowance, the 2026 IRS brackets, and a glossary. They distil [`portugal-business-structure-analysis.md`](portugal-business-structure-analysis.md) — each note carries its **source and an as-of date** so staleness is visible.

> **DISCLAIMER:** Reference notes are decision-support only and may go stale as Portuguese law changes. Nothing here is legal/tax/accounting advice — a licensed Portuguese contabilista certificado / lawyer is the source of truth. The 2026 figures here are included as decision-support, each with its source and as-of date — not asserted as eternal fact; re-verify as law changes. The activity-code coefficient (0.75 vs 0.35) must be assessed by a contabilista.

## How it connects to the architecture
- **Upstream / reads from:** human-curated knowledge; verified PT sources (Finanças, Segurança Social) — kept updated by Jamie/contabilista
- **Downstream / feeds:** every stage in [`../stages/`](../stages/) cites these notes
- **Draws on (Layer 3 reference):** [`_config/conventions/`](../../../_config/conventions/)

## Contents
- [`decision-basis.md`](decision-basis.md) — the made decision + revisit triggers; the spine.
- [`entity-structures.md`](entity-structures.md) — options considered and why freelancer won.
- [`accounting-regimes.md`](accounting-regimes.md) — simplified-regime mechanics + the 0.75/0.35 coefficient lever.
- [`social-security-notes.md`](social-security-notes.md) — 21.4%×70%, year-1 exemption, quarterly mechanics.
- [`iva-vat-notes.md`](iva-vat-notes.md) — VIES, EU reverse-charge, UK/US out of scope.
- [`deductible-categories.md`](deductible-categories.md) — costs vs the deemed allowance, the 15% rule.
- [`irs-rates-2026.md`](irs-rates-2026.md) — 2026 IRS brackets + coefficient impact + rates snapshot.
- [`glossary.md`](glossary.md) — PT terms and acronyms.

## Notes
Stable across runs by design. When law changes, update here once and all stages inherit it. Date-stamp each note and record its source so staleness is visible.
