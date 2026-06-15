# Finance Workspace

> **ICM role:** Layer 1 — router
> **Purpose:** Lightweight bookkeeping for Jamie's PT-based AI-consulting business — track invoices, log deductible expenses, reserve for tax, and report — without becoming a full accounting suite.

## What this folder accomplishes
This workspace keeps Jamie's money clear enough to run the business and to hand clean numbers to a Portuguese contabilista certificado. **Stripe is the source of truth** for invoices and payments — read-only scripts ([`stripe-income.sh`](../../scripts/stripe-income.sh), [`stripe-receivables.sh`](../../scripts/stripe-receivables.sh), [`stripe-report.sh`](../../scripts/stripe-report.sh)) fetch income and receivables **on demand**, so no transaction ledgers are committed to the repo. The workspace adds the thin layer Stripe doesn't: the tax-reserve math for the simplified regime, the 15%-justification receipts to keep, and the monthly/quarterly reports a contabilista needs. Generated reports are gitignored (sensitive).

**Decision-support only.** Nothing here replaces a licensed Portuguese contabilista certificado / lawyer; all tax and financial outputs require their review before being acted on.

## How it connects to the architecture
- **Upstream / reads from:** **Stripe** (via the read-only `scripts/stripe-*.sh` fetchers — invoices, payments, receivables); [`shared/clients/`](../../shared/clients/) (bill-to); human input (expense receipts for the 15% rule).
- **Downstream / feeds:** [`workspaces/legal-and-tax/`](../legal-and-tax/) (income/expense totals for compliance); [`tracker/`](../../tracker/) (payment-chase and tax-deadline reminders); the founder and his accountant.
- **Draws on (Layer 3 reference):** [`references/`](references/) (chart-of-accounts-lite, tax-rate notes); [`_config/business/`](../../_config/business/) (legal entity, NIF/VAT, IBAN, rates); [`_config/brand/voice/`](../../_config/brand/voice/) for any client-facing reminder copy.

## Contents
- `setup/` — one-time config: reserve rates (from legal-and-tax), IVA periodicity, reporting cadence.
- `stages/` — `01_income_tracking` (Stripe fetch) → `02_expense_tracking` (the 15% receipts) → `03_tax_reserve` → `04_reporting`.
- `references/` — Layer 3: the tax-reserve rates and report formats (no chart-of-accounts needed under the simplified regime).
- `output/` — generated reports, fetched on demand and **gitignored** (never a committed ledger).

## Notes
Nothing here is a maintained ledger — Stripe holds the transactions; the stages fetch and summarise on a cadence (monthly/quarterly). Reserve and IVA cadence come from the simplified-regime decision in [`workspaces/legal-and-tax/`](../legal-and-tax/). Keep all amounts in EUR. Generated reports are sensitive and gitignored.
