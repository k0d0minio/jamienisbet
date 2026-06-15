# Finance Setup

> **ICM role:** Layer 3 — reference (configure-the-factory)
> **Purpose:** Configure the finance workspace once — fiscal regime, reserve percentages, and cadence — so every later run reuses the same settings.

## What this folder accomplishes
This is the "configure the factory, not the product" step (Principle 5). Before any ledger is kept, Jamie answers a short questionnaire describing his current fiscal reality: whether he is operating yet as an entity or as a sole trader (recibos verdes / trabalhador independente), his IVA regime, his IRS coefficient situation, his Segurança Social status, and how much of each invoice to reserve. The stages read these answers instead of re-asking every month.

**Decision-support only.** The percentages captured here are planning assumptions and must be confirmed with a licensed Portuguese contabilista certificado before being relied on.

## How it connects to the architecture
- **Upstream / reads from:** human input (Jamie's answers); [`_config/business/`](../../../_config/business/) for legal entity, NIF/VAT and rate facts that may already be known.
- **Downstream / feeds:** every stage in [`stages/`](../stages/), especially [`stages/03_tax_reserve/`](../stages/03_tax_reserve/), which reads the reserve percentages from here.
- **Draws on (Layer 3 reference):** [`references/`](../references/) (tax-rate notes provide the candidate values the questionnaire confirms); [`_config/conventions/`](../../../_config/conventions/).

## Contents
- `questionnaire.md` — planned: the one-time setup answers (regime, IVA status, reserve % for IVA/IRS/Segurança Social, fiscal year start, reporting cadence, base currency EUR).  (Describe only; do not create.)
- `output/` — planned: the saved, confirmed configuration that stages load.

## Notes
Re-run setup only when Jamie's fiscal status changes (e.g. crosses an IVA threshold, incorporates, or changes regime) — not every fiscal period. Keep it short: this configures behaviour, it does not hold transaction data. Any change here should trigger a note to the contabilista.
