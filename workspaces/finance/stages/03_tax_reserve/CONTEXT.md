# 03 — Tax Reserve — Contract
<!-- ICM Layer 2 — machine-loaded stage contract. Human narrative is in README.md. -->

## Inputs
- Layer 4 (working): income from `../01_income_tracking/output/` (or a fresh `scripts/stripe-income.sh` fetch)
- Layer 3 (reference): `../../references/tax-reserve-rates.md`; `../../setup/output/config.md` (the year's rate)

## Process
Apply the year's reserve rate (tax-reserve-rates.md: year-1 ~12% → steady ~33%) to period income to recommend a set-aside for IRS + Segurança Social. No IVA reserve (foreign clients reverse-charged / out of scope). Record the rate used.

## Outputs
- `tax-reserve-<period>.md` -> output/  (generated; gitignored)

## Integrations
- `scripts/stripe-income.sh` (read-only) if fetching income directly.

## Verify
- The rate matches the year in tax-reserve-rates.md / config; the reserve never exceeds income; no IVA is reserved; the as-of date + contabilista disclaimer are present; deadlines align with legal-and-tax `05_compliance_calendar`.

## Review gate
- none
