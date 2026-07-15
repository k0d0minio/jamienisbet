# Stage 01 — Intake (Question-Maximizing Discovery Engine)

> **ICM role:** Layer 2 — stage (narrative; contract in CONTEXT.md)
> **Purpose:** Interrogate a new deal exhaustively and produce a structured deal dossier that everything downstream depends on.

## What this folder accomplishes
This is the heavy-edit, direction-setting Stage 1 and the defining behavior of the whole workspace: **ask as many questions as possible before any advice is given.** The agent runs a deep discovery interview with Jamie about the lead — who they are, the real problem behind the stated problem, budget signals, who actually signs, timeline and hard deadlines, alternatives and competing vendors, emotional drivers, and how the client perceives value. It keeps probing gaps rather than settling for thin answers. The output is a clean deal dossier that becomes the single source of truth for analysis, strategy, and every document.

## How it connects to the architecture
- **Upstream / reads from:** human input (the lead); the client record in the admin dashboard (Neon `biz.clients`, any existing record)
- **Downstream / feeds:** [`../02_deal_analysis/`](../02_deal_analysis/)
- **Draws on (Layer 3 reference):** [`../../references/`](../../references/) (the discovery question bank in the negotiation playbook); [`../../setup/`](../../setup/) (deal types Jamie accepts)

## Contents
- [`CONTEXT.md`](CONTEXT.md) — the Layer 2 contract this stage executes.
- `output/` — Layer 4: the per-deal dossier lands here, then is copied/linked into `../../output/<client>/`.

## Notes
A weak dossier guarantees weak strategy. When unsure, ask more questions rather than fewer.

> Contract: see [CONTEXT.md](CONTEXT.md).
