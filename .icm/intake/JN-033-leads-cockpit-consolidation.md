# JN-033 · Leads is the cockpit — fold money and today's signals in

| | |
|---|---|
| Status | ready |
| Type | feature |
| Priority | P1 |
| Size | M |

## Problem

The app's promise is "know who is waiting to hear back" — but a normal morning still
takes three screens: Leads for the list, Money for whether anything landed or is
outstanding, and the working-list `<details>` for overdue todos. The direction is
**consolidate**: most days you should never leave Leads.

## Build

On `websites/admin-dashboard/app/(app)/page.tsx`, above the list, a single glanceable
strip built from the JN-032 primitives (depends on that ticket):

- **Money at a glance** — three `Stat`s read from the existing Stripe/finance libs:
  available balance, outstanding across open invoices, received this month (with a
  `Sparkline` of recent weeks). Each taps through to `/money`. With
  `STRIPE_SECRET_KEY` unset the strip simply omits money — same graceful degradation
  the Money page has.
- **Needs-you signals** — replace the working-list summary line with real counts that
  read at a glance: overdue todos, compliance dates due, leads waiting 7+ days. Zero of
  everything collapses to nothing — a quiet day should *look* quiet.
- The existing in play / per month / in kind figures join the same strip as `Stat`s
  instead of header text, so the top of the screen becomes one coherent instrument row
  (horizontal rail on phones, `no-scrollbar`, like the filter chips).

Keep it honest to the standing rules: figures are read live (Stripe stays the
authority), nothing is cached into the DB, and the strip adds no new write paths.
Server-render everything; no client fetching.

## Acceptance

- [ ] Leads opens with money + needs-you signals visible without leaving the screen
- [ ] Strip degrades gracefully without `STRIPE_SECRET_KEY`; quiet days look quiet
- [ ] Phone: one thumb-scrollable rail; desktop: one row; both themes checked
- [ ] No new write paths, no business figures persisted
- [ ] CI green

## Prompt

Consolidate the admin dashboard so the Leads screen is the daily cockpit. Read
.icm/intake/JN-033-leads-cockpit-consolidation.md for full context. Requires the data-viz
primitives from JN-032 (Stat, Sparkline) in @jamie-nisbet/ui — check they exist first.
Add a glanceable strip above the list on websites/admin-dashboard/app/(app)/page.tsx:
live Stripe money stats (reusing the Money page's lib reads, omitted when unconfigured),
overdue todo/compliance/stale-lead counts, and the existing value totals as stat tiles.
Server-rendered, read-only, mobile-first. Open a PR on a claude/ branch; do not run
local checks — CI is the source of truth.
