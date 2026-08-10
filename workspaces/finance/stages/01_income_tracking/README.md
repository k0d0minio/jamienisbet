# Stage 01 — Income Tracking

> **ICM role:** Layer 2 — stage (narrative; contract in CONTEXT.md)
> **Status:** this stage's run-process now lives in the **admin dashboard** (`/money` shows live
> balance, income and receivables straight from Stripe). This contract remains the Layer-2 spec
> that behaviour mirrors.
> **Purpose:** Fetch income and receivables from Stripe (the source of truth) for the period — no maintained ledger.

## What this folder accomplishes
Stripe holds the invoices and payments. This stage **fetches** them read-only — the admin dashboard's `/money` page is the daily surface; `scripts/stripe-income.sh` (paid income) and `scripts/stripe-receivables.sh` (open + overdue) remain as local fetchers — reconciles client names against the `biz.clients` records (kept in sync with Stripe customers by the dashboard), and produces a period income summary for the reserve and reporting stages. It is **not** a committed ledger — the generated summary is gitignored (sensitive), and Stripe stays the single source of truth.

**Decision-support only.** Figures are for planning and accountant handoff; confirm with a licensed Portuguese contabilista certificado.

## How it connects to the architecture
- **Upstream / reads from:** **Stripe** (read-only, via the dashboard `/money` or `scripts/stripe-*.sh`); `biz.clients` (client identity).
- **Downstream / feeds:** [`stages/03_tax_reserve/`](../03_tax_reserve/) (income totals); [`stages/04_reporting/`](../04_reporting/); the dashboard's daily brief (overdue-payment chase reminders).
- **Draws on (Layer 3 reference):** [`../../references/report-formats.md`](../../references/report-formats.md).

## Contents
- [`CONTEXT.md`](CONTEXT.md) — the Layer 2 contract this stage executes.
- `output/` — the generated income summary (gitignored; never a committed ledger).

## Notes
Read-only — Stripe is the truth; this stage never writes back to Stripe and never keeps a parallel ledger. One currency: EUR.

> Contract: see [CONTEXT.md](CONTEXT.md).
