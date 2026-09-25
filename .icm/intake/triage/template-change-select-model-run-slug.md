# Stub: select-model.sh cannot resolve a run slug once Define has consumed its stub

- lane: chore
- found-by: template-change · 2026-09-25
- complexity: low

## Problem

`.icm/scripts/select-model.sh <slug> --stage 03_build` (as `stages/03_build/CONTEXT.md` step 1
tells Build to call it) exits `error: no stub '<slug>' under .icm/intake/` for every spine run:
`new-run.sh --stub` has already moved the stub to `_done/`, and the resolver searches live intake
only. Seen in run `drop-todos-compliance` (PR k0d0minio/jamienisbet#168); worked around by passing
the spec path.

## Proposed change

Template-owned (`.icm/MANIFEST`: `T scripts/select-model.sh`) — made in icm-board, back by sync.
No lane here consumes this stub; hand its prompt to an icm-board session.

## Prompt

Template change request — from jamienisbet · 2026-09-25

In the icm-board repo (`~/Apps`), change the template-owned file
`_system/template/icm-pipeline/scripts/select-model.sh` (in every pipeline repo:
`.icm/scripts/select-model.sh`, a `T` line of the MANIFEST). Read
`_system/contracts/PIPELINE.md` → File-level ownership first.

What it says today (jamienisbet's copy, `.icm/template-version`: icm-board e7a99bb):
> # A bare stub name: look through the live intake folders (epics and triage), never the archives —
> # a consumed stub is not work anybody is about to open a session for.
> mapfile -t hits < <(find .icm/intake -name "${arg%.md}.md" -not -path '*/_done/*' 2>/dev/null | sort)
> ...
> 0) die "no stub '$arg' under .icm/intake/ (give <epic>/<feature-slug>, a stub name, or a path)" ;;

What it should say or do:
When a bare name matches no live stub, resolve it as a run slug before failing: if
`.icm/runs/<arg>/02_define/output/spec.md` exists, read that spec's `complexity:` line (the spec
vocabulary the script already normalises). Only when neither a live stub nor a live run's spec
exists, die with the current message, naming both places it looked. Add a fixture case: a run
whose stub sits in `<epic>/_done/` and whose spec says `complexity: complex` →
`select-model.sh <slug> --stage 03_build` prints `RESULT: MODEL opus`.

Why:
`stages/03_build/CONTEXT.md` step 1 and `stages/02_define/CONTEXT.md` step 1 call
`select-model.sh <slug> …`, but by Build the stub has been moved to `_done/` by
`new-run.sh --stub`, so every Build's model check errors out. Found in run
`drop-todos-compliance` (jamienisbet PR #168, Build stage, 2026-09-25); worked around by passing
`.icm/runs/<slug>/02_define/output/spec.md`. The fix makes the documented call work for every
spine run in every repo.
