# JN-010 · Lead profile: make conversion one act

| | |
|---|---|
| Status | ready |
| Type | feature |
| Priority | P1 |
| Size | M |

## Problem

Converting a won lead is four separate manual taps scattered across the profile:
connect/create the delivery repo, link the Stripe customer, tap **Work started**, fill
the deal terms. There is no conversion event — moving status to `won` just runs
`setClientStatus()`. Steps get skipped (repos without Stripe links, won leads without
`work_started_at`), and each skipped step breaks something downstream: no repo means
invisible on the tickets board; no deal terms means the header money numbers lie.

## Acceptance

- [ ] A single **Convert** action (button or guided sheet) on the lead profile walks
      all four steps: status → `won`, repo connect/create, deal terms
      (value/billing/cash-barter), Stripe link — each skippable but explicit
- [ ] Existing individual actions keep working (convert is a composition, not a
      replacement)
- [ ] A won/delivered client with missing conversion pieces shows a visible gap
      indicator on the profile (e.g. "no delivery repo", "no deal value")
- [ ] CI green

## Prompt

Make lead conversion one act in the admin dashboard. The four existing server actions
live in websites/admin-dashboard/app/(app)/actions.ts (updateClientStatus,
connectClientRepo/createClientRepo, saveClientProfile, linkClientToStripe) and the
profile screen is app/(app)/leads/[id]/page.tsx. Add a guided Convert flow composing
them, plus gap indicators for won/delivered clients missing repo, deal terms, or
Stripe. Read .icm/intake/JN-010-one-act-conversion.md for full context. Open a PR on
a claude/ branch; do not run local checks — CI is the source of truth.
