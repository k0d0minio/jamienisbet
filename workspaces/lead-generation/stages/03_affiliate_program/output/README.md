<!-- run: 03_affiliate_program v1 | date: 2026-06-28 -->
# Affiliate Program — Output (v1)

> **ICM role:** Layer 4 — working (this stage's product). Produced from the stage
> [CONTEXT.md](../CONTEXT.md) contract, drawing on `_config/brand/voice/`, `_config/business/rates.md`,
> and `../../setup/output/config.md`.

## What's here
The **sales kit** a non-technical seller needs to pitch with confidence — the canonical source the
public sellers-site (`websites/sellers-site/`) surfaces. Each file is a human review surface; edit
here and the site copy (in `lib/site.ts`) should follow.

- [`sales-kit/`](sales-kit/) — the seller-facing toolkit:
  - [`pitch.md`](sales-kit/pitch.md) — the customer-facing pitch (the `/pitch` page narrative).
  - [`price-sheet.md`](sales-kit/price-sheet.md) — packages and starting prices.
  - [`objection-handling.md`](sales-kit/objection-handling.md) — the pushbacks and honest answers.
  - [`follow-up-sequence.md`](sales-kit/follow-up-sequence.md) — the nudges that actually close a referral.

## Still pending (separate outputs in this stage's contract)
These are deliberately **not** in this run — they need their own review, and two need a licensed
*contabilista certificado* / lawyer before use:

- `program-overview.md` — the one-page program summary for recruiting sellers.
- `commission-and-payout.md` — the 10% base, timing, and edge cases (finance + tax review).
- `attribution-rules.md` — referral-code rules, kept consistent with `../05_pipeline/`.
- `seller-agreement.md` — the plain-language agreement (**legal review required**).

## Standing rules honoured here
- **Decision-support only.** Prices are business facts set by Jamie; no VAT/IVA outcome is stated — that
  depends on the not-yet-established entity and needs a contabilista (see `_config/business/rates.md`).
- **Voice from source.** Copy follows `_config/brand/voice/` — plain, first-person, no hype.
- **One source of truth.** The website mirrors this; change both together (edit-source).
