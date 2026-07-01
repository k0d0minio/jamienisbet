# Legal & Tax — Output

> **ICM role:** Layer 4 — working
> **Purpose:** Hold the per-run artifacts this workspace produces — the decisions, checklists, and calendars.

## What this folder accomplishes
This is the product, not the recipe: the concrete deliverables of a run, each an edit surface Jamie reviews before it drives action. It collects the consolidated results that the individual stage `output/` folders feed up: the chosen entity direction, the registration checklist, the tax-optimisation action list, and the live compliance calendar. While each stage keeps its own `output/` for its hand-off to the next stage, this workspace-level folder is where the final, human-approved artifacts are consolidated for use by the rest of the business.

> **DISCLAIMER:** Everything here is decision-support only and must be reviewed by a licensed Portuguese contabilista certificado / lawyer before being acted on. No figure or legal conclusion is asserted as fact.

## How it connects to the architecture
- **Upstream / reads from:** the per-stage outputs in [`../stages/`](../stages/) (01–05)
- **Downstream / feeds:** [`tracker/`](../../../tracker/) (deadlines), [`workspaces/finance/`](../../finance/) (regime, deductibles, calendar), and [`_config/business/`](../../../_config/business/) (entity facts once registered)
- **Draws on (Layer 3 reference):** [`../references/`](../references/)

## Contents
- `situation-brief.md` — planned. Approved output of Stage 01.
- `entity-decision.md` — planned. Confirmed direction from Stage 02.
- `registration-checklist.md` — planned. From Stage 03.
- `optimization-action-list.md` — planned. From Stage 04.
- `compliance-calendar.md` — planned. From Stage 05; the artifact tracker/finance consume.
- (Do NOT create these files yet — described as planned.)

### Ad-hoc notes (created 2026-07-01)

- [`bar-management-decision.md`](bar-management-decision.md) — trial-period decision: invoice the bar's 75% profit-share from the trabalhador independente during the 3-month trial; migrate to a Unipessoal Lda if it sticks.
- [`contabilista-brief.md`](contabilista-brief.md) — the questions to settle with the contabilista before filing *início de atividade* / signing the bar contract (coefficient 0.35 vs 0.75, start date, IVA, single-client rule, bar structure).

## Notes
Layer 4 changes every run; references and setup do not. Treat each artifact as reviewed-and-frozen only after the human approves it at the stage's review gate. Date-stamp on consolidation so downstream systems know which run is current.
