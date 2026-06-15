# Pricing Models

> **ICM role:** Layer 3 — reference (proposals). Rate logic + tiering + value-based pricing for Stages 04–05.
> Rates from [`../../../_config/business/rates.md`](../../../_config/business/rates.md); confirm tax with the contabilista.

## Base
- **Standard €120/hour.** Estimate project work in hours, present as a fixed price.
- **Floor** (never below) and **anchor** (open high) live in [`../setup/output/config.md`](../setup/output/config.md).

## Tiering (good / better / best — default)
Build three options that differ by **outcome and scope**, not just hours:
- **Good** — the core problem solved, minimal scope. Near the floor; protects a "yes".
- **Better** *(the target)* — the sensible recommendation; the value framing lands here.
- **Best** — added scope / outcome / speed; makes Better look reasonable and captures high-budget clients.

Anchor with **Best**, recommend **Better**.

## Value-based pricing
- Where the client's upside is estimable (from discovery), price against **their value, not your hours**.
- Method: estimate year-1 value created (revenue, saved hours × loaded cost, risk avoided), then price
  a fair fraction of it. Sanity-check against the hourly floor — never go below it.
- If upside is unknown, fall back to hours × rate within the tier structure.

## Retainers
- Committed monthly hours → ~10% reduction (≈ €108/hour; confirm in setup). Bill recurring and mark
  the client `retainer: true` ([state-and-status](../../../_config/conventions/state-and-status.md)).
  Good for predictable cash — and for the existing retainer client.

## Commission / incentive
- Open to a reduced hourly rate in exchange for outcome upside (revenue share, success fee, equity).
- Only when the upside is real and measurable; document the trigger and a cap.

## Tax on the number (foreign clients)
Clients are non-Portuguese: **IVA is reverse-charged (EU) or out of scope (UK/US)** — quotes and
invoices show no IVA unless the contabilista says otherwise. See
[`../../legal-and-tax/references/iva-vat-notes.md`](../../legal-and-tax/references/iva-vat-notes.md).
