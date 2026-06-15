# 07 — Invoice — Contract
<!-- ICM Layer 2 — machine-loaded stage contract. Human narrative is in README.md. -->

## Inputs
- Layer 4 (working): signed contract + quote line items
- Layer 3 (reference): [`shared/templates/`](../../../../shared/templates/), [`_config/business/`](../../../../_config/business/)

## Process
Generate the invoice (number, dates, line items, totals, payment details) on brand; record the win against the client.

## Outputs
- `invoice.md` -> output/, then hand off to [`workspaces/finance/`](../../../finance/)

## Integrations
- none

## Verify
- Invoice total matches the signed contract; business identity and payment details correct; numbering consistent with finance's scheme.

## Review gate
- Jamie + finance confirm before the invoice is sent; contabilista review for tax compliance.
