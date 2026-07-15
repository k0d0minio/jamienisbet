<!-- TEMPLATE — fill {{tokens}} from what was agreed at the meeting, the client record in the admin dashboard (Neon biz.clients), and _config/business/.
     Voice: _config/brand/voice/ (friendly, informative, first-person). Tokens: see README.md.
     The proposal is written AFTER the plan is agreed in person — it confirms the agreement,
     it does not open a negotiation. Its payment schedule is executed 1:1 as Stripe invoices. -->
# Proposal — {{deal.title}}

**For:** {{client.contact_name}}{{client.legal_name ? ", " + client.legal_name : ""}}
**From:** {{business.name}} — software engineer / AI consultant
**Date:** {{date}} · **Valid until:** {{valid_until}}

---

## What we agreed
{{deal.agreed_summary}} — as we discussed on {{deal.meeting_date}}.

## Cost & payment schedule
The total for this work is **€{{deal.total}}**, paid per milestone:

| Milestone | Amount |
|---|---|
| {{payment.milestone_label}} | €{{payment.milestone_amount}} |
| **Total** | **€{{deal.total}}** |

Each milestone is invoiced when it falls due; invoices are payable within 14 days.

## Business requirements
What the work must achieve for you, in your terms:

- {{deal.business_requirements}}

## Technical requirements
How I'll build it:

- {{deal.technical_requirements}}

**In scope:** {{deal.scope_in}}
**Out of scope:** {{deal.scope_out}}

## Timeline
{{deal.timeline}}

## Terms of working together
- The scope above is the scope. It's what the price covers — and I protect it so the
  budget and timeline hold.
- Changes are welcome: anything outside the scope is written up as a small change
  request with its own price, agreed before I build it.
- Work starts when the first milestone is paid. Each later milestone is invoiced when
  it falls due.
- You own the deliverables once the final milestone is paid. I keep the right to
  reference the work in my portfolio unless we agree otherwise.
- Either of us can end the engagement in writing; work completed up to that point is
  invoiced pro rata.

## How we'll communicate
To keep the project moving (and your budget intact):

- **Bundle small requests.** Collect minor tweaks and questions into one message or a
  short weekly list rather than sending them one by one — I'll handle them in batches.
- **One channel.** We keep project communication in {{deal.channel}} so decisions
  aren't scattered.
- **Quick decisions.** Where I need a call from you, I'll ask a direct question; a
  prompt answer keeps the timeline honest.

## What happens next
Reply confirming this proposal and I'll send the first invoice — work starts as soon
as it's paid.

---

> Prices are in EUR. This proposal is valid until {{valid_until}}. Pricing and tax/legal
> treatment are decision-support and to be confirmed with a licensed Portuguese
> contabilista certificado (and a lawyer for contractual terms).
<!-- provenance: agreement from the deal's meeting notes (admin dashboard, step 2); rates from _config/business/rates.md; tone from _config/brand/voice/tone.md -->
