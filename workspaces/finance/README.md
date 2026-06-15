# Finance Workspace

> **ICM role:** Layer 1 — router
> **Purpose:** Lightweight bookkeeping for Jamie's PT-based AI-consulting business — track invoices, log deductible expenses, reserve for tax, and report — without becoming a full accounting suite.

## What this folder accomplishes
This workspace keeps Jamie's money clear enough to run the business and to hand clean numbers to a Portuguese contabilista certificado. It records which invoices have been issued and paid, what is still outstanding, which expenses are deductible, how much cash to set aside for IVA / IRS / Segurança Social, and produces a monthly/quarterly summary. It is deliberately lightweight: a plain-text ledger plus reserve math, not certified accounting.

**Decision-support only.** Nothing here replaces a licensed Portuguese contabilista certificado / lawyer; all tax and financial outputs require their review before being acted on.

## How it connects to the architecture
- **Upstream / reads from:** [`workspaces/proposals/`](../proposals/) stage `07_invoice` (invoices issued); [`shared/clients/`](../../shared/clients/) (who owes what); human input (bank statements, receipts).
- **Downstream / feeds:** [`workspaces/legal-and-tax/`](../legal-and-tax/) (income/expense totals for compliance); [`tracker/`](../../tracker/) (payment-chase and tax-deadline reminders); the founder and his accountant.
- **Draws on (Layer 3 reference):** [`references/`](references/) (chart-of-accounts-lite, tax-rate notes); [`_config/business/`](../../_config/business/) (legal entity, NIF/VAT, IBAN, rates); [`_config/brand/voice/`](../../_config/brand/voice/) for any client-facing reminder copy.

## Contents
- `setup/` — one-time questionnaire that configures this workspace (regime, fiscal year, reserve percentages).
- `stages/` — the numbered pipeline: `01_income_tracking` → `02_expense_tracking` → `03_tax_reserve` → `04_reporting`.
- `references/` — Layer 3 stable reference: chart-of-accounts-lite and tax-rate notes.
- `output/` — Layer 4 working artifacts: ledgers and generated reports.

## Notes
Stages run in order but are also re-entrant: income and expenses are appended continuously, while reserve and reporting are run on a cadence (monthly/quarterly). Keep all amounts in EUR. This is a single-operator workspace, not multi-entity; if Jamie incorporates, revisit the chart-of-accounts-lite in `references/` rather than reshaping the stages.
