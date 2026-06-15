# Stage 02 — Expense Tracking

> **ICM role:** Layer 2 — stage
> **Purpose:** Log deductible business expenses so they can offset income and feed tax optimisation.

## What this folder accomplishes
This stage is the expense ledger. Every business cost Jamie incurs — software subscriptions, hardware, co-working, professional fees, travel for client work — is recorded with date, vendor, amount, IVA paid, and a chart-of-accounts-lite category. Categorising consistently is what lets the legal-and-tax workspace identify deductible items and lets the reserve stage net IVA. It is the expense side of the bookkeeping pipeline.

**Decision-support only.** Deductibility is a planning assumption here; whether an expense is actually deductible must be confirmed by a licensed Portuguese contabilista certificado.

## How it connects to the architecture
- **Upstream / reads from:** human input (receipts, invoices received, bank statements).
- **Downstream / feeds:** [`stages/03_tax_reserve/`](../03_tax_reserve/) (deductible totals, IVA paid); [`stages/04_reporting/`](../04_reporting/); [`workspaces/legal-and-tax/`](../../../legal-and-tax/) (tax optimisation).
- **Draws on (Layer 3 reference):** [`../../references/`](../../references/) (chart-of-accounts-lite expense categories, IVA-rate notes).

## Contents
- `output/` — the expense ledger (Layer 4 handoff).
- `receipts/` — planned: filed scans/PDFs referenced by ledger rows.  (Describe only; do not create.)

## Stage contract
### Inputs
- Layer 4 (working): receipts and bank statements provided by Jamie.
- Layer 3 (reference): [`../../references/`](../../references/) expense categories and IVA-rate notes.
### Process
The agent appends each expense to the ledger, assigns a chart-of-accounts-lite category, flags it as likely-deductible or review-needed, and records IVA paid for later netting.
### Outputs
- `expense-ledger.md` -> output/
### Verify
- Every row has a category from the chart-of-accounts-lite; IVA amounts use a rate present in [`../../references/`](../../references/); flagged-uncertain items are listed for accountant review; totals reconcile to provided statements.

## Notes
Append-only; keep the source receipt reference on each row so the accountant can audit. When unsure about deductibility, mark "review-needed" rather than guessing — that flag is the contabilista handoff. EUR only.
