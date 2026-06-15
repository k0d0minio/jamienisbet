# 02 — Expense Tracking — Contract
<!-- ICM Layer 2 — machine-loaded stage contract. Human narrative is in README.md. -->

## Inputs
- Layer 4 (working): receipts Jamie keeps (SaaS, office, hardware, the contabilista's fee)
- Layer 3 (reference): `../../../legal-and-tax/references/deductible-categories.md` (the 15% rule)

## Process
Under the simplified regime, expenses do NOT reduce the tax base (25% is deemed). So this stage is light: keep the receipts needed for the 15% expense-justification rule (mandatory SS counts toward it). No itemised expense ledger is maintained.

## Outputs
- `expense-notes-<period>.md` -> output/  (generated; gitignored) — a list of receipts kept, not a ledger

## Integrations
- none

## Verify
- Only the 15%-justification receipts are tracked (not a full ledger); each receipt is referenced; no claim that itemised expenses reduce the simplified base.

## Review gate
- none
