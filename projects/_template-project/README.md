# Template Project — Copy-Me Delivery Pipeline

> **ICM role:** Layer 1 — router (template for a single per-client pipeline)
> **Purpose:** The canonical, reusable skeleton that is **copied** (not run in place) every time a lead becomes paid work, producing a fresh `projects/<client>/` delivery pipeline.

## What this folder accomplishes
This is the factory mould for delivery (Principle 5: configure the factory, not the product). It is never executed directly. When `workspaces/proposals/` closes a deal, an agent copies this whole folder to `projects/<client-or-project>/`, renames it for the client, drops the signed scope into `stages/01_discovery/`, and the engagement begins. Keeping one blessed template means every project Jamie runs has the same predictable shape — easy for an agent to route through and easy for a human to audit later.

## How it connects to the architecture
- **Upstream / reads from:** `workspaces/proposals/` (accepted proposal + scope is the trigger to copy this folder) and `shared/clients/<client>/` (who the client is).
- **Downstream / feeds:** the new `projects/<client>/` copy, whose final accepted deliverables feed `workspaces/finance/` for invoicing.
- **Draws on (Layer 3 reference):** `_config/conventions/` (ICM stage structure), `shared/templates/` (work-order, acceptance sign-off), `_config/business/` (rates/terms), `_config/brand/` (client-facing output styling).

## Contents
- `stages/` — the ordered pipeline: `01_discovery/`, `02_build/`, `03_delivery/`, each with its own `output/`.
- `references/` — project-specific reference (Layer 3): brand-to-apply if client-facing, tech-stack decisions, links to the signed scope.
- `output/` — project-level rollup of the final accepted deliverable + handoff record (distinct from per-stage outputs).

## How to use the template
1. Copy `_template-project/` -> `projects/<client-or-project>/` (lowercase, snake_case).
2. Fill `references/` with this client's brand + stack context.
3. Run stages in order; each `output/` is a human review gate (Principle 4) before the next stage.

## Notes
Bigger engagements may add stages inside `stages/` (e.g. `02a_design/`, `04_maintenance/`) — keep them numbered to encode order. Leave this template generic: no real client data ever lives here.
