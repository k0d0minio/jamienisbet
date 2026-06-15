<!-- TEMPLATE — fill {{tokens}} from shared/clients/<slug>/, the proposals run output, and _config/business/.
     Voice: _config/brand/voice/ (friendly, informative, first-person). Tokens: see README.md. -->
# Proposal — {{deal.title}}

**For:** {{client.contact_name}}, {{client.legal_name}}
**From:** {{business.name}} — software engineer / AI consultant
**Date:** {{date}} · **Valid until:** {{valid_until}}

---

## The goal
{{deal.problem}} — and what you want instead: {{deal.goal}}.

If nothing changes: {{deal.cost_of_inaction}}.

## How I'd approach it
{{deal.approach}}

**In scope:** {{deal.scope_in}}
**Out of scope:** {{deal.scope_out}}

## Your options
Three ways to do this — most clients pick **Better**.

| | Good | **Better** (recommended) | Best |
|---|---|---|---|
| What you get | {{tier.good.summary}} | {{tier.better.summary}} | {{tier.best.summary}} |
| Price | €{{tier.good.price}} | **€{{tier.better.price}}** | €{{tier.best.price}} |

Full pricing is in the attached quote.

## Timeline
{{deal.timeline}}

## Why work with me
{{business.why}} You talk to the person building it — and for larger work I bring trusted contractors in so capacity is never the bottleneck.

## What happens next
{{deal.next_step}} — reply to this and I'll get started.

---

> Prices are in EUR. Tax handling for non-Portuguese clients is set out in the quote. This proposal
> is valid until {{valid_until}}.
<!-- provenance: scope from proposals/01_intake; options from proposals/03_negotiation_strategy + 05_quote; tone from _config/brand/voice/tone.md -->
