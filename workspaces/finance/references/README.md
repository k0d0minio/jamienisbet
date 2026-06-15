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
- [`tax-reserve-rates.md`](tax-reserve-rates.md) — the reserve % by year (year-1 SS-exempt vs steady-state), drawn from legal-and-tax.
- [`report-formats.md`](report-formats.md) — what the monthly P&L and quarterly IVA reports contain (from Stripe fetches).

## Notes
Stable across runs — update these files deliberately (e.g. annual rate changes or a new regime), not every fiscal period; a change here ripples into stage 03's reserve. Keep the chart of accounts small on purpose; this is lightweight bookkeeping, not a full ledger system. Always pair a rate with its effective date so old reports remain explainable.
