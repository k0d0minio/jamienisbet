# Finance Stages

> **ICM role:** Layer 1 — router
> **Status:** the daily run-process (income + receivables) now lives in the **admin dashboard**
> (`/finances`, `/invoices`); these contracts remain the Layer-2 specs it mirrors, and the
> reserve/reporting stages still run as workspace runs.
> **Purpose:** Route to the correct lightweight-bookkeeping stage and encode their execution order.

## What this folder accomplishes
This folder holds the four numbered stages that make up Jamie's bookkeeping pipeline. The numbering encodes order: income comes in, expenses are logged, the tax reserve is calculated from both, and a report summarises the period. Each stage does exactly one job and writes to its own `output/` (Principle 1), so the human can review each handoff before the next stage runs (Principle 4).

**Decision-support only.** The reserve and reporting stages produce planning figures, not certified accounts; all require review by a licensed Portuguese contabilista certificado.

## How it connects to the architecture
- **Upstream / reads from:** [`../setup/`](../setup/) (workspace config); Stripe invoices raised in the admin dashboard; `biz.clients` records.
- **Downstream / feeds:** [`../output/`](../output/) (ledgers and reports); [`workspaces/legal-and-tax/`](../../legal-and-tax/); the dashboard's daily brief.
- **Draws on (Layer 3 reference):** [`../references/`](../references/) (chart-of-accounts-lite, tax-rate notes).

## Contents
- `01_income_tracking/` — record invoices issued/paid and outstanding receivables.
- `02_expense_tracking/` — log deductible business expenses.
- `03_tax_reserve/` — calculate how much to set aside for IVA / IRS / Segurança Social.
- `04_reporting/` — monthly/quarterly summary for founder and accountant.

## Notes
The income and expense stages are append-only and run continuously; the reserve and reporting stages run on a cadence (monthly/quarterly) and read the cumulative ledgers. A stage's `output/` is the Layer 4 handoff to the next stage. Keep the pipeline lightweight — resist adding payroll, depreciation schedules, or multi-entity logic here.
