# Project Triage

> **ICM role:** Layer 1 — router
> **Purpose:** Give Jamie an extremely high-level go/no-go read on any project or idea, fast enough to run live in a meeting, and produce structured feedback he can hand the customer on the spot.

## What this folder accomplishes
This workspace is Jamie's portfolio-level decision lens. Before a lead becomes a real project, he runs it through triage to answer three questions: which direction to go, whether a better/existing solution already solves it (build vs buy vs redirect), and whether it is worth his time. Critically, it doubles as an on-the-fly tool: instead of saying "I'll get back to you", Jamie captures the ask, scores it against a rubric, and hands the customer a clean structured feedback page in the same conversation. It reads across active and past engagements (delivery repos linked on `biz.clients`) so triage decisions are made with full portfolio context, not in isolation.

## How it connects to the architecture
- **Upstream / reads from:** human input (live meeting / call); [`lead-generation/`](../lead-generation/) qualifying signals; past delivered engagements for portfolio context (what Jamie already builds/maintains); the client registry in the admin dashboard (Neon `biz.clients`)
- **Downstream / feeds:** if GO, [`proposals/`](../proposals/) via a deal in the admin dashboard; if NO-GO or REDIRECT, structured feedback returns to the customer and the outcome is logged on the client record
- **Draws on (Layer 3 reference):** [`references/`](references/) scoring rubric + decision criteria; [`_config/business/founder-brief.md`](../../_config/business/founder-brief.md) for what "worth my time" means; [`_config/brand/voice/`](../../_config/brand/voice/) so customer-facing feedback sounds like Jamie

## Contents
- `setup/` — one-time configuration of this triage factory (questionnaire defining Jamie's thresholds)
- `stages/` — the ordered triage pipeline (01_intake -> 02_assessment -> 03_recommendation)
- `references/` — Layer 3 rubric, weights, and decision criteria (stable across runs)
- `output/` — Layer 4 per-run triage records and customer-facing feedback deliverables

## Notes
Speed is the whole point: a full pass should be runnable inside a single meeting. Each run is one idea/project; the factory (rubric, thresholds) is configured once in `setup/`. Any legal, tax, or financial signal surfaced here is decision-support only and must be reviewed by a licensed Portuguese contabilista certificado / lawyer before Jamie acts on it.
