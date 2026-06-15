# Triage Stages

> **ICM role:** Layer 1 — router
> **Purpose:** Route a triage run through its three ordered stages: capture, evaluate, recommend.

## What this folder accomplishes
This folder holds the ordered pipeline that turns a raw ask into a go/no-go decision plus customer-ready feedback. Each stage does one job and writes to its own `output/`, which becomes the next stage's input. The whole sequence is designed to run fast enough to complete in a live meeting, so Jamie never has to defer with "I'll get back to you".

## How it connects to the architecture
- **Upstream / reads from:** [`../README.md`](../README.md) (workspace router); [`../setup/`](../setup/) config; [`../references/`](../references/) rubric
- **Downstream / feeds:** final stage writes to [`../output/`](../output/); GO decisions hand off to [`proposals/`](../../proposals/) and a new [`projects/`](../../../projects/) pipeline
- **Draws on (Layer 3 reference):** [`../references/`](../references/), [`_config/brand/voice/`](../../../_config/brand/voice/)

## Contents
- `01_intake/` — rapidly capture the project/idea: the ask, scope, who, constraints
- `02_assessment/` — score against the rubric and scan for existing/better solutions (build vs buy vs redirect)
- `03_recommendation/` — produce go/no-go plus the structured customer feedback deliverable

## Notes
Numbering encodes execution order. Run stages in sequence; each output is an edit surface Jamie can correct before the next stage runs. In a live meeting, intake and assessment can be run back-to-back and the recommendation reviewed aloud with the customer present.
