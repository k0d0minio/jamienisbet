# Stage 06 — Contract (Agreement Generation)

> **ICM role:** Layer 2 — stage
> **Purpose:** Generate the engagement contract that locks the agreed scope, price, and terms once the client accepts the quote.

## What this folder accomplishes
When the quote is accepted, this stage drafts the contract that formalizes the deal: parties, scope of work, the agreed price from the quote, payment schedule, milestones, IP and confidentiality, and termination terms. It pulls Jamie's legal entity details and the master contract template so the document is consistent with the rest of the business's paperwork and on-brand. This is a generation-and-review stage, never an auto-send stage.

> **Disclaimer:** This stage produces a draft for decision-support only. The output must be reviewed by a licensed Portuguese lawyer (and tax points by a contabilista certificado) before signing. Nothing here is legal advice or a statement of legal fact.

## How it connects to the architecture
- **Upstream / reads from:** [`../05_quote/output/`](../05_quote/) (price, scope, terms)
- **Downstream / feeds:** [`../07_invoice/`](../07_invoice/); a new delivery pipeline in [`projects/`](../../../../projects/) once signed
- **Draws on (Layer 3 reference):** [`shared/templates/`](../../../../shared/templates/) (contract template); [`_config/business/`](../../../../_config/business/) (legal entity, NIF/VAT, address); [`_config/brand/`](../../../../_config/brand/)

## Contents
- `output/` — Layer 4: the draft contract for this deal.

## Stage contract
### Inputs
- Layer 4 (working): accepted quote from [`../05_quote/output/`](../05_quote/)
- Layer 3 (reference): [`shared/templates/`](../../../../shared/templates/), [`_config/business/`](../../../../_config/business/)
### Process
Populate the contract template with parties, scope, agreed price, payment schedule, milestones, IP/confidentiality, and termination.
### Outputs
- `contract.md` -> output/
### Verify
- Price and scope match the accepted quote exactly; entity facts correct; no clause contradicts the quote's terms.
### Review gate
- MANDATORY professional review (lawyer; contabilista for tax) before Jamie signs or sends.

## Notes
Never present a generated contract as legally vetted. Flag any clause that needs counsel.
