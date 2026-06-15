# References — Workspace Layer 3

> **ICM role:** Layer 3 — reference
> **Purpose:** Hold the stable, run-to-run reference material specific to this capability — rubrics, checklists, voice notes, local templates.

## What this folder accomplishes
This is the recipe, not the meal. Anything that stays the same across runs of this capability lives here: scoring rubrics, decision checklists, capability-specific tone or formatting rules, and any local templates that extend the repo-wide masters. Stages load the slice they need from here (Principle 3) so their `output/` stays consistent every run. In the empty seed this folder is a placeholder; when you copy the workspace you populate it with the references that capability actually uses.

## How it connects to the architecture
- **Upstream / reads from:** stable reference, not produced by a run. Authored once by the operator, then edited rarely.
- **Downstream / feeds:** every stage in [`../stages/`](../stages/) — each names the specific reference file it loads.
- **Draws on / extends (repo-wide Layer 3):** [`_config/brand/voice/`](../../../_config/brand/voice/), [`_config/brand/visual/`](../../../_config/brand/visual/), [`_config/business/`](../../../_config/business/), [`shared/templates/`](../../../shared/templates/), [`shared/knowledge/`](../../../shared/knowledge/), [`_config/conventions/`](../../../_config/conventions/). Prefer linking to these repo-wide references over duplicating them; keep only this-capability-specific material here.

## Contents
- `rubric.md` — *(planned, do not create yet)* how this capability scores or decides quality.
- `checklist.md` — *(planned, do not create yet)* per-run review-gate checklist for the human.
- `voice-notes.md` — *(planned, do not create yet)* capability-specific tone tweaks on top of `_config/brand/voice/`.

## Notes
Keep references DRY: if a rule applies repo-wide, link to its canonical home under `_config/` or `shared/` rather than copying it. References here change rarely; per-run content belongs in [`../output/`](../output/) (Layer 4). For legal/tax/financial rubrics, mark them decision-support only — outputs require review by a licensed Portuguese contabilista certificado / lawyer.
