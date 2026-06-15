<!-- run: setup v1 | date: 2026-06-15 -->
# Finance — Locked Configuration (v1)

> Source of truth: **Stripe**. Reserve rates from legal-and-tax; confirm with the contabilista.

## Source of truth
- **Stripe** holds invoices + payments. Fetch read-only via `scripts/stripe-*.sh`. No committed ledgers.

## Tax-reserve rates (set aside per euro of income)
Structure: *trabalhador independente*, *regime simplificado* (see legal-and-tax). Reserve covers
**IRS + Segurança Social** — **no IVA** (foreign clients reverse-charged / out of scope).
- **Flat 30% every year** (IRS + Segurança Social; no IVA). Slightly over-reserves in year 1 (SS-exempt) — a deliberate safety buffer. Confirm with the contabilista.

Pass `30` to `stripe-report.sh --reserve`.

## IVA periodicity
- Periodic IVA declarations + recapitulative (VIES) statements (foreign B2B). Cadence per contabilista.

## Reporting cadence
- **Monthly P&L** + **quarterly IVA**. Currency: EUR.
