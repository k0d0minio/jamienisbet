# Stage 03 — Setup Execution

> **ICM role:** Layer 2 — stage (narrative; contract in CONTEXT.md)
> **Purpose:** Turn the chosen structure into a concrete, ordered registration checklist Jamie can execute in Portugal.

## What this folder accomplishes
Once a direction is chosen and confirmed by the contabilista, this stage produces the step-by-step path to actually exist as a legal entity. It sequences: confirming NIF and Finanças access; declaring start of activity (início de atividade) with the right activity codes / **CAE**; registering with **Segurança Social** and setting the contribution base; opening a dedicated **business bank account** (for clean bookkeeping and IBAN of record); and handling **IVA/VAT** registration and the OSS question for EU clients. Each item has who-does-it (Jamie vs contabilista), where (Portal das Finanças, Segurança Social Direta, bank), and what's needed.

> **DISCLAIMER:** Decision-support only. Do not file anything without a licensed Portuguese contabilista certificado / lawyer reviewing the chosen codes, regime, and obligations.

## How it connects to the architecture
- **Upstream / reads from:** [`../02_entity_options/output/`](../02_entity_options/)
- **Downstream / feeds:** [`../04_tax_optimization/`](../04_tax_optimization/); on completion, write entity facts (legal form, CAE, IVA status, business IBAN) back to [`_config/business/`](../../../../_config/business/)
- **Draws on (Layer 3 reference):** [`../../references/`](../../references/)

## Contents
- [`CONTEXT.md`](CONTEXT.md) — the Layer 2 contract this stage executes.
- `output/` — the registration checklist and status tracker

## Notes
Runs once at incorporation. Re-run only on a structural change (e.g., converting ENI to Lda.).

> Contract: see [CONTEXT.md](CONTEXT.md).
