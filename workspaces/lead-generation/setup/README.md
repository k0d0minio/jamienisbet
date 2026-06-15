# Lead Generation — Setup

> **ICM role:** Layer 3 — reference (configure the factory, not the product)
> **Purpose:** Capture the one-time configuration that tunes the whole lead-gen workspace before any stage runs.

## What this folder accomplishes
This is where Jamie configures the lead-gen "factory" once: how much time per week he can spend selling, which towns and circles he can tap (Mafra, Ericeira, Lisbon greater area), his comfort level with social media, his baseline landing-page price and the resulting 10% affiliate payout, and which channels are off-limits (paid ads). Stages read this config instead of re-asking. Update it when his capacity, geography, or pricing changes — not every run.

## How it connects to the architecture
- **Upstream / reads from:** `_config/business/founder-brief.md`, `_config/business/` (rates, legal entity status), human input
- **Downstream / feeds:** every stage in `../stages/` (especially `01_positioning` and `03_affiliate_program`)
- **Draws on (Layer 3 reference):** `_config/conventions/` (how to build a workspace), `../references/`

## Contents
- `questionnaire.md` — planned: the one-time config interview (weekly selling capacity, target geography, social-media comfort, baseline landing-page price, affiliate commission %, excluded channels, brand-asset locations). Do NOT create yet.
- `output/` — planned: the answered/locked config that stages load as context.

## Notes
Per ICM principle 5, configure once here; each run then produces new deliverables using this config. Keep pricing and commission numbers in sync with `_config/business/`; if they ever disagree, `_config/business/` is the source of truth. Any rate, invoicing, or tax implication surfaced here is decision-support only and must be reviewed by a licensed Portuguese contabilista certificado / lawyer before being treated as fact.
