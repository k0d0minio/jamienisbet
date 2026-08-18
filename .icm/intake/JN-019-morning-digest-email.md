# JN-019 · Morning digest email to self

| | |
|---|---|
| Status | ready |
| Type | feature |
| Priority | P2 |
| Size | S |
| Depends on | JN-017 |

## Problem

The heartbeat (JN-016) reaches the next Claude session and the sweeps (JN-017/018) reach
the dashboard — nothing reaches Jamie on a day he opens neither. One daily email to
himself closes that: today's tickets, open sweep tasks, overdue tasks/compliance,
pending form links.

This is a notification **to self** — the review surface, not an outbound action. It must
never be able to mail anyone but Jamie.

## Build

A daily Vercel cron on the admin dashboard (reuse the JN-017 guard pattern) that renders
the digest and sends via Resend to jamie.nisbet@outlook.be. The dashboard has no Resend
today — add the dependency + `RESEND_API_KEY` env var; `websites/portfolio` has the
sending pattern to copy. Today's tickets come from the board's existing parser
(`lib/tickets.ts`). Recipient hardcoded to Jamie; skip sending when the digest is empty.
Register in ROUTINES.md.

## Acceptance

- [ ] One email per day at most, only when there is something to say
- [ ] Recipient is Jamie only, not configurable from data
- [ ] ROUTINES.md row added
- [ ] CI green

## Prompt

Add a morning digest email to the jamienisbet admin dashboard. Read
.icm/intake/JN-019-morning-digest-email.md for full context. Daily Vercel cron, guarded
like /api/cron/sweep, rendering today tickets (lib/tickets.ts), open sweep tasks,
overdue tasks and compliance dates, and pending form links, sent via Resend to
jamie.nisbet@outlook.be only — hardcode the recipient. Skip empty digests. Open a PR on
a claude/ branch; do not run local checks — CI is the source of truth.
