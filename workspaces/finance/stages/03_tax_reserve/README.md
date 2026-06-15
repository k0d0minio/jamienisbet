# Stage 03 — Tax Reserve

> **ICM role:** Layer 2 — stage (narrative; contract in CONTEXT.md)
> **Purpose:** Recommend how much cash to set aside for IRS + Segurança Social, from Stripe income × the year's reserve rate.

## What this folder accomplishes
This stage turns period income (fetched from Stripe) into the number Jamie shouldn't spend: his tax reserve. It applies the **year's reserve rate** from [`../../references/tax-reserve-rates.md`](../../references/tax-reserve-rates.md) (year-1 ~12% while SS-exempt, rising to ~33% steady-state) to the income, for **IRS + Segurança Social** — there is **no IVA to reserve** (foreign clients are reverse-charged / out of scope). It pairs with the legal-and-tax compliance calendar so the cash is ready when each deadline lands.

**Decision-support only — not a tax return.** Confirm the rate and figures with a licensed Portuguese contabilista certificado.

## How it connects to the architecture
- **Upstream / reads from:** [`stages/01_income_tracking/`](../01_income_tracking/) (or a fresh `scripts/stripe-income.sh` fetch); [`../../setup/output/config.md`](../../setup/) (the year's rate).
- **Downstream / feeds:** [`stages/04_reporting/`](../04_reporting/); [`workspaces/legal-and-tax/`](../../../legal-and-tax/) stage `05_compliance_calendar`; [`tracker/`](../../../../tracker/) (set-aside reminders).
- **Draws on (Layer 3 reference):** [`../../references/tax-reserve-rates.md`](../../references/tax-reserve-rates.md).

## Contents
- [`CONTEXT.md`](CONTEXT.md) — the Layer 2 contract this stage executes.
- `output/` — the reserve calculation per period (gitignored).

## Notes
Don't over-reserve in year 1 (SS-exempt) and starve cash — Jamie draws everything to live on. Re-run each period and when the rate changes.

> Contract: see [CONTEXT.md](CONTEXT.md).
