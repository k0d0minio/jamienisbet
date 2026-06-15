# Stage 03 — Affiliate Program (Local Friends)

> **ICM role:** Layer 2 — stage
> **Purpose:** Design Jamie's flagship go-to-market: local friends find and sell landing-page websites, he builds them, the seller earns 10% of what he makes.

## What this folder accomplishes
This stage builds the whole local-affiliate program end to end so a non-technical friend can sell with confidence. It defines how sellers are recruited, the sales kit they receive (a one-pager, simple pricing/packages, and on-brand assets from `_config/brand/`), the 10% commission structure and what "what I make" means, how leads are attributed to a seller (so two friends never claim the same customer), the payout process, and a plain-language agreement. This is the centerpiece of the lead-gen workspace.

## How it connects to the architecture
- **Upstream / reads from:** `../01_positioning/output/`, `../02_channels/output/`, `../../setup/output/`
- **Downstream / feeds:** `../04_outreach/`, `../05_pipeline/` (attribution), `shared/clients/` (new seller-sourced leads)
- **Draws on (Layer 3 reference):** `_config/brand/visual/`, `_config/brand/assets/`, `_config/brand/voice/`, `shared/templates/` (agreement, pricing), `_config/business/` (rates), `shared/knowledge/`

## Stage contract
### Inputs
- Layer 4 (working): `../01_positioning/output/` (ICP/offer), `../../setup/output/` (price, 10% rate)
- Layer 3 (reference): `_config/brand/assets/`, `_config/brand/visual/`, `shared/templates/`, `_config/business/`
### Process
Define seller recruiting criteria and onboarding; assemble the sales kit (one-pager, pricing tiers, brand assets); specify the 10% commission base, timing, and edge cases; design lead attribution (unique referral codes/named introductions logged at first contact); define the payout process; draft a simple seller agreement.
### Outputs
- `program-overview.md` -> output/
- `sales-kit/` (one-pager, pricing, brand-asset pointers) -> output/
- `commission-and-payout.md` -> output/
- `attribution-rules.md` -> output/
- `seller-agreement.md` -> output/
### Verify
- 10% base matches `../../setup/output/` and `_config/business/`; brand assets pulled only from `_config/brand/`; attribution rules are consistent with `../05_pipeline/` fields; no double-counting of a lead.

## Notes
Keep the seller's job to "make a warm introduction," not to quote or close — Jamie handles pricing and delivery, which protects margin and brand. The seller agreement and any commission/withholding/tax treatment are decision-support only and must be reviewed by a licensed Portuguese contabilista certificado / lawyer before use; do not state tax outcomes as fact.
