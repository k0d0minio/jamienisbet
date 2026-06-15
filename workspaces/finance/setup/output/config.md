<!-- run: setup v1 | date: 2026-06-15 -->
# Finance — Locked Configuration (v1)

> Source of truth: **Stripe**. Reserve rates from legal-and-tax; confirm with the contabilista.

## Source of truth
- **Stripe** holds invoices + payments. Fetch read-only via `scripts/stripe-*.sh`. No committed ledgers.

## Tax-reserve rates (set aside per euro of income)
Structure: *trabalhador independente*, *regime simplificado* (see legal-and-tax). Reserve covers
**IRS + Segurança Social** — **no IVA** (foreign clients reverse-charged / out of scope).
- **Year 1 (2026):** ~12% — SS-exempt + reduced coefficient; reserve mainly for IRS. **(confirm)**
- **Year 2 (2027):** ~25%. **(confirm)**
- **Year 3+ (2028→):** ~33% (steady-state wedge). **(confirm)**

Pass the current year's rate to `stripe-report.sh --reserve`.

## IVA periodicity
- Periodic IVA declarations + recapitulative (VIES) statements (foreign B2B). Cadence per contabilista.

## Reporting cadence
- **Monthly P&L** + **quarterly IVA**. Currency: EUR.
