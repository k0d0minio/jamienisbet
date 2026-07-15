# 05 — Pipeline — Contract
<!-- ICM Layer 2 — machine-loaded stage contract. Human narrative is in README.md. -->
<!-- The run-process lives in the admin dashboard over Neon biz.*; this contract is the spec it mirrors. -->

## Inputs
- Layer 4 (working): `../04_outreach/output/` (sends/replies), incoming intros and inbound enquiries, website intake forms (portfolio contact + sellers referral)
- Layer 3 (reference): `../03_affiliate_program/output/attribution-rules.md`, `_config/conventions/`

## Process
Log each lead as a `biz.clients` row with status, source/referrer, and next action; advance or close leads in the dashboard; on "qualified," open a deal (`biz.deals`) and run the proposals contracts; on "won," run onboarding (delivery repo seeded by the dashboard) ; flag affiliate-attributed deals for payout in `../03_affiliate_program/`.

## Outputs
- The live pipeline state in Neon `biz.clients` / `biz.deals` (operated in the admin dashboard — no repo artifact)

## Integrations
- Neon `biz.*` via the admin dashboard (state store)

## Verify
- Every affiliate-sourced lead has exactly one referrer per attribution rules; qualified leads have a deal row; no duplicate clients.

## Review gate
- none
