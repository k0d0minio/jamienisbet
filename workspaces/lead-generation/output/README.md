# Lead Generation — Output

> **ICM role:** Layer 4 — working
> **Purpose:** Hold this workspace's per-run campaign assets and the consolidated live lead pipeline.

## What this folder accomplishes
This is the working surface for the lead-gen workspace — the things that change every run or every week. It collects the campaign assets the stages produce (finalized affiliate sales kit, outreach templates ready to send, the current channel plan) and the consolidated live pipeline view Jamie actually works from. Individual stages also keep their own `output/`; this top-level `output/` is where workspace-level deliverables and the current pipeline snapshot are surfaced for daily use.

## How it connects to the architecture
- **Upstream / reads from:** each stage's `output/` under `../stages/` (especially `05_pipeline/output/`)
- **Downstream / feeds:** the lead pipeline in the admin dashboard (Neon `biz.clients`) and its working list
- **Draws on (Layer 3 reference):** `../references/`, `_config/brand/` (assets used in finalized kits)

## Contents
- `campaign-assets/` — planned: finalized affiliate sales kit, outreach templates, channel plan ready to use
- (The live lead board is NOT a repo artifact — pipeline state lives in Neon `biz.*`, viewed in the admin dashboard.)

## Notes
Per ICM, every output is an edit surface: Jamie reviews and edits these before they drive action or feed another workspace. Keep stage-specific drafts in the stage's own `output/`; reserve this folder for workspace-level deliverables and the live pipeline. As volume grows, archive closed campaigns into a dated subfolder so the live view stays clean.
