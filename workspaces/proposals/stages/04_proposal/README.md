# Stage 04 — Proposal (Persuasive, On-Brand Document)

> **ICM role:** Layer 2 — stage (narrative; contract in CONTEXT.md)
> **Purpose:** Generate the client-facing proposal that sells the outcome using the dossier, the negotiation framing, and Jamie's brand.

## What this folder accomplishes
With the strategy locked, this stage writes the actual proposal Jamie sends. It pulls the problem and value from the intake dossier, mirrors the value-over-cost framing and tiered options from the negotiation strategy, and renders everything through the master proposal template and Jamie's voice and visual identity so it looks and reads consistently with every other document the business produces. The proposal presents the recommended tier prominently and leaves room for the quote to land at the target rate.

## How it connects to the architecture
- **Upstream / reads from:** [`../01_intake/output/`](../01_intake/) (dossier); [`../03_negotiation_strategy/output/`](../03_negotiation_strategy/) (framing, tiers)
- **Downstream / feeds:** [`../05_quote/`](../05_quote/)
- **Draws on (Layer 3 reference):** [`shared/templates/`](../../../../shared/templates/) (proposal template); [`_config/brand/voice/`](../../../../_config/brand/voice/) (copy rules); [`_config/brand/visual/`](../../../../_config/brand/visual/) and [`_config/brand/assets/`](../../../../_config/brand/assets/) (design tokens, logo); [`_config/business/`](../../../../_config/business/) (entity details)

## Contents
- [`CONTEXT.md`](CONTEXT.md) — the Layer 2 contract this stage executes.
- `output/` — Layer 4: the generated proposal for this deal.

## Notes
The proposal persuades; the quote prices. Keep numbers out of this document except as option framing — exact figures live in `05_quote`.

> Contract: see [CONTEXT.md](CONTEXT.md).
