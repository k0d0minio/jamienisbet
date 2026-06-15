# Stage 03 — Tax Reserve

> **ICM role:** Layer 2 — stage
> **Purpose:** Calculate how much cash to set aside for IVA, IRS and Segurança Social based on tracked income and expenses.

## What this folder accomplishes
This stage turns the income and expense ledgers into a single number Jamie should not spend: his tax reserve. Using the reserve percentages from [`../../setup/`](../../setup/) and the rate notes in references, it estimates IVA owed (output IVA less deductible input IVA), an IRS set-aside, and Segurança Social contributions, then states a recommended amount to park. It pairs with the legal-and-tax compliance calendar so the reserved cash is ready when each deadline lands.

**Decision-support only — not a tax return.** Every figure here is a planning estimate and must be reviewed by a licensed Portuguese contabilista certificado before any payment or filing.

## How it connects to the architecture
- **Upstream / reads from:** [`stages/01_income_tracking/`](../01_income_tracking/) (income, output IVA); [`stages/02_expense_tracking/`](../02_expense_tracking/) (deductible expenses, input IVA); [`../../setup/`](../../setup/) (reserve percentages, regime).
- **Downstream / feeds:** [`stages/04_reporting/`](../04_reporting/); [`workspaces/legal-and-tax/`](../../../legal-and-tax/) stage `05_compliance_calendar` (amounts due per deadline); [`tracker/`](../../../../tracker/) (set-aside reminders).
- **Draws on (Layer 3 reference):** [`../../references/`](../../references/) (tax-rate notes); [`_config/business/`](../../../../_config/business/) (regime, NIF/VAT).

## Contents
- `output/` — the reserve calculation per period (Layer 4 handoff).
- `assumptions.md` — planned: which rates/percentages a given calculation used.  (Describe only; do not create.)

## Stage contract
### Inputs
- Layer 4 (working): ledgers from stages 01 and 02; config from [`../../setup/`](../../setup/).
- Layer 3 (reference): [`../../references/`](../../references/) tax-rate notes.
### Process
The agent nets output vs input IVA, applies IRS and Segurança Social set-aside percentages to the relevant base, and recommends a total reserve, recording every rate used.
### Outputs
- `tax-reserve.md` -> output/
### Verify
- Income and expense totals match stages 01/02 outputs; every rate cites a source in [`../../references/`](../../references/); reserve never exceeds income; deadlines align with legal-and-tax `05_compliance_calendar`; the contabilista disclaimer is present.

## Notes
This stage estimates, it does not file. Keep the assumptions explicit so the accountant can correct one number without redoing the ledger. Re-run each fiscal period and whenever rates in references change.
