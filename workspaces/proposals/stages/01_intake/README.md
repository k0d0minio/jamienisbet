# Stage 01 — Intake (Question-Maximizing Discovery Engine)

> **ICM role:** Layer 2 — stage
> **Purpose:** Interrogate a new deal exhaustively and produce a structured deal dossier that everything downstream depends on.

## What this folder accomplishes
This is the heavy-edit, direction-setting Stage 1 and the defining behavior of the whole workspace: **ask as many questions as possible before any advice is given.** The agent runs a deep discovery interview with Jamie about the lead — who they are, the real problem behind the stated problem, budget signals, who actually signs, timeline and hard deadlines, alternatives and competing vendors, emotional drivers, and how the client perceives value. It keeps probing gaps rather than settling for thin answers. The output is a clean deal dossier that becomes the single source of truth for analysis, strategy, and every document.

## How it connects to the architecture
- **Upstream / reads from:** human input (the lead); [`shared/clients/`](../../../../shared/clients/) (any existing record)
- **Downstream / feeds:** [`../02_deal_analysis/`](../02_deal_analysis/)
- **Draws on (Layer 3 reference):** [`../../references/`](../../references/) (the discovery question bank in the negotiation playbook); [`../../setup/`](../../setup/) (deal types Jamie accepts)

## Contents
- `output/` — Layer 4: the per-deal dossier lands here, then is copied/linked into `../../output/<client>/`.

## Stage contract
### Inputs
- Layer 4 (working): human answers to the discovery interview
- Layer 3 (reference): question bank in [`../../references/`](../../references/)
### Process
Run an exhaustive, structured Q&A across: client identity, underlying problem, budget signals, decision-makers/influencers, timeline and deadlines, alternatives/competition, emotional drivers, and perceived value. Flag every unknown explicitly rather than assuming.
### Outputs
- `deal-dossier.md` -> output/
### Verify
- No required dossier section is blank or guessed; open unknowns are listed as "must ask" follow-ups before the gate closes.
### Review gate
- Jamie edits the dossier heavily here; this is where direction is set.

## Notes
A weak dossier guarantees weak strategy. When unsure, ask more questions rather than fewer.
