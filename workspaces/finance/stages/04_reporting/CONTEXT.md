# 04 — Reporting — Contract
<!-- ICM Layer 2 — machine-loaded stage contract. Human narrative is in README.md. -->

## Inputs
- Layer 4 (working): `scripts/stripe-report.sh` (income + receivables + reserve for the period)
- Layer 3 (reference): `../../references/report-formats.md`

## Process
Run stripe-report.sh for the period; produce the monthly P&L and (quarterly) the IVA/VIES filing summary; surface the metrics for state/dashboard (revenue, overdue receivables, tax reserve). A founder view + an accountant pack from the same fetch.

## Outputs
- `<period>-summary.md` -> output/  (generated; gitignored)
- `<period>-accountant-pack.md` -> output/  (generated; gitignored)

## Integrations
- `scripts/stripe-report.sh` (read-only; composes stripe-income + stripe-receivables).

## Verify
- Figures match the Stripe fetch; the reserve uses the year's rate; quarterly periods carry the IVA/VIES note; the as-of date + disclaimer are present.

## Review gate
- Jamie reviews the founder view before it informs the morning brief; the accountant pack is the formal handoff.
