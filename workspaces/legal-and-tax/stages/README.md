# Legal & Tax — Stages

> **ICM role:** Layer 1 — router
> **Purpose:** Order and route the five numbered stages that move Jamie from "no entity" to "registered, compliant, tax-optimised."

## What this folder accomplishes
This folder holds the execution pipeline. Each stage is one job; its number encodes order; its `output/` is the handoff to the next stage. An agent loads only the context the active stage needs (layered context loading). Between stages the human edits the output at a review gate — nothing advances automatically.

> **DISCLAIMER:** Decision-support only. No output here is legal/tax/accounting advice; a licensed Portuguese contabilista certificado / lawyer reviews before action.

## How it connects to the architecture
- **Upstream / reads from:** [`../setup/output/config.md`](../setup/) (locked config); workspace router [`../README.md`](../README.md)
- **Downstream / feeds:** the dashboard's `/today` compliance calendar (`biz.compliance_dates`) and [`workspaces/finance/`](../../finance/) from Stage 05; [`_config/business/`](../../../_config/business/) once the entity is live
- **Draws on (Layer 3 reference):** [`../references/`](../references/)

## Contents
- `01_discovery/` — confirm the locked situation config; flag any revisit trigger.
- `02_entity_options/` — record the decided structure (trabalhador independente, regime simplificado) + the open coefficient lever.
- `03_setup_execution/` — the início-de-atividade action plan for the contabilista (regime, CIRS code, start date, VIES).
- `04_tax_optimization/` — the legal levers under the simplified regime (coefficient, startup benefits, SS smoothing, dependents).
- `05_compliance_calendar/` — generates the filing deadlines that seed the dashboard's `/today` compliance calendar and feed finance.

## Flow
01 → 02 → 03 → 04 → 05. Each stage reads the previous stage's `output/`, does its one job, writes to its own `output/`, then stops for human review.

## Notes
Stage 01 confirms the situation; Stage 02 records the made decision (re-opens only if a revisit trigger fires); 03 runs once at registration; 04–05 recur (re-run before IRS season or when the law/regime changes).
