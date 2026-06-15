# 03 — Affiliate Program (Local Friends) — Contract
<!-- ICM Layer 2 — machine-loaded stage contract. Human narrative is in README.md. -->

## Inputs
- Layer 4 (working): `../01_positioning/output/` (ICP/offer), `../../setup/output/` (price, 10% rate)
- Layer 3 (reference): `../../references/affiliate-program.md` (program rules + sellers-site spec); `_config/brand/`, `shared/templates/`, `_config/business/rates.md`

## Process
Define seller recruiting criteria and onboarding; assemble the sales kit (one-pager, pricing tiers, brand assets); specify the 10% commission base, timing, and edge cases; design lead attribution (unique referral codes/named introductions logged at first contact); define the payout process; draft a simple seller agreement.

## Outputs
- `program-overview.md` -> output/
- `sales-kit/` (one-pager, pricing, brand-asset pointers) -> output/
- `commission-and-payout.md` -> output/
- `attribution-rules.md` -> output/
- `seller-agreement.md` -> output/

## Integrations
- none

## Verify
- 10% base matches `../../setup/output/` and `_config/business/`; brand assets pulled only from `_config/brand/`; attribution rules are consistent with `../05_pipeline/` fields; no double-counting of a lead.

## Review gate
- none
