# Triage Setup

> **ICM role:** Layer 3 — reference (factory configuration)
> **Purpose:** Configure the triage factory once — Jamie's thresholds, weights, and what "worth my time" means — so every run uses the same standard.

## What this folder accomplishes
"Configure the factory, not the product." This is where Jamie sets up the triage workspace a single time: his minimum acceptable day rate floor, the strategic directions he wants to grow toward (and away from), red-flag deal-breakers, and how heavily each rubric dimension counts. The stages read this config so that a fast in-meeting score reflects Jamie's actual priorities rather than ad-hoc judgement. Reconfigure only when his business strategy shifts, not per project.

## How it connects to the architecture
- **Upstream / reads from:** human input (Jamie answering the questionnaire); [`_config/business/founder-brief.md`](../../../_config/business/founder-brief.md) and [`_config/business/`](../../../_config/business/) for rates and positioning
- **Downstream / feeds:** [`../references/`](../references/) (the rubric weights are anchored here); read by [`../stages/02_assessment/`](../stages/02_assessment/) and [`../stages/03_recommendation/`](../stages/03_recommendation/)
- **Draws on (Layer 3 reference):** [`_config/conventions/`](../../../_config/conventions/) for how to build/configure a workspace

## Contents
- [`questionnaire.md`](questionnaire.md) — the config interview (fit targets, floor, capacity, deal-breakers, weights).
- `output/config.md` — the **locked configuration** stages read (floor €90, weights, deal-breakers, modes). GO/REDIRECT/NO-GO cut-offs live in [`../references/decision-criteria.md`](../references/decision-criteria.md).

## Notes
This is stable Layer 3 config, edited rarely. Keep it plain markdown so Jamie can adjust a threshold in seconds. Rate floors and profitability assumptions captured here are business planning inputs, not accounting advice — any tax/financial framing must be reviewed by a licensed Portuguese contabilista certificado before being treated as fact.
