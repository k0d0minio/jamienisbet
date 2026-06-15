# Stages — Delivery Pipeline (Discovery -> Build -> Delivery)

> **ICM role:** Layer 1 — router (orders the project's stages)
> **Purpose:** Route an agent through the three ordered delivery stages of a single project, handing each stage's `output/` to the next.

## What this folder accomplishes
This folder holds the numbered stages that move one engagement from "we agreed what to build" to "client accepted it." The build itself runs in the client's **external delivery repo**; these stages track and gate it. The numbering encodes execution order (Principle 1: one stage, one job). Each stage reads the previous stage's `output/`, does exactly one job, and writes its own `output/` (the docs-only tracking record) for the next stage and for Jamie to review.

## How it connects to the architecture
- **Upstream / reads from:** the parent project's `../references/` (client brand, tech-stack decisions, signed scope) and the accepted proposal from `workspaces/proposals/`.
- **Downstream / feeds:** the project-level `../output/` (final deliverable rollup) and, via accepted milestones, `workspaces/finance/`.
- **Draws on (Layer 3 reference):** `shared/templates/`, `shared/knowledge/`, `_config/conventions/`.

## Contents
- `01_discovery/` — requirements, scope confirmation, success criteria. Output -> `01_discovery/output/`.
- `02_build/` — the actual delivery work, technical notes, milestones. Output -> `02_build/output/`.
- `03_delivery/` — handoff, client acceptance, retrospective. Output -> `03_delivery/output/`.

## Stage handoff chain
`01_discovery/output/` -> input to `02_build/` -> `02_build/output/` -> input to `03_delivery/` -> `03_delivery/output/` -> rolled up into `../output/`.

## Notes
Each `output/` is a review gate: Jamie approves before the next stage runs (Principle 4). Larger projects may insert stages here (e.g. `02a_design/`, `04_maintenance/`) — keep the numeric prefix so order stays explicit. Never skip a stage's `output/`; the plain-text handoff is the only interface between stages (Principle 2).
