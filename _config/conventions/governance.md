# Governance — Disclaimers, Data & Secrets

> **ICM role:** Layer 3 — reference (convention)
> **Purpose:** One place for the rules that keep the business safe and compliant: the decision-support disclaimer, data handling, and secrets.

## 1. Decision-support disclaimer (single source)
Legal, tax, and financial outputs are **decision-support, not professional advice**. The canonical
line every such output cites:

> *This is decision-support, not professional advice. Review with a licensed Portuguese
> contabilista certificado / lawyer before acting on it.*

Reference this standard rather than re-wording it per file (fix-the-source: one line to maintain).
Legal/tax reference notes additionally carry a **source + as-of date** so staleness is visible as
Portuguese law changes, e.g. `<!-- source: portaldasfinancas.gov.pt; as-of: 2026-06-15 -->`.

## 2. Data handling (GDPR / RGPD)
Client folders hold personal data (names, NIF/VAT, contact). Minimal discipline:
- **Keep only what the business needs** to quote, invoice, and deliver.
- **Lawful basis** is contract / legitimate interest for an active or prospective client.
- **Retention:** keep while the relationship is active and as long as tax law requires records
  (confirm the period with the contabilista); prune beyond that.
- Personal data never leaves the repo except in a client-facing document the human has approved.

## 3. Secrets
- **Business facts** (NIF, IBAN, registered address, rates) may live in plaintext in
  `_config/business/` — they are not credentials.
- **Credentials** (API keys for Resend, Stripe, Vercel, GitHub) live in `.env` (gitignored) and the
  Vercel environment store. **Never committed.** `.env.example` documents which keys exist, with
  blank values.
- A future lawyer review of the master contract template is expected (not yet done); until then,
  generated contracts carry the disclaimer above.

Related: [`scripts-and-integrations.md`](scripts-and-integrations.md) · [`client-and-slug.md`](client-and-slug.md)
