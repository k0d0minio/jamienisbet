# Stage 01 — Income Tracking

> **ICM role:** Layer 2 — stage (narrative; contract in CONTEXT.md)
> **Purpose:** Record every invoice issued and paid, and surface outstanding receivables.

## What this folder accomplishes
This stage is the income ledger. When [`workspaces/proposals/`](../../../proposals/) issues an invoice at its `07_invoice` stage, that invoice is recorded here with its client, amount, IVA, issue date, due date, and paid/unpaid status. The stage keeps a running list of what is outstanding so Jamie always knows who owes what and by when. It is the income side of the reserve and reporting math downstream.

**Decision-support only.** This ledger is for planning and accountant handoff, not a certified accounting record; confirm with a licensed Portuguese contabilista certificado.

## How it connects to the architecture
- **Upstream / reads from:** [`workspaces/proposals/`](../../../proposals/) stage `07_invoice` (issued invoices); [`shared/clients/`](../../../../shared/clients/) (client identity).
- **Downstream / feeds:** [`stages/03_tax_reserve/`](../03_tax_reserve/) (income totals); [`stages/04_reporting/`](../04_reporting/); [`tracker/`](../../../../tracker/) (overdue-payment chase reminders).
- **Draws on (Layer 3 reference):** [`../../references/`](../../references/) (chart-of-accounts-lite income categories).

## Contents
- [`CONTEXT.md`](CONTEXT.md) — the Layer 2 contract this stage executes.
- `output/` — the income ledger and outstanding-receivables list (Layer 4 handoff).
- `notes.md` — planned: per-period collection notes (e.g. promised-payment dates).  (Describe only; do not create.)

## Notes
Append-only — never delete a row; mark superseded/credited invoices instead. One currency: EUR. Keep paid-date separate from issue-date so the reserve stage can work on cash actually received when needed.

> Contract: see [CONTEXT.md](CONTEXT.md).
