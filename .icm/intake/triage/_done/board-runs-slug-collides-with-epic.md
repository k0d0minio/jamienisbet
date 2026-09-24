# Stub: The board's In flight batch shares the slug `runs` with any epic folder of that name

- lane: bug
- found-by: master-detail-shell / Release code review · 2026-09-24
- complexity: low

## Problem

`websites/admin-dashboard/components/board-model.ts` gives the In flight pseudo-batch the slug
`runs` (a run's id is `runs/<slug>`). An intake epic folder named `runs` (`.icm/intake/runs/`)
would collide: duplicate React keys in the repo section, `?b=<repo>/runs` resolving to the epic,
and its stub ids (`runs/<slug>`) indistinguishable from run ids in the selection resolver.

## Proposed change

Reserve the In flight key so no folder can take it (e.g. a slug no intake folder can have, with
`?b=` and ticket-id fallback mapping to it), or have the resolver tell a run from a stub by
`kind` rather than by id prefix.
