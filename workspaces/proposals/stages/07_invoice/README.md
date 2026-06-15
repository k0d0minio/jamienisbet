# Stage 07 — Invoice (Close & Hand Off to Finance)

> **ICM role:** Layer 2 — stage
> **Purpose:** Issue the closing invoice for the signed deal and hand the deal off to the finance workspace.

## What this folder accomplishes
This is the final stage of the deal pipeline. Once the contract is signed, it generates the invoice from the agreed price and payment schedule, rendered with Jamie's business identity (NIF/VAT, IBAN, address) and brand. Its real job is the handoff: the invoice and deal record move to [`workspaces/finance/`](../../../finance/), which owns accounting, payment tracking, and tax. This workspace's responsibility ends at "deal won, invoice issued."

> **Disclaimer:** Invoice content is decision-support only. Portuguese invoicing rules, IVA/VAT, and any retention/withholding must be confirmed by a licensed contabilista certificado before issuing. No tax figure here is asserted as fact.

## How it connects to the architecture
- **Upstream / reads from:** [`../06_contract/output/`](../06_contract/) (signed price/terms); [`../05_quote/output/`](../05_quote/) (line items)
- **Downstream / feeds:** [`workspaces/finance/`](../../../finance/) (accounting, payment tracking); [`shared/clients/`](../../../../shared/clients/) (mark deal won)
- **Draws on (Layer 3 reference):** [`shared/templates/`](../../../../shared/templates/) (invoice template); [`_config/business/`](../../../../_config/business/) (NIF/VAT, IBAN, address); [`_config/brand/`](../../../../_config/brand/)

## Contents
- `output/` — Layer 4: the issued invoice for this deal.

## Stage contract
### Inputs
- Layer 4 (working): signed contract + quote line items
- Layer 3 (reference): [`shared/templates/`](../../../../shared/templates/), [`_config/business/`](../../../../_config/business/)
### Process
Generate the invoice (number, dates, line items, totals, payment details) on brand; record the win against the client.
### Outputs
- `invoice.md` -> output/, then hand off to [`workspaces/finance/`](../../../finance/)
### Verify
- Invoice total matches the signed contract; business identity and payment details correct; numbering consistent with finance's scheme.
### Review gate
- Jamie + finance confirm before the invoice is sent; contabilista review for tax compliance.

## Notes
Finance owns the money trail from here. Keep the deal's `output/<client>/` folder as the closed record.
