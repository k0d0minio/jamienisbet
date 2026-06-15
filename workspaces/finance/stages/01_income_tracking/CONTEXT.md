# 01 — Income Tracking — Contract
<!-- ICM Layer 2 — machine-loaded stage contract. Human narrative is in README.md. -->

## Inputs
- Layer 4 (working): live Stripe data via `scripts/stripe-income.sh` + `scripts/stripe-receivables.sh` (read-only)
- Layer 3 (reference): `shared/clients/` (bill-to reconciliation); `../../references/report-formats.md`

## Process
Fetch paid income and open/overdue receivables for the period from Stripe (read-only). Reconcile client names against `shared/clients/`. Produce a period income summary — not a maintained ledger; Stripe stays the source of truth.

## Outputs
- `income-<period>.md` -> output/  (generated; gitignored)

## Integrations
- `scripts/stripe-income.sh`, `scripts/stripe-receivables.sh` — read-only fetches from Stripe.

## Verify
- Figures match Stripe at fetch time; client names reconcile to `shared/clients/`; overdue is computed against the run date; nothing is hand-edited into a parallel ledger.

## Review gate
- none (read-only fetch + summary; auto-runs per the autonomy policy).
