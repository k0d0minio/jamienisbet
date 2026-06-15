# 05 — Compliance Calendar — Contract
<!-- ICM Layer 2 — machine-loaded stage contract. Human narrative is in README.md. -->

## Inputs
- Layer 4 (working): confirmed entity form, regime, IVA periodicity
- Layer 3 (reference): `../../references/`

## Process
Map each obligation (IVA, IRS, Segurança Social, annual filings) to its cadence and due dates with owner and buffer; format so `tracker/` and `workspaces/finance/` can consume it.

## Outputs
- `compliance-calendar.md` -> output/

## Integrations
- none

## Verify
- Cadence matches the regime confirmed in Stage 03; no obligation orphaned; dates align with what feeds `tracker/`; every date flagged "confirm with contabilista."

## Review gate
- none
