# Proposals — Stages (The Pipeline)

> **ICM role:** Layer 1 — router
> **Status:** these contracts are executed by the admin dashboard's deal pipeline (the AI loads
> them via `packages/icm`); documents live versioned in Neon `biz.documents`, money in the deal's
> payment schedule + Stripe. Edit a stage contract here to change the next run.
> **Purpose:** Hold the ordered, numbered stages that move one deal from first contact to closing invoice, each writing to its own `output/`.

## What this folder accomplishes
This folder is the execution spine of the flagship workspace. The numbering encodes the order: discovery, then leverage analysis, then live negotiation coaching, then the four deliverables. Each stage does exactly one job (Principle 1), writes plain-text markdown a human can edit (Principle 2), loads only the context it needs (Principle 3), and stops at a review gate before handing off (Principle 4). Stage N's `output/` is the input to stage N+1.

## How it connects to the architecture
- **Upstream / reads from:** [`../setup/`](../setup/) (workspace config); a new lead (human input); the client record in the admin dashboard (Neon `biz.clients`)
- **Downstream / feeds:** [`../output/<client>/`](../output/) (per-deal artifacts); [`workspaces/finance/`](../../finance/) at stage `07`
- **Draws on (Layer 3 reference):** [`../references/`](../references/); [`shared/templates/`](../../../shared/templates/); [`_config/brand/`](../../../_config/brand/)

## Contents
- `01_intake/` — question-maximizing discovery engine → deal dossier
- `02_deal_analysis/` — synthesize dossier into a leverage map
- `03_negotiation_strategy/` — the negotiation coach: tactics + talk-track to close high
- `04_proposal/` — persuasive, on-brand proposal document
- `05_quote/` — priced quote aligned to the target rate
- `06_contract/` — contract generation (legal disclaimer applies)
- `07_invoice/` — closing invoice; hands off to finance

## Notes
Run stages strictly in order; do not skip the review gate after `01_intake` (sets direction) or after `03_negotiation_strategy` (Jamie uses it live). If a deal stalls, loop back to `02`/`03` with new information rather than guessing forward.
