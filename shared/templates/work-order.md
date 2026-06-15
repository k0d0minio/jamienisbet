<!-- TEMPLATE — the agreed scope of a specific piece of work. Fill {{tokens}}. Tokens: see README.md. -->
# Work Order — {{deal.title}}

**Between:** {{business.name}} ("the Consultant") and {{client.legal_name}} ("the Client")
**Date:** {{date}} · **Ref:** {{work_order.number}}

## Deliverables
{{deal.deliverables}}

## Milestones
{{deal.milestones}}

## Acceptance criteria
{{deal.acceptance_criteria}}

## Out of scope
{{deal.scope_out}}

## Price & schedule
- **Price:** €{{price.total}} ({{price.basis}}).
- **Deposit:** {{terms.deposit}}; balance on acceptance.
- **Timeline:** {{deal.timeline}}.

## Change control
Anything outside the deliverables above is a change: it's quoted and agreed before work starts —
never absorbed silently.

> Signed by both parties before work begins. This work order sits under the master contract
> ({{contract.ref}}); where they conflict, the contract governs.
<!-- provenance: scope from proposals/01_intake + 04_proposal; price from 05_quote -->
