# Stub: A deadlines-and-threads view for the Friday review, readable on a phone

- feature-slug: deadlines-and-threads-view
- scope: deal-record-in-git
- sequence: 2 of 4
- depends-on: deal-record-read-write-git
- priority: P2
- complexity: medium
- found-by: icm-board restructure · 2026-10-07 (D50)
- sources: icm-board `workspaces/threads/CONTEXT.md` (the unit, the states, the weekly review) · `_system/scripts/week-review.sh` (the table the view mirrors) · `workspaces/deals/README.md` (`deadlines[]`, `next_action_due`)
- touches: `websites/admin-dashboard/app/(app)/` (a new `/week` page) · `lib/deals.ts` · a new `lib/threads.ts` (read-only)

## Problem

The weekly review happens on Friday, on a phone, in fifteen minutes (D50). `week-review.sh`
prints the table in a terminal; nothing shows it where Jamie will look. The deal records now
carry `deadlines[]` and `next_action_due`, and `workspaces/threads/` carries the open loops with
their class, age, what they wait on and the last log line — all readable over the GitHub API
the dashboard already uses for the deal folders.

## Proposed change

- A `/week` page: every open thread (folder under `workspaces/threads/` not starting with `_`)
  with class (from `brief.md`), age, the first line of `waiting.md`, the last `- ` line of
  `log.md`; every `deadlines[]` entry within 30 days across the records; every `next_action_due`
  past or within 7 days; the `_someday/` count. The same columns as `week-review.sh`, so the
  two never disagree.
- Read-only: the verdict is a log line Jamie writes (by hand, or — once stub 1 lands — a
  "log a verdict" field that appends `- <date> — review: <verdict> — <line>` to the thread's
  `log.md` as one commit, the same Contents-API path). No scheduling, no notification.
- Links each row to the file on GitHub.

## Acceptance criteria (rough)

- [ ] The page lists the two threads opened on 2026-10-07 and casey-hebbel's 2026-10-25 deadline exactly as `week-review.sh` does
- [ ] Nothing writes without an explicit tap; nothing is sent
- [ ] CI green
