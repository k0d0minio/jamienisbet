# Stage 04 — Outreach

> **ICM role:** Layer 2 — stage
> **Purpose:** Provide on-brand templates and follow-up cadences for warm intros and inbound leads so nothing stalls or sounds off-voice.

## What this folder accomplishes
This stage gives Jamie ready-to-send, on-brand copy for the two situations he actually faces: a warm introduction from a friend or affiliate seller, and an inbound enquiry. It covers first-touch messages, a short discovery prompt, a "no-reply" follow-up cadence, and a graceful close-out. Copy is drawn from `_config/brand/voice/` so every message matches his invoices, proposals, and site. Because his channels are networking and referral (not cold ads), templates lean warm and personal, not salesy.

## How it connects to the architecture
- **Upstream / reads from:** `../01_positioning/output/`, `../02_channels/output/`, `../03_affiliate_program/output/`
- **Downstream / feeds:** `../05_pipeline/` (each send is logged), `workspaces/proposals/` (when a lead is ready to quote)
- **Draws on (Layer 3 reference):** `_config/brand/voice/`, `shared/templates/` (email template), `shared/knowledge/`

## Stage contract
### Inputs
- Layer 4 (working): `../03_affiliate_program/output/`, `../01_positioning/output/`
- Layer 3 (reference): `_config/brand/voice/`, `shared/templates/`
### Process
Draft templates for warm-intro first touch, inbound reply, discovery questions, and a 2–3 step follow-up cadence with timing; adapt tone to voice rules; mark merge fields (name, referrer, town, offer) and the point where a lead hands to proposals.
### Outputs
- `templates/` (warm-intro, inbound-reply, discovery, close-out) -> output/
- `follow-up-cadence.md` -> output/
### Verify
- Wording matches `_config/brand/voice/`; every template names its trigger and the `../05_pipeline/` stage it advances a lead to; affiliate-sourced messages credit the referrer per `../03_affiliate_program/output/attribution-rules.md`.

## Notes
Keep cadences short and human — a freelancer over-following-up reads as desperate; the goal is to stay polite and present. Re-run this stage alone whenever brand voice or offer changes, without touching positioning.
