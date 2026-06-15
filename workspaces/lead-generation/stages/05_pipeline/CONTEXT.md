# 05 — Pipeline — Contract
<!-- ICM Layer 2 — machine-loaded stage contract. Human narrative is in README.md. -->

## Inputs
- Layer 4 (working): `../04_outreach/output/` (sends/replies), incoming intros and inbound enquiries
- Layer 3 (reference): `../03_affiliate_program/output/attribution-rules.md`, `_config/conventions/`

## Process
Log each lead with status, source/referrer, offer, value band, and next action; advance or close leads; on "qualified," package the lead for `workspaces/proposals/`; on "won," trigger a `projects/` pipeline and upsert `shared/clients/`; flag affiliate-attributed deals for payout in `../03_affiliate_program/`.

## Outputs
- `pipeline.md` (the live board) -> output/
- `handoffs/` (per-lead qualified packets) -> output/

## Integrations
- none

## Verify
- Every affiliate-sourced lead has exactly one referrer per attribution rules; qualified leads exist in both `pipeline.md` and a handoff packet; client records written to `shared/clients/` match the lead; no duplicate clients.

## Review gate
- none
