# JN-034 · Money reads at a glance

| | |
|---|---|
| Status | ready |
| Type | feature |
| Priority | P2 |
| Size | M |

## Problem

Money is four sections of tables. Correct, but you read it like a bank statement: no
shape of the month, no trend, invoice status buried in badge text. Once JN-032's
primitives exist, this screen should become the place they earn their keep.

## Build

On `websites/admin-dashboard/app/(app)/money/page.tsx` (depends on JN-032):

- **Header instrument row** — `Stat` tiles for available, pending, outstanding; a
  `Sparkline` of payments over the last 12 weeks; a `Meter` of collected vs outstanding
  this quarter. All computed server-side from data already fetched — add no new Stripe
  API surface unless a figure is otherwise impossible.
- **Invoice list visual language** — status becomes colour-coded at the row level
  (muted semantic tints consistent with the existing `invoice-status-badge`), amount in
  mono flush right, overdue invoices surfaced to the top of the open group.
- **Phone card lists** get the same treatment as leads rows: primary fact (who, how
  much) on line one, status + age on line two, hosted-invoice link as the row tap.
- Empty states designed (a Stripe account with no invoices yet should invite raising
  one, not show four empty tables).

## Acceptance

- [ ] Balance/trend/part-of-whole visible in the first viewport on a phone
- [ ] Invoice status readable by scan (colour + position), not just by reading badges
- [ ] Designed empty states for each section
- [ ] No new Stripe write paths; both themes checked
- [ ] CI green

## Prompt

Make the admin dashboard's Money screen glanceable. Read
.icm/intake/JN-034-money-glanceability.md for full context. Requires the data-viz
primitives from JN-032 (Stat, Sparkline, Meter) in @jamie-nisbet/ui — check they exist
first. Rework websites/admin-dashboard/app/(app)/money/page.tsx: header instrument row
computed from already-fetched Stripe data, colour-coded invoice rows with overdue
surfaced first, designed empty states, phone card lists. Open a PR on a claude/ branch;
do not run local checks — CI is the source of truth.
