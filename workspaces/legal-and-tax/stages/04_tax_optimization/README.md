# Stage 04 — Tax Optimization

> **ICM role:** Layer 2 — stage (narrative; contract in CONTEXT.md)
> **Purpose:** Produce ongoing, strictly-legal tax-reduction decision-support for the running entity.

## What this folder accomplishes
With the entity live, this recurring stage surfaces legal ways to keep Jamie's effective tax burden low. It reviews: deductible business expenses appropriate to a software / AI consultant (hardware, software subscriptions, home-office portion, professional training, travel to clients); whether his current accounting regime is still the best fit as revenue grows (simplified vs organised); invoicing structure and timing; the social-security contribution base and whether adjusting it makes sense; and pension / insurance vehicles with tax treatment. Everything is framed as options with pros/cons for the contabilista to validate — nothing aggressive, nothing grey.

> **DISCLAIMER:** Decision-support only. Deductibility, rates, and regime thresholds are situation-specific and change yearly — a licensed Portuguese contabilista certificado must confirm before anything is claimed or filed. No figure here is asserted as fact.

## How it connects to the architecture
- **Upstream / reads from:** [`../03_setup_execution/output/`](../03_setup_execution/); [`_config/business/`](../../../../_config/business/); actuals from [`workspaces/finance/`](../../../finance/)
- **Downstream / feeds:** [`workspaces/finance/`](../../../finance/) (deductible categories, invoicing structure, regime choice); [`../05_compliance_calendar/`](../05_compliance_calendar/)
- **Draws on (Layer 3 reference):** [`../../references/`](../../references/)

## Contents
- [`CONTEXT.md`](CONTEXT.md) — the Layer 2 contract this stage executes.
- `output/` — the optimisation review and action list

## Notes
Re-run at least annually before IRS season and whenever revenue band shifts.

> Contract: see [CONTEXT.md](CONTEXT.md).
