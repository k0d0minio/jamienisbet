# Stub: `validate-intake.sh` should reject an epic slug the board already reserves

- lane: chore
- found-by: template-change · 2026-09-24
- superseded-by: icm-board #85 (e7a99bb)
- complexity: low

## Problem

`fix-board-runs-slug-collides-with-epic` (bug lane, 2026-09-24) fixed the admin dashboard's own
half of this: `websites/admin-dashboard/components/board-model.ts` gave the In flight pseudo-batch
a slug (`_runs`) no slugified epic title can ever produce, so a new epic can no longer collide with
it at the UI layer. But nothing stops the collision at its actual source — `triage batch` (and a
hand-cut epic) can still name an epic `runs`, `triage`, or `backlog`: `websites/admin-dashboard/
lib/tickets.ts`'s `batchKind(slug)` special-cases exactly those three strings to a pseudo-batch
`kind` ("triage"/"backlog") instead of `"epic"`, and `.icm/intake/triage/` already occupies the
`triage` path outright. `.icm/scripts/validate-intake.sh` checks a batch's internal bookkeeping
(sequence, depends-on, build order) but never the epic-scope slug itself, so nothing here would
catch it before the cut ships.

## Prompt

Template change request — from jamienisbet · 2026-09-24

In the icm-board repo (`~/Apps`), change the template-owned file
`_system/template/icm-pipeline/scripts/validate-intake.sh` (in every pipeline repo:
`.icm/scripts/validate-intake.sh`, a `T` line of the MANIFEST). Read
`_system/contracts/PIPELINE.md` → File-level ownership first.

What it says today (jamienisbet's copy, `.icm/template-version`: icm-board 7edd036) — the script
resolves `<scope-slug>` to `.icm/intake/<scope-slug>/` and then validates only the stubs inside it
(sequence contiguity, `depends-on`, `## Build order`); it never inspects the scope slug itself:

> ```
> #   1. every stub carries '- sequence: n of m', unique and contiguous over 1..m;
> #   2. m agrees with how many stubs there actually are;
> #   3. every 'depends-on:' names a stub in the same batch, sequenced BEFORE its dependent;
> #   4. '## Build order' in breakdown.md lists the same slugs, in the same order, as the sequences.
> ```

What it should say or do:

Add a fifth invariant: the epic-scope slug (the `<scope-slug>` argument / the intake folder's own
name, not a stub's `feature-slug`) must not be one of the identifiers a repo's board already treats
as a pseudo-batch — `runs`, `triage`, `backlog` (`websites/admin-dashboard/lib/tickets.ts`'s
`batchKind()`, and the equivalent in any other repo's dashboard/reporting surface that reads
`.icm/intake/`). `RESULT: INVALID` with a message naming the reserved word and pointing at
`triage batch`/`scope`'s own slugify step, so the cut fails fast instead of shipping an epic no
board can render without a workaround. Prove it with a fixture: a scope dir named `runs` (or
`triage`/`backlog`) with one valid stub inside → `RESULT: INVALID`; the existing fixtures →
unchanged `RESULT: OK`.

Why: `websites/admin-dashboard/components/board-model.ts`'s In flight pseudo-batch used to share
its slug (`runs`) with any real epic of that name — duplicate React keys in the repo section,
`?b=<repo>/runs` always resolving to the epic instead of In flight, and a stale run's fallback in
`resolveSelection` misresolving to the epic. The admin-dashboard fix (`fix-board-runs-slug-
collides-with-epic`, PR to follow) reserves a slug the pseudo-batch alone can hold, which closes
the UI-visible bugs, but a stale *stub*'s fallback in an epic actually named `runs` can still
misresolve to In flight instead of its own epic (`board-model.ts`'s `batchSlugOf`, `RUN_TICKET_
PREFIX` translation) — a residual only `validate-intake.sh` refusing the slug at cut time fully
closes. `triage`/`backlog` share the same root cause in `batchKind()` and are worth the same
treatment while this is being written, even though no run has hit them yet.

Then: prove it (the fixture, or a read-only run against projects/jamienisbet on Jamie's machine),
ship it through a PR on a `claude/` branch, and after the merge bring it back with
`_system/scripts/icm-sync.sh --apply projects/jamienisbet` — the other pipeline repos as
`/icm-check` lists them. Do not edit `projects/jamienisbet/.icm/scripts/validate-intake.sh` in
place. Retire `projects/jamienisbet/.icm/intake/triage/template-change-reserve-runs-epic-slug.md`
to `_done/` in the sync commit.
