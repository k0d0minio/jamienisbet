# Lead Generation — Stages

> **ICM role:** Layer 1 — router
> **Purpose:** Order and connect the five lead-gen stages so each one's output becomes the next one's input.

## What this folder accomplishes
This folder holds the ordered pipeline that takes Jamie from "who do I serve?" to a tracked, qualified lead ready for a proposal. Stages are numbered to encode execution order. Each stage does one job, reads the prior stage's `output/`, and stops at a human review gate before the next runs. The standout stage is `03_affiliate_program` — his flagship local-friends go-to-market.

## How it connects to the architecture
- **Upstream / reads from:** `../setup/output/` (locked config), `_config/business/founder-brief.md`
- **Downstream / feeds:** the lead pipeline in the admin dashboard (Neon `biz.clients`, run against `workspaces/proposals/` contracts)
- **Draws on (Layer 3 reference):** `../references/`, `_config/brand/voice/`, `_config/brand/visual/`, `shared/templates/`

## Contents
- `01_positioning/` — define ICP, niche, value proposition (direction-setting)
- `02_channels/` — pick the low-cost, founder-appropriate channels to actually run
- `03_affiliate_program/` — design the local-friends referral program (flagship)
- `04_outreach/` — on-brand templates and follow-up cadences
- `05_pipeline/` — track leads from first contact to qualified handoff

## Flow
`01_positioning/output/` → feeds `02_channels` and `03_affiliate_program`
`02_channels/output/` + `03_affiliate_program/output/` → feed `04_outreach`
`04_outreach/output/` → drives contacts logged in `05_pipeline`
`05_pipeline` → qualified leads become deals in the admin dashboard (Neon `biz.*`), run against the `workspaces/proposals/` contracts.

## Notes
Stage N's `output/` is the Layer 4 handoff to stage N+1. Don't skip review gates — Jamie edits each output before the next stage consumes it. Re-run a single stage when only part of the strategy changes (e.g. refresh `04_outreach` copy without redoing positioning).
