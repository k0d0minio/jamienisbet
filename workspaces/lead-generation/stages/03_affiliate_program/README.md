# Stage 03 — Affiliate Program (Local Friends)

> **ICM role:** Layer 2 — stage (narrative; contract in CONTEXT.md)
> **Purpose:** Design Jamie's flagship go-to-market: local friends find and sell landing-page websites, he builds them, the seller earns 10% of what he makes.

## What this folder accomplishes
This stage builds the whole local-affiliate program end to end so a non-technical friend can sell with confidence. It defines how sellers are recruited, the sales kit they receive (a one-pager, simple pricing/packages, and on-brand assets from `_config/brand/`), the 10% commission structure and what "what I make" means, how leads are attributed to a seller (so two friends never claim the same customer), the payout process, and a plain-language agreement. This is the centerpiece of the lead-gen workspace.

## How it connects to the architecture
- **Upstream / reads from:** `../01_positioning/output/`, `../02_channels/output/`, `../../setup/output/`
- **Downstream / feeds:** `../04_outreach/`, `../05_pipeline/` (attribution), Neon `biz.clients` via the sellers-site intake (new seller-sourced leads)
- **Draws on (Layer 3 reference):** `_config/brand/visual/`, `_config/brand/assets/`, `_config/brand/voice/`, `shared/templates/` (agreement, pricing), `_config/business/` (rates)

## Notes
Keep the seller's job to "make a warm introduction," not to quote or close — Jamie handles pricing and delivery, which protects margin and brand. The seller agreement and any commission/withholding/tax treatment are decision-support only and must be reviewed by a licensed Portuguese contabilista certificado / lawyer before use; do not state tax outcomes as fact.

> Contract: see [CONTEXT.md](CONTEXT.md).
