# Finance References

> **ICM role:** Layer 3 — reference
> **Purpose:** Stable reference material for the finance pipeline — a chart-of-accounts-lite and tax-rate notes — that all stages read but no stage rewrites per run.

## What this folder accomplishes
This is the recipe for the finance factory. It holds the lightweight chart of accounts (the small fixed set of income and expense categories Jamie uses) and a plain-text note of the IVA / IRS / Segurança Social rates and thresholds relevant to his situation. Stages cite these rather than inventing categories or guessing percentages, which keeps every ledger and every reserve calculation consistent and auditable.

**Decision-support only.** The rate notes here are working references for planning; they are not authoritative and must be confirmed against current law by a licensed Portuguese contabilista certificado / lawyer. Do not state any specific tax figure as settled fact without that review.

## How it connects to the architecture
- **Upstream / reads from:** [`_config/business/`](../../../_config/business/) (entity, NIF/VAT, regime facts); [`workspaces/legal-and-tax/`](../../legal-and-tax/) (any tax-rule research that informs the notes); [`setup/`](../setup/) (which regime applies).
- **Downstream / feeds:** every stage in [`stages/`](../stages/) — categories for 01/02, rates for 03, grouping for 04.
- **Draws on (Layer 3 reference):** [`_config/conventions/`](../../../_config/conventions/) for how reference folders are structured.

## Contents
- `chart-of-accounts-lite.md` — planned: the fixed list of income and expense categories.  (Describe only; do not create.)
- `tax-rate-notes.md` — planned: current IVA/IRS/Segurança Social rates and thresholds, each with a source and "confirm with contabilista" flag.  (Describe only; do not create.)

## Notes
Stable across runs — update these files deliberately (e.g. annual rate changes or a new regime), not every fiscal period; a change here ripples into stage 03's reserve. Keep the chart of accounts small on purpose; this is lightweight bookkeeping, not a full ledger system. Always pair a rate with its effective date so old reports remain explainable.
