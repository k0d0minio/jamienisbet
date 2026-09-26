# Chore: inbox-count-without-full-client-read

- invariant: behaviour unchanged. The Inbox badge and the "Waiting on you" queue keep counting
  the same people they always did (D-15) — only how the badge's number is produced changes.
- change: `packages/services/src/queries/crack-finder.ts` — added `waitingWhere`, the SQL mirror
  of `isStale` + `isOnTodaysQueue` (an open lead stale past `STALE_AFTER_DAYS`, not already owed
  a step on today's outreach queue), and extended `countCracks`'s one round trip with a `waiting`
  column so it rides beside the existing `due`/`unplanned`/`woken`/`idle` tallies rather than
  needing a second query. `STALE_AFTER_DAYS` moved here from the admin dashboard's `lib/leads.ts`
  (which now imports it), matching how that file already gets `IDLE_AFTER_DAYS` from this module.
- change: `websites/admin-dashboard/lib/inbox.ts` — `countFollowUps` (the shell's badge, read on
  every screen) no longer calls `listClients({ archived: false })` at all: the badge's `waiting`
  count now comes straight off `countCracks`'s new column. The crack-count read is wrapped in
  `cache()` from `react` (the same pattern `lib/gates.ts` → `loadGates` already uses for the Gates
  group), so the shell's badge and `/inbox`'s own `loadInbox` share the one query within a request
  instead of each running `countCracks` separately. `loadInbox` still calls `listClients` once,
  for the actual "Waiting on you" rows it renders — that read was never the problem; the badge's
  own copy of it was.
- rollback: revert the commit. `countFollowUps` and `loadInbox` go back to their
  `listClients` + `waitingOnYou` shape, `STALE_AFTER_DAYS` moves back to `lib/leads.ts`. No schema
  or data changed.
- learned: none
