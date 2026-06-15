# Stage 03 — Negotiation Strategy (The Coach)

> **ICM role:** Layer 2 — stage
> **Purpose:** Produce a concrete, live-usable negotiation plan that closes the deal at a higher-than-usual rate.

## What this folder accomplishes
This is the negotiation coach — the reason the workspace exists. Reading the leverage map, the agent writes a battle plan Jamie uses in the actual conversation: where to anchor and how high, how to frame value against cost, a tiered set of options (good/better/best) that makes the target tier feel obvious, prepared objection handling, a clear **target price vs floor price**, signals for when to hold firm and when to walk, and an exact word-for-word talk-track for the key moments. This is the most critical review gate in the pipeline: Jamie reads, pressure-tests, and edits it before he ever speaks to the client.

## How it connects to the architecture
- **Upstream / reads from:** [`../02_deal_analysis/output/`](../02_deal_analysis/) (`leverage-map.md`)
- **Downstream / feeds:** [`../04_proposal/`](../04_proposal/) and [`../05_quote/`](../05_quote/) (target rate + framing carry through)
- **Draws on (Layer 3 reference):** [`../../references/`](../../references/) (negotiation playbook: anchoring, framing, objection library, walk-away rules); [`../../setup/`](../../setup/) (anchor appetite, floor)

## Contents
- `output/` — Layer 4: the negotiation strategy + talk-track for this deal.

## Stage contract
### Inputs
- Layer 4 (working): [`../02_deal_analysis/output/`](../02_deal_analysis/) leverage map
- Layer 3 (reference): negotiation playbook in [`../../references/`](../../references/)
### Process
Set anchor, target, and floor; build tiered options; write value-vs-cost framing; prepare objection responses; define hold/walk triggers; draft an exact talk-track for openings, the anchor, and pushback.
### Outputs
- `negotiation-strategy.md` -> output/ (includes target vs floor and the talk-track)
### Verify
- Target ≥ Jamie's configured standard rate and never below the floor in `../../setup/`; every tactic is justified by the leverage map.
### Review gate
- CRITICAL. Jamie rehearses and edits before going live; no document is generated until this is signed off.

## Notes
Tactics are advisory; Jamie owns the room. Hold the floor — if the deal can't clear it, the plan should say walk.
