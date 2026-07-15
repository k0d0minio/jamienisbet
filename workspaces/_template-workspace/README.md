# Workspace Template (Builder Seed)

> **ICM role:** Layer 1 — router (template/seed)
> **Purpose:** A blank, fully-documented ICM workspace you copy to create any new business capability — no new code, just a new folder.

## What this folder accomplishes
This is the **workspace-builder seed** for Jamie Nisbet's consulting repo. When a new capability is needed (e.g. a marketing-content pipeline, a lead-qualifier, a tax-setup advisor), you don't write a program — you copy this folder to `workspaces/<new-name>/`, rename and renumber the stages, and fill in the questionnaire. That is how the whole business scales: **new domains are new folders, not new code.** The ICM paper notes practitioners prefer copying a working workspace over building from scratch; this seed exists so that copy is always clean, documented, and consistent with repo conventions.

This README is the **Layer 1 router** every real workspace must have: it tells an agent "where do I go?" — it points to setup first, then the numbered stages in order.

## How it connects to the architecture
- **Upstream / reads from:** human (the operator who copies this seed) — see [`_config/conventions/`](../../_config/conventions/) for the full build protocol.
- **Downstream / feeds:** a new `workspaces/<name>/` capability; that capability's final stage `output/` typically feeds the business state in Neon `biz.*` (via the admin dashboard) or a client's external delivery repo.
- **Draws on (Layer 3 reference):** [`_config/business/`](../../_config/business/) (identity facts), [`_config/brand/voice/`](../../_config/brand/voice/) and [`_config/brand/visual/`](../../_config/brand/visual/) (so deliverables look/sound on-brand), [`shared/templates/`](../../shared/templates/).

## Contents
- `setup/` — configure-the-factory-once: the questionnaire that defines this capability (Principle 5).
- `stages/` — numbered, single-job stages executed in order; each owns its `output/`.
- `references/` — Layer 3 reference material stable across runs (rubrics, voice notes specific to this capability).
- `output/` — Layer 4 working artifacts: where the workspace's final deliverable lands.

## How to use this seed
1. Copy the whole folder to `workspaces/<new-capability>/`.
2. Edit `setup/questionnaire.md` to configure the factory once.
3. Rename/renumber `stages/01_stage` -> real stages (`01_intake`, `02_draft`, ...). Each must keep a stage-contract README and its own `output/`.
4. Fill `references/` with the rubrics/voice/templates this capability needs.
5. Update this README so the router lists the real stages in execution order.

## Notes
Honors the Five Principles: one stage / one job, plain-text interface, layered context loading, every output an edit surface (review gate before the next stage), and configure-the-factory-not-the-product. Keep all files as human-readable markdown. Full protocol: [`_config/conventions/`](../../_config/conventions/).
