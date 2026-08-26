# JN-018 · Sweep pack two — forms chase, conversion gaps, compliance lookahead

| | |
|---|---|
| Status | ready |
| Type | feature |
| Priority | P2 |
| Size | S |
| Depends on | JN-017 |

## Problem

Three more one-query holes, each answerable by the JN-017 sweep route:

- **Unanswered forms** — `biz.form_links` has `sent_at` and a null `completed_at`, but
  nothing asks "sent 10 days ago, still pending"; pending links surface only on one
  lead's profile.
- **Conversion gaps** — `conversionGaps()` (repo / deal value / Stripe customer missing
  on a customer-status client) paints one profile at a time; nothing sweeps all
  customers.
- **Compliance lookahead** — `biz.compliance_dates` has a recurrence engine and no
  reader beyond the working-list strip. (Table likely empty until JN-027 unblocks —
  build the sweep anyway, it costs nothing.)

## Build

On the JN-017 route, same idempotency rule (`source: sweep`, skip while an open sweep
task exists for the same subject):

1. `form_links` where `completed_at is null and sent_at < now() - 10 days` → task
   "Chase <name>'s <form> answers".
2. `conversionGaps()` swept across all `customerStatuses` clients → one task per gapped
   client naming the gaps.
3. `compliance_dates` due within 7 days → task. Register all three in ROUTINES.md.

## Acceptance

- [ ] Each condition produces exactly one open task however many times the sweep runs
- [ ] ROUTINES.md rows added
- [ ] CI green

## Prompt

Extend the admin dashboard's /api/cron/sweep route (built by JN-017) with three sweeps.
Read .icm/intake/JN-018-sweep-pack-two.md for full context: unanswered form links
(>10 days), conversion gaps across all customer-status clients (reuse conversionGaps in
projects/jamienisbet/websites/admin-dashboard/app/(app)/leads/[id]/), and compliance dates due within 7 days.
Same idempotency convention as the stale-lead sweep; tasks only, never email. Open a PR
on a claude/ branch; do not run local checks — CI is the source of truth.
