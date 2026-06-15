# 03 — Tax Reserve — Contract
<!-- ICM Layer 2 — machine-loaded stage contract. Human narrative is in README.md. -->

## Inputs
- Layer 4 (working): ledgers from stages 01 and 02; config from [`../../setup/`](../../setup/).
- Layer 3 (reference): [`../../references/`](../../references/) tax-rate notes.

## Process
The agent nets output vs input IVA, applies IRS and Segurança Social set-aside percentages to the relevant base, and recommends a total reserve, recording every rate used.

## Outputs
- `tax-reserve.md` -> output/

## Integrations
- none

## Verify
- Income and expense totals match stages 01/02 outputs; every rate cites a source in [`../../references/`](../../references/); reserve never exceeds income; deadlines align with legal-and-tax `05_compliance_calendar`; the contabilista disclaimer is present.

## Review gate
- none
