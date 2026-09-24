# Bug: fix-board-runs-slug-collides-with-epic

- observed: `board-model.ts`'s `RUNS_SLUG` ("runs") is the same string an intake epic folder can
  be named, so an epic titled just "Runs" would collide with the In flight pseudo-batch: duplicate
  `batch.slug` keys within one repo's rendered list (`tickets-board.tsx` keys each row on
  `batch.slug`), `?b=<repo>/runs` always resolving to the epic's batch instead of In flight
  (`resolveSelection`'s `.find()` hits the epic first, since the server's own `section.batches`
  are spread before the synthetic runs batch is appended), and a stale run ticket's fallback in
  `resolveSelection` (`batchSlugOf` → `batchOf`) landing on whichever batch happens to hold slug
  "runs" rather than reliably on In flight · expected: the In flight pseudo-batch's identity never
  collides with a real epic's, however the epic is named, and a stale run always falls back to
  In flight specifically, not to an epic that happens to share its name.
- cause: `RUNS_SLUG` (the pseudo-batch's own `slug`, used for both the render key via `batchKey`
  and the `?b=` URL) was the literal, plausible English word "runs" — the exact same namespace a
  human- or `triage batch`-chosen epic title can slugify into — with nothing reserving it.
- fix: `websites/admin-dashboard/components/board-model.ts`: `RUNS_SLUG` is now `_runs` — a value
  icm-board's own slugify (`tr/sed` collapsing every run of non `[a-z0-9]` into one hyphen, then
  trimming the ends) can never produce from an epic title, so the pseudo-batch's slug can no
  longer be taken. The run ticket's own id prefix (`lib/tickets.ts`: `runs/<slug>`) is left alone —
  it can't move without breaking icm-board's `/day` → `today.md` cross-repo picks, which match
  against it literally — so `batchSlugOf` now translates that legacy `runs/` prefix to `RUNS_SLUG`
  before the fallback batch lookup, keeping a stale run's fallback correctly resolving to In flight
  regardless of what any epic happens to be named. A residual — a stale *stub* in an epic actually
  named "runs" could still misresolve to In flight via that same translation — can only be closed
  by refusing that epic slug at the cut, in `validate-intake.sh` (template-owned); parked as
  `.icm/intake/triage/template-change-reserve-runs-epic-slug.md` rather than patched here.
- changelog: not user-visible (an internal board-identity fix; no operator-facing behaviour changes
  except that a *future* epic named "runs" would no longer be able to break the board — nothing in
  production hits that today)
- learned: none
