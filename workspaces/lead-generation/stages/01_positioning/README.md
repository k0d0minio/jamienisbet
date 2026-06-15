# Stage 01 — Positioning

> **ICM role:** Layer 2 — stage
> **Purpose:** Define who Jamie serves, the offer/niche, and the value proposition that direct every downstream channel and message.

## What this folder accomplishes
This is the direction-setting stage. It pins down the Ideal Customer Profile (e.g. small Portuguese businesses, restaurants, tradespeople, expats in the Mafra/Ericeira/Lisbon area needing a landing page or light AI automation), the sharpest offer/niche to lead with (landing pages as the affiliate-friendly wedge; AI consulting as the higher-value follow-on), and a value proposition in plain language. Everything in channels, the affiliate kit, and outreach copy inherits from here.

## How it connects to the architecture
- **Upstream / reads from:** `../../setup/output/`, `_config/business/founder-brief.md`, human input
- **Downstream / feeds:** `../02_channels/`, `../03_affiliate_program/`, `../04_outreach/`
- **Draws on (Layer 3 reference):** `../../references/` (positioning notes), `_config/brand/voice/`

## Stage contract
### Inputs
- Layer 4 (working): `../../setup/output/` (locked config: geography, capacity, pricing)
- Layer 3 (reference): `../../references/`, `_config/brand/voice/`
### Process
Define the ICP (segments, locations, pains, where they gather), select the niche/offer to lead with, draft the value proposition and 2–3 proof points, and a positioning statement the affiliate sellers and outreach can reuse verbatim.
### Outputs
- `icp.md` -> output/
- `value-proposition.md` -> output/
- `positioning-statement.md` -> output/
### Verify
- ICP is reachable through Jamie's actual networks and the affiliate program; offer maps to a real price band in `../../setup/output/`; language matches `_config/brand/voice/`.

## Notes
Keep the offer narrow enough that a non-technical local friend can explain it in one sentence — that constraint protects `03_affiliate_program`. Stop at the review gate so Jamie confirms the ICP before channels are chosen.
