# Stub: Count outreach lateness in calendar days, not elapsed 24h

- lane: bug
- found-by: release inbox-rebuild (code review) · 2026-09-25
- complexity: low
- priority: P3

## Problem

The Inbox's outreach age (`websites/admin-dashboard/lib/inbox.ts` → `outreachRow`) uses
`daysSince(nextActionDue, now)`, which floors elapsed 24-hour periods. A step due at 23:00
yesterday, read at 09:00 today, is 10 hours past due and reads "today", neither late nor red,
though it belongs to yesterday. The old Needs you feed had the same arithmetic; the rebuild
carried it over.

## Proposed change

Count the calendar days between the due date and today on the queue's own day boundary (the
crack-finder's `endOfDay`), so anything due before today reads `Nd late` with N ≥ 1.

## Acceptance criteria (rough)

- [ ] A step due at any time yesterday reads "1d late" in the destructive colour today.
- [ ] A step due today reads "today" whatever the hour.

## Prompt

Run `/pipeline bug inbox-overdue-by-calendar-day`. Context: found by inbox-rebuild's Release
code review; the rule lives in `lib/inbox.ts` (`outreachRow`) and `lib/format.ts` (`daysSince`).
