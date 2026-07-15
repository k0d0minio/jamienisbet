# Triage References

> **ICM role:** Layer 3 — reference
> **Purpose:** Hold the stable scoring rubric and decision criteria that every triage run evaluates against.

## What this folder accomplishes
This is the recipe the triage stages follow. It defines the three rubric dimensions (**fit, budget, strategic value**), how each is scored, the build-vs-buy-vs-redirect heuristics, and the GO / REDIRECT / NO-GO decision criteria. Because it is stable Layer 3 reference, it does not change per run — only when Jamie deliberately recalibrates how he judges work. Keeping it here means a fast in-meeting score is consistent and explainable every time.

## How it connects to the architecture
- **Upstream / reads from:** [`../setup/`](../setup/) for Jamie's weights and thresholds (the numbers that parameterize this rubric)
- **Downstream / feeds:** [`../stages/02_assessment/`](../stages/02_assessment/) (scoring) and [`../stages/03_recommendation/`](../stages/03_recommendation/) (decision cut-offs); intake checklist used by [`../stages/01_intake/`](../stages/01_intake/)
- **Draws on (Layer 3 reference):** [`_config/business/founder-brief.md`](../../../_config/business/founder-brief.md) for strategic direction; [`_config/conventions/`](../../../_config/conventions/)

## Contents
- [`scoring-rubric.md`](scoring-rubric.md) — the three dimensions (fit/budget/strategic value), 0–5 scales, weights.
- [`decision-criteria.md`](decision-criteria.md) — hard gates + weighted cut-offs for GO / REDIRECT / NO-GO.
- [`existing-solutions-heuristics.md`](existing-solutions-heuristics.md) — build vs buy vs redirect (and why honesty pays).
- [`intake-checklist.md`](intake-checklist.md) — the lean capture fields for the 5-minute mode.

## Notes
Edit this only when recalibrating judgement, and prefer to keep the per-business numbers in [`../setup/`](../setup/) so the rubric stays portable. Any profitability or tax-related scoring logic is decision-support only and must be validated by a licensed Portuguese contabilista certificado before being treated as fact.
