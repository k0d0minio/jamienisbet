# 01 — Income Tracking — Contract
<!-- ICM Layer 2 — machine-loaded stage contract. Human narrative is in README.md. -->

## Inputs
- Layer 4 (working): invoice records from [`workspaces/proposals/`](../../../proposals/) `07_invoice/output/`.
- Layer 3 (reference): [`../../references/`](../../references/) income categories; [`shared/clients/`](../../../../shared/clients/).

## Process
The agent appends each issued invoice to the income ledger, marks paid invoices against bank confirmation, and recomputes the outstanding-receivables list (amount and days overdue).

## Outputs
- `income-ledger.md` -> output/
- `outstanding-receivables.md` -> output/

## Integrations
- none

## Verify
- Every invoice number here exists in `proposals/07_invoice`; client names match [`shared/clients/`](../../../../shared/clients/); no invoice is both paid and outstanding; amounts and IVA are internally consistent.

## Review gate
- none
