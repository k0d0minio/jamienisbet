# Affiliate Program — Local Sellers & Partners

> **ICM role:** Layer 3 — reference (lead-generation). The stable rules of the 10% program and the
> spec the public sellers-site (`websites/sellers-site/`) implements.

## The offer sellers pitch
- **Landing page + contact form.** Minimum **€200**; sellers quote freely ≥ €200 without approval.
- More complex (multi-page, app, AI, integrations) → the seller introduces Jamie; Jamie quotes.

## Commission
- **10% of what Jamie invoices**, paid **on payment received** from the client.
- One statement per seller (from finance) so payouts are unambiguous.

## Attribution (no double-claims)
- Each seller has a **unique referral code**.
- A lead is logged via the **public sellers-site** with that code at first contact — the code is the
  source of truth for who gets paid.
- First valid code on a new customer wins; collisions surface for Jamie's review.

## Sellers-site capture (the spec `websites/sellers-site/` builds)
- **Seller lead form:** seller referral code, customer name + contact, one-line need, rough budget.
- **Partner referral form:** partner name, customer, what they need.
- A submission creates a lead in lead-generation → project-triage. Attribution carries through to payout.

## Seller starter-kit (from `_config/brand/`)
A one-pager, before/after examples, a price sheet, and brand assets — so a seller can pitch without
understanding the tech. Their job is **warm intros + the simple landing-page sale**; Jamie protects
margin and brand by quoting anything bigger.

## Partners
Reciprocal referrals with accountants, print shops, co-working spaces, and agencies who serve the
same customer — high trust, zero ad spend.
