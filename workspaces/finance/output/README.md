# Finance Output

> **ICM role:** Layer 4 — working
> **Purpose:** Hold the per-run working artifacts of the finance pipeline — the ledgers and the generated reports.

## What this folder accomplishes
This is where the finance workspace's living numbers accumulate: the income ledger, the expense ledger, the periodic tax-reserve calculations, and the monthly/quarterly reports. These are the artifacts that change every period, as opposed to the stable categories and rates in [`references/`](../references/). Keeping them here gives Jamie one plain-text place to open, review at each gate, and hand to his accountant.

**Decision-support only.** The ledgers and reports here are management records and planning estimates, not certified accounts; all require review by a licensed Portuguese contabilista certificado.

## How it connects to the architecture
- **Upstream / reads from:** the `output/` of each stage in [`stages/`](../stages/) (01 income, 02 expenses, 03 reserve, 04 reports).
- **Downstream / feeds:** the founder review gate; his contabilista certificado; [`workspaces/legal-and-tax/`](../../legal-and-tax/) (period figures); the dashboard's working list (reminders derived from receivables and deadlines).
- **Draws on (Layer 3 reference):** [`references/`](../references/) (categories and rates the artifacts are built against).

## Contents
- `income-ledger.md` — planned: rolled-up issued/paid invoices and receivables.  (Describe only; do not create.)
- `expense-ledger.md` — planned: rolled-up deductible expenses by category.  (Describe only; do not create.)
- `tax-reserve.md` — planned: latest reserve calculation.  (Describe only; do not create.)
- `reports/` — planned: dated period summaries and accountant packs.  (Describe only; do not create.)

## Notes
Treat as append-and-version, not overwrite: keep prior periods so reports remain reproducible. Each stage owns its own `output/` inside `stages/`; this workspace-level `output/` is the consolidated, founder-facing view. EUR throughout.
