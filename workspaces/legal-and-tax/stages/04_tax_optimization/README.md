# Stage 04 — Tax Optimization

> **ICM role:** Layer 2 — stage (narrative; contract in CONTEXT.md)
> **Purpose:** The strictly-legal levers that minimise tax under the chosen simplified-regime structure.

## What this folder accomplishes
With the structure decided, this recurring stage surfaces the legal levers that matter for *this* setup — and ignores the ones that don't. The big one is the **0.75 vs 0.35 coefficient** classification (it moves more money than any other choice). Then: capturing the **startup benefits** (year-1 SS exemption; coefficient reduction −50% yr1 / −25% yr2) by timing the start date; using the **±25% social-security adjustment** to smooth lumpy project income; the **dependent-child IRS credits**; and the **15% expense-justification rule** (keep receipts; SS counts toward it). It deliberately does *not* chase itemised deductions — under the simplified regime the 25% allowance is deemed, so that effort doesn't move the base.

> **DISCLAIMER:** Decision-support only. The coefficient position and every figure must be confirmed by a licensed Portuguese contabilista certificado before being claimed or filed.

## How it connects to the architecture
- **Upstream / reads from:** [`../03_setup_execution/output/`](../03_setup_execution/); actuals from [`workspaces/finance/`](../../../finance/)
- **Downstream / feeds:** [`workspaces/finance/`](../../../finance/) (tax-reserve %, the 15% justification tracking); [`../05_compliance_calendar/`](../05_compliance_calendar/)
- **Draws on (Layer 3 reference):** [`../../references/accounting-regimes.md`](../../references/accounting-regimes.md), [`../../references/social-security-notes.md`](../../references/social-security-notes.md), [`../../references/irs-rates-2026.md`](../../references/irs-rates-2026.md), [`../../references/deductible-categories.md`](../../references/deductible-categories.md)

## Contents
- [`CONTEXT.md`](CONTEXT.md) — the Layer 2 contract this stage executes.
- `output/` — the optimisation plan + action list

## Notes
Re-run at least annually before IRS season, and when income band or the law shifts. No grey positions — the coefficient question is for the contabilista, not a blind self-selection.

> Contract: see [CONTEXT.md](CONTEXT.md).
