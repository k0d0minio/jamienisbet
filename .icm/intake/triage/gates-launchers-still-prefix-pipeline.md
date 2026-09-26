# Stub: gates.ts's launch strings still carry the `/pipeline ` prefix

- lane: chore
- found-by: board-sends-bare-verb (chore) · 2026-09-26
- complexity: low

## Problem

`websites/admin-dashboard/lib/tickets.ts` now sends a bare verb + slug for every ticket pick-up
(`new <scope>/<slug>`, `<lane> <slug>`, `build|release <slug>` — no `/pipeline ` prefix, no gate
on a probed router file). `lib/gates.ts` still builds its own launch strings with the prefix and
without that gate: `launchOf(repo, "Launch "new"", "/pipeline new", DEFINE_HINT, false)` (the
scope-batch gate row) and the `/pipeline ${readyTicked ? "release" : "build"} ${slug}` line (the
PR gate row). Two code paths now send different forms for the same routing semantics.

## Proposed change

Drop the `/pipeline ` prefix from both strings in `gates.ts`, matching `tickets.ts`'s
`pickupOnly`. Investigate whether the two launch-string builders should share one helper instead
of drifting independently again.
