# 02 — Expense Tracking — Contract
<!-- ICM Layer 2 — machine-loaded stage contract. Human narrative is in README.md. -->

## Inputs
- Layer 4 (working): receipts and bank statements provided by Jamie.
- Layer 3 (reference): [`../../references/`](../../references/) expense categories and IVA-rate notes.

## Process
The agent appends each expense to the ledger, assigns a chart-of-accounts-lite category, flags it as likely-deductible or review-needed, and records IVA paid for later netting.

## Outputs
- `expense-ledger.md` -> output/

## Integrations
- none

## Verify
- Every row has a category from the chart-of-accounts-lite; IVA amounts use a rate present in [`../../references/`](../../references/); flagged-uncertain items are listed for accountant review; totals reconcile to provided statements.

## Review gate
- none
