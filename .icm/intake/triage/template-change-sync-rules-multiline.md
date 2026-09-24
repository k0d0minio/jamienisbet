# Stub: run-pack.sh --sync-rules keeps only the first line of a multi-line learned rule

- lane: chore
- found-by: template-change · 2026-09-24
- complexity: low

## Problem

`.icm/scripts/run-pack.sh --sync-rules` (template-owned — `T scripts/run-pack.sh` in
`.icm/MANIFEST`) copies a run's `FAILURE.md` → `## Learned rules` bullets into
`.icm/_shared/project-rules.md`, but it reads them with `grep -E '^- '`, so a bullet wrapped
onto continuation lines arrives cut mid-sentence. `master-detail-shell`'s close-out landed two
such rules in this repo, both ending mid-clause ("never pass `window.history.state` (or any
object carrying Next's", "When one element renders two layouts by breakpoint (a pane from `lg`,
a pushed view below),"). Found by `epic-view` Build, reading the learned rules before its first
edit — the full text had to be recovered from the archived run's `FAILURE.md`.

## Prompt

Template change request — from jamienisbet · 2026-09-24

In the icm-board repo (`~/Apps`), change the template-owned file
`_system/template/icm-pipeline/scripts/run-pack.sh` (in every pipeline repo:
`.icm/scripts/run-pack.sh`, a `T` line of the MANIFEST). Read `_system/contracts/PIPELINE.md` →
File-level ownership first.

What it says today (jamienisbet's copy, `.icm/template-version`: icm-board 7edd036), in the
`sync)` branch:

> mapfile -t rules < <(section_body "$failure" 'Learned rules' | grep -E '^- ' | sed -E 's/^- //' | grep -vE '^<.*>$' | grep -v '^$' || true)

What it should do:
Read each `## Learned rules` bullet whole — the `- ` line plus every following indented
continuation line up to the next bullet, blank line or heading — and join it into one line
(continuation whitespace collapsed to a single space) before the `known` check and the append.
The template placeholder (`<…>`) is still skipped. A fixture case: a FAILURE.md whose rule spans
three lines syncs as one complete line ending with its closing punctuation, and a second
`--sync-rules` run reports it `known` (no duplicate). Check `retrospective.sh --apply`'s `- rule:`
reader for the same fault — its contract allows a second line indented two spaces.

Why:
jamienisbet's `master-detail-shell` close-out (2026-09-24) synced two learned rules truncated
mid-sentence into `.icm/_shared/project-rules.md`, where Build and every lane read them before
their first edit as rules with the standing of the code rules; half a rule reads as a different
rule, or none. Every repo whose runs wrap a rule is affected.

Then: prove it (the fixture, or a read-only run against projects/jamienisbet on Jamie's machine),
ship it through a PR on a `claude/` branch, and after the merge bring it back with
`_system/scripts/icm-sync.sh --apply projects/jamienisbet` — the other pipeline repos as
`/icm-check` lists them. Do not edit `projects/jamienisbet/.icm/scripts/run-pack.sh` in place.
Retire `projects/jamienisbet/.icm/intake/triage/template-change-sync-rules-multiline.md` to
`_done/` in the sync commit. The two truncated lines already in jamienisbet's
`_shared/project-rules.md` (project-owned) are repaired there separately, from
`.icm/runs/_done/master-detail-shell/FAILURE.md`.
