# Report Formats

> **ICM role:** Layer 3 — reference (finance). What each report contains; all figures are fetched
> **read-only from Stripe** (`scripts/stripe-*.sh`) — nothing is a committed ledger.

## Monthly P&L
- **Income (paid)** — `stripe-income.sh`.
- **Real costs** (the 15%-justification receipts) — kept by Jamie, not in Stripe.
- **Tax reserve** for the month — income × the year's reserve rate ([`tax-reserve-rates.md`](tax-reserve-rates.md)).
- **Net.**

## Quarterly IVA
- Periodic IVA declaration + recapitulative (VIES) statement — foreign B2B, typically nil IVA but
  still filed. Confirm cadence with the contabilista.

## Metrics (surfaced in the admin dashboard)
- **Monthly revenue** + **overdue receivables** — from `stripe-report.sh` / Stripe.
- **Pipeline value** + **recurring revenue** — summed from the `biz.clients` rows' `value_minor`
  / `billing_type` (read live on the admin dashboard's Leads screen), not from any repo file.
- **Tax reserve** — accumulated from the monthly P&L.
