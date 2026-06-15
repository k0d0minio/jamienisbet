# Stage 02 — Expense Tracking

> **ICM role:** Layer 2 — stage (narrative; contract in CONTEXT.md)
> **Purpose:** Keep the receipts the 15% expense-justification rule needs — not an itemised expense ledger.

## What this folder accomplishes
Under the *regime simplificado*, expenses don't reduce the tax base (25% is a deemed allowance — see [`../../../legal-and-tax/references/deductible-categories.md`](../../../legal-and-tax/references/deductible-categories.md)). So this stage is deliberately light: it tracks the **receipts needed for the 15% expense-justification rule** (SaaS, office, hardware, the contabilista's fee — and mandatory SS counts toward it). There is **no detailed expense ledger** to maintain.

**Decision-support only.** Confirm what counts with a licensed Portuguese contabilista certificado.

## How it connects to the architecture
- **Upstream / reads from:** human input (receipts Jamie keeps).
- **Downstream / feeds:** [`stages/04_reporting/`](../04_reporting/) (the 15%-justification check); [`workspaces/legal-and-tax/`](../../../legal-and-tax/).
- **Draws on (Layer 3 reference):** [`../../../legal-and-tax/references/deductible-categories.md`](../../../legal-and-tax/references/deductible-categories.md).

## Contents
- [`CONTEXT.md`](CONTEXT.md) — the Layer 2 contract this stage executes.
- `output/` — a list of receipts kept for the 15% rule (gitignored); not a ledger.

## Notes
Don't over-engineer this — beyond the 15% justification, expense tracking doesn't move the simplified base. EUR only.

> Contract: see [CONTEXT.md](CONTEXT.md).
