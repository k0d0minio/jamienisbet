# Legal & Tax — Stages

> **ICM role:** Layer 1 — router
> **Purpose:** Order and route the five numbered stages that move Jamie from "no entity" to "registered, compliant, tax-optimised."

## What this folder accomplishes
This folder holds the execution pipeline. Each stage is one job; its number encodes order; its `output/` is the handoff to the next stage. An agent loads only the context the active stage needs (layered context loading). Between stages the human edits the output at a review gate — nothing advances automatically.

> **DISCLAIMER:** Decision-support only. No output here is legal/tax/accounting advice; a licensed Portuguese contabilista certificado / lawyer reviews before action.

## How it connects to the architecture
- **Upstream / reads from:** [`../setup/questionnaire.md`](../setup/) (config); workspace router [`../README.md`](../README.md)
- **Downstream / feeds:** [`tracker/`](../../../tracker/) and [`workspaces/finance/`](../../finance/) from Stage 05; [`_config/business/`](../../../_config/business/) once the entity is live
- **Draws on (Layer 3 reference):** [`../references/`](../references/)

## Contents
- `01_discovery/` — question-heavy intake; sets direction (heavy human editing)
- `02_entity_options/` — compare PT structures as trade-offs (ENI vs Lda., simplified vs organised, incentive regimes)
- `03_setup_execution/` — registration checklist (Finanças, Segurança Social, CAE, bank, IVA)
- `04_tax_optimization/` — ongoing legal optimisation as decision-support
- `05_compliance_calendar/` — generates filing deadlines that feed tracker and finance

## Flow
01 → 02 → 03 → 04 → 05. Each stage reads the previous stage's `output/`, does its one job, writes to its own `output/`, then stops for human review.

## Notes
Stages 01–02 are direction-setting and revisited often; 03 runs once at incorporation; 04–05 are recurring (re-run on regime review or threshold crossing).
