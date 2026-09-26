# Bug: up-next-pick-unsequenced-stubs

- observed: in an epic whose stubs carry no `- sequence:` line, `fetchRepoTickets`'s `nextOf`
  picks the last stub in tree order as Up next, not the epic's build-order first stub.
- expected: the pick matches the epic's own row order — `sequence ?? build-order place ?? MAX`,
  the same key `epicRows` already sorts on.
- cause: `websites/admin-dashboard/lib/tickets.ts` compared each candidate's `s.sequence ??
  MAX-1` against the current pick's `stubs.find(...).sequence ?? MAX`, looked up fresh each
  time. For two unsequenced stubs that asymmetry (`MAX-1 < MAX`) always favours the later one
  in tree order, and neither side ever fell back to the breakdown's `## Build order` place.
- fix: `lib/tickets.ts`: added `orderKeyOf(s)` — `s.sequence ?? orders.get(s.epic)?.get(s.slug)
  ?.sequence ?? Number.MAX_SAFE_INTEGER` — used on both sides of the `nextOf` comparison, so a
  build-order place breaks the tie and the one sentinel is shared.
- changelog: announce: none (the repo carries no changelog page — `_shared/project-rules.md` →
  Reporting)
- learned: none
