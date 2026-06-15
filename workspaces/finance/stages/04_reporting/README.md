# Stage 04 — Reporting

> **ICM role:** Layer 2 — stage
> **Purpose:** Produce a monthly/quarterly financial summary for the founder and for his accountant.

## What this folder accomplishes
This stage rolls up the ledgers and the reserve into one readable summary per period: income invoiced and collected, outstanding receivables, deductible expenses by category, net position, and the recommended tax reserve. It produces two views from the same data — a short founder view ("how is the business doing, what's owed, what to set aside") and an accountant-ready pack with the underlying figures and review flags. It is the final handoff of the finance pipeline.

**Decision-support only.** These summaries are management information, not certified accounts; they require review by a licensed Portuguese contabilista certificado before any official use.

## How it connects to the architecture
- **Upstream / reads from:** [`stages/01_income_tracking/`](../01_income_tracking/), [`stages/02_expense_tracking/`](../02_expense_tracking/), [`stages/03_tax_reserve/`](../03_tax_reserve/).
- **Downstream / feeds:** the founder (review gate); his contabilista certificado; [`workspaces/legal-and-tax/`](../../../legal-and-tax/) (period figures for filings); [`tracker/`](../../../../tracker/) (any follow-ups the report surfaces).
- **Draws on (Layer 3 reference):** [`../../references/`](../../references/) (chart-of-accounts-lite for grouping); [`_config/brand/voice/`](../../../../_config/brand/voice/) and [`_config/brand/visual/`](../../../../_config/brand/visual/) if a branded PDF is exported.

## Contents
- `output/` — generated period summaries (Layer 4).
- `templates/` — planned: layout for the founder view vs the accountant pack.  (Describe only; do not create.)

## Stage contract
### Inputs
- Layer 4 (working): outputs of stages 01–03 for the period.
- Layer 3 (reference): [`../../references/`](../../references/) for category grouping.
### Process
The agent aggregates income, expenses and reserve for the period, computes net position and outstanding receivables, and writes a founder summary plus an accountant pack listing review-needed items.
### Outputs
- `<period>-summary.md` -> output/
- `<period>-accountant-pack.md` -> output/
### Verify
- Report totals equal the sum of stages 01/02 rows; reserve matches stage 03; period boundaries are consistent; every "review-needed" expense from stage 02 is carried forward; disclaimer present.

## Notes
Name outputs by period (e.g. `2026-Q2`). The founder view is for Jamie's morning routine; the accountant pack is the formal handoff. Keep it a summary — detail lives in the stage ledgers, not here.
