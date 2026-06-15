# Stage 04 — Reporting

> **ICM role:** Layer 2 — stage (narrative; contract in CONTEXT.md)
> **Purpose:** Produce the monthly P&L and quarterly IVA summary — and the dashboard metrics — from Stripe, on demand.

## What this folder accomplishes
This stage runs [`scripts/stripe-report.sh`](../../../../scripts/stripe-report.sh) (read-only) to roll up the period: income collected, outstanding/overdue receivables, and the recommended tax reserve. It produces two views from the same fetch — a short **founder view** ("how's the business, what's owed, what to set aside") and an **accountant pack** — plus the metrics the [`state/`](../../../../state/) dashboard shows (monthly revenue, overdue receivables, tax reserve). Quarterly, it adds the IVA/VIES filing summary. Nothing is a committed ledger; reports are generated and gitignored.

**Decision-support only.** Management information, not certified accounts — confirm with a licensed Portuguese contabilista certificado.

## How it connects to the architecture
- **Upstream / reads from:** **Stripe** via `scripts/stripe-report.sh`; [`stages/03_tax_reserve/`](../03_tax_reserve/) (the rate).
- **Downstream / feeds:** the founder (review gate) + his contabilista; [`state/`](../../../../state/) (metrics); [`workspaces/legal-and-tax/`](../../../legal-and-tax/) (period figures); [`tracker/`](../../../../tracker/).
- **Draws on (Layer 3 reference):** [`../../references/report-formats.md`](../../references/report-formats.md); [`_config/brand/`](../../../../_config/brand/) if a branded PDF is exported.

## Contents
- [`CONTEXT.md`](CONTEXT.md) — the Layer 2 contract this stage executes.
- `output/` — generated period summaries (gitignored).

## Notes
Name outputs by period (e.g. `2026-Q2`). The founder view feeds the morning routine; the accountant pack is the formal handoff. Detail lives in Stripe, not here.

> Contract: see [CONTEXT.md](CONTEXT.md).
