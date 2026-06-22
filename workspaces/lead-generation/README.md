# Lead Generation Workspace

> **ICM role:** Layer 1 — router
> **Purpose:** Turn networking, word of mouth, and a local-friends affiliate program into a repeatable system that feeds qualified leads to proposals and projects.

## What this folder accomplishes
This is Jamie's go-to-market engine: a freelance AI consultant in Mafra, Portugal who currently wins work through networking and referrals, with no paid ads and limited social-media appetite. The workspace defines who he serves, the low-cost channels he will actually run, his flagship local-affiliate ("local friends sell landing pages, he builds them, they earn 10%") program, on-brand outreach, and a single live pipeline. Run the stages in order for a full go-to-market refresh; re-run individual stages (e.g. `04_outreach`) as needed.

## How it connects to the architecture
- **Upstream / reads from:** `_config/business/founder-brief.md`, human input (networking events, intros, inbound)
- **Downstream / feeds:** `workspaces/proposals/` (qualified leads), `projects/` (won work, copied from `projects/_template-project/`), `shared/clients/` (CRM-lite updates)
- **Draws on (Layer 3 reference):** `_config/brand/voice/`, `_config/brand/visual/`, `_config/brand/assets/`, `shared/templates/`, `shared/knowledge/`, `_config/conventions/`, `references/`

## Contents
- `setup/` — one-time configuration (questionnaire) for this workspace
- `stages/` — the ordered pipeline (`01_positioning` → `05_pipeline`)
- `references/` — Layer 3 positioning notes and channel playbooks, stable across runs
- `output/` — Layer 4 campaign assets and the live lead pipeline

## How to use this router
1. Configure once via `setup/` (see `setup/README.md`).
2. Set direction in `stages/01_positioning/` — ICP, niche, value proposition.
3. Choose channels in `stages/02_channels/`; build the program in `stages/03_affiliate_program/`.
4. Run outreach from `stages/04_outreach/`; track everything in `stages/05_pipeline/`.
Every stage writes to its own `output/` and stops at a human review gate before the next stage runs.

## Notes
Each stage does exactly one job and hands off through its `output/`. Keep all artifacts plain markdown so Jamie can open and edit them. Channels here are deliberately founder-appropriate: no ad spend, low social-media dependency. This workspace implements only the lead-gen channels Jamie selects.
