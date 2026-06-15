# Stage 03 — Setup Execution

> **ICM role:** Layer 2 — stage
> **Purpose:** Turn the chosen structure into a concrete, ordered registration checklist Jamie can execute in Portugal.

## What this folder accomplishes
Once a direction is chosen and confirmed by the contabilista, this stage produces the step-by-step path to actually exist as a legal entity. It sequences: confirming NIF and Finanças access; declaring start of activity (início de atividade) with the right activity codes / **CAE**; registering with **Segurança Social** and setting the contribution base; opening a dedicated **business bank account** (for clean bookkeeping and IBAN of record); and handling **IVA/VAT** registration and the OSS question for EU clients. Each item has who-does-it (Jamie vs contabilista), where (Portal das Finanças, Segurança Social Direta, bank), and what's needed.

> **DISCLAIMER:** Decision-support only. Do not file anything without a licensed Portuguese contabilista certificado / lawyer reviewing the chosen codes, regime, and obligations.

## How it connects to the architecture
- **Upstream / reads from:** [`../02_entity_options/output/`](../02_entity_options/)
- **Downstream / feeds:** [`../04_tax_optimization/`](../04_tax_optimization/); on completion, write entity facts (legal form, CAE, IVA status, business IBAN) back to [`_config/business/`](../../../../_config/business/)
- **Draws on (Layer 3 reference):** [`../../references/`](../../references/)

## Contents
- `output/` — the registration checklist and status tracker

## Stage contract
### Inputs
- Layer 4 (working): `../02_entity_options/output/recommended-direction.md` (contabilista-confirmed)
- Layer 3 (reference): `../../references/`
### Process
Generate an ordered checklist (Finanças → CAE → Segurança Social → bank → IVA), each step with owner, portal/location, prerequisites, and a confirm-with-contabilista flag.
### Outputs
- `registration-checklist.md` -> output/
- `entity-facts-to-record.md` -> output/  (handoff back to `_config/business/`)
### Verify
- Steps are correctly ordered (dependencies respected); CAE and IVA choices match Stage 02; every official step names the portal and notes contabilista sign-off.

## Notes
Runs once at incorporation. Re-run only on a structural change (e.g., converting ENI to Lda.).
