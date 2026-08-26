# JN-017 · Business sweeps — cron route, auth guard, stale-lead task

| | |
|---|---|
| Status | ready |
| Type | feature |
| Priority | P1 |
| Size | M |

## Problem

A portfolio lead lands `status: new`, `last_touched_at: null`, and after 7 days the only
signal is a red row (`STALE_AFTER_DAYS`) on a page nobody is obliged to open. Staleness
is a colour, not a process. Everything a nudge needs already exists in
`packages/services`: `openStatuses`, the `coalesce(last_touched_at, created_at)` sort,
and `createTask` — a task lands in the working-list strip and on the lead's profile with
zero new UI.

Unlike the heartbeat (JN-016), this reads only Neon, so it can run as a Vercel cron on
the admin dashboard. There is no service-auth path today — `proxy.ts`'s matcher
deliberately skips `/api` — so the guard must be built alongside it.

## Build

1. `/api/cron/sweep` route in `websites/admin-dashboard`, guarded by a `CRON_SECRET`
   Bearer check inside the handler.
2. A daily `crons` entry in the dashboard's `vercel.json`.
3. First sweep: open leads (`openStatuses`) with
   `coalesce(last_touched_at, created_at) < now() - 7 days` → insert a `biz.tasks` row
   ("Follow up with <name>", linked `client_id`).
4. Idempotency: routine tasks must be recognisable and must never stack. Recommend a
   `source` column on `biz.tasks` (migration; `manual` | `sweep`), and skip the insert
   while an open sweep task exists for the same client.
5. Register the routine in `_system/contracts/ROUTINES.md` (created by `ICM-001`) —
   **that file is in the `icm-board` repo**, so this step is a separate commit there.

The sweep writes tasks only — no email, no client contact, per the standing rule.

## Acceptance

- [ ] Unauthenticated requests to the route are rejected
- [ ] A stale open lead ends up with exactly one open follow-up task, however many times
      the sweep runs
- [ ] Routine registered in ROUTINES.md
- [ ] CI green

## Prompt

Build the stale-lead sweep for the jamienisbet admin dashboard. Read
.icm/intake/JN-017-cron-sweeps-stale-leads.md for full context. Add a
CRON_SECRET-guarded /api/cron/sweep route (proxy.ts skips /api — auth goes in the
handler), a daily vercel.json cron, a `source` column on biz.tasks via drizzle
migration, and the stale-open-lead query inserting idempotent follow-up tasks via
packages/services. Tasks only — never send email or contact a client. Open a PR on a
claude/ branch; do not run local checks — CI is the source of truth.
