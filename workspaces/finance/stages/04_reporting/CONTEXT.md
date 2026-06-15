# 04 — Reporting — Contract
<!-- ICM Layer 2 — machine-loaded stage contract. Human narrative is in README.md. -->

## Inputs
- Layer 4 (working): outputs of stages 01–03 for the period.
- Layer 3 (reference): [`../../references/`](../../references/) for category grouping.

## Process
The agent aggregates income, expenses and reserve for the period, computes net position and outstanding receivables, and writes a founder summary plus an accountant pack listing review-needed items.

## Outputs
- `<period>-summary.md` -> output/
- `<period>-accountant-pack.md` -> output/

## Integrations
- none

## Verify
- Report totals equal the sum of stages 01/02 rows; reserve matches stage 03; period boundaries are consistent; every "review-needed" expense from stage 02 is carried forward; disclaimer present.

## Review gate
- none
