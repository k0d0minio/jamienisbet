<!-- TEMPLATE — fill {{tokens}} from shared/clients/<slug>/, the approved project outline, and _config/business/.
     Voice: _config/brand/voice/ (friendly, informative, first-person — written for a NON-TECHNICAL reader).
     The BRD is the customer-consumable translation of the internal project outline: business language,
     no internal rates, margins, or effort maths. Tokens: see README.md. -->
# Business Requirements — {{deal.title}}

**For:** {{client.contact_name}}, {{client.legal_name}}
**From:** {{business.name}} — software engineer / AI consultant
**Date:** {{date}}

---

## Why this project
{{deal.problem}} — and the outcome you're after: {{deal.goal}}.

## What success looks like
{{brd.success_criteria}}

## What I'll build
{{brd.deliverables}}

**In scope:** {{deal.scope_in}}
**Out of scope:** {{deal.scope_out}}

## How you'll know it's done
Acceptance criteria — each one is checkable, together they define "finished":

{{brd.acceptance_criteria}}

## Timeline
{{deal.timeline}}

## What I need from you
{{brd.client_inputs}}

## Assumptions & exclusions
{{brd.assumptions}}

---

> Anything not listed under "What I'll build" is out of scope for this phase — happy to scope it
> as a follow-up. Commercials live in the proposal and quote, not here.
<!-- provenance: content from the approved project_outline document (admin pipeline); tone from _config/brand/voice/tone.md -->
