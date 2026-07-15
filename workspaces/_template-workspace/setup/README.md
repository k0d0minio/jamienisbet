# Setup — Configure the Factory Once

> **ICM role:** Layer 3 — reference (configuration)
> **Purpose:** Hold the one-time questionnaire that configures this workspace before any run, so every later run reuses the same settings.

## What this folder accomplishes
This is where Principle 5 — **configure the factory, not the product** — lives. Before a copied workspace runs for the first time, the operator (Jamie, or an agent on his behalf) answers a short questionnaire that defines what this capability does, who it's for, what "good" looks like, and which references it draws on. After that, every run just produces a new deliverable using this config — you don't re-answer setup each time. For a PT-based one-person consultancy this keeps each capability cheap to stand up and consistent to operate.

## How it connects to the architecture
- **Upstream / reads from:** human input (the operator filling in the answers).
- **Downstream / feeds:** the numbered stages in [`../stages/`](../stages/) — each stage loads only the slice of this config it needs (Principle 3, layered context loading).
- **Draws on (Layer 3 reference):** [`_config/conventions/`](../../../_config/conventions/) for what a good questionnaire asks; [`_config/business/`](../../../_config/business/) for default identity facts; [`_config/brand/voice/`](../../../_config/brand/voice/) for default tone.

## Contents
- `questionnaire.md` — create when instantiating: the fill-in-the-blanks config: capability name & one-line purpose; trigger (what starts a run); inputs/outputs; success criteria; which Layer 3 references apply; review-gate owner; cadence (per-lead, weekly, on-demand). See any real workspace's `setup/questionnaire.md` for the shape.
- `output/config.md` — the locked configuration the questionnaire produces (`<!-- run: setup v1 | date: ... -->` header, then the confirmed parameters). Every real workspace has one; stages load slices of it as Layer 3.

## Notes
The questionnaire is a one-time setup artifact, not per-run working content — that's why it lives here (Layer 3, stable) and not in `output/` (Layer 4, changes every run). Keep it short and plain-text so a human can edit it in seconds. If a capability touches legal, tax, or financial matters, the questionnaire should flag that its outputs are decision-support only and require review by a licensed Portuguese contabilista certificado / lawyer before use.
