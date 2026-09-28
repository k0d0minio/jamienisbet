# Bug: fix-inbox-overdue-calendar-day

- observed: the Inbox's outreach age (`outreachRow` in `lib/inbox.ts`) reads "today" for a step
  10 hours past due — a step due yesterday at 23:00, read at 09:00 today — because it floors a
  rolling 24 hours rather than counting calendar days.
- cause: `daysSince` (`lib/format.ts`) computes `floor((now - since) / DAY_MS)`, a rolling
  24-hour count. `outreachRow` fed it `nextActionDue`, a due-style date whose lateness should be
  counted on the day boundary the crack-finder itself uses (`endOfDay`), not on elapsed time.
- fix: `lib/format.ts` — added `daysLate(due, now)`, which diffs calendar-day boundaries
  (midnight to midnight) instead of exact timestamps. `lib/inbox.ts` → `outreachRow` now calls
  `daysLate` instead of `daysSince` for `nextActionDue`. `daysSince` is unchanged and still used
  where the elapsed-time semantic is correct (`daysWaiting` in `lib/leads.ts`, and `wakeRow`'s
  "woke N days ago", neither of which the report named).
- changelog: announce: none (this repo has no changelog page — `_shared/project-rules.md` →
  Reporting).
- learned: none.
