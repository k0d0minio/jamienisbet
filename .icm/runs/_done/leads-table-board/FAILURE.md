# Failures: leads-table-board

The run's retrospective — what cost a turn, and the rule that would have prevented it. Two
files share this job and split it cleanly: `error.log` (in the stage's `output/`) is the ledger
of errors a **tool** reported, written verbatim at the moment of the fix with its `- resolved:`
and `- rule:` lines, which `retrospective.sh` reads and counts across runs; **this file** is
what the run as a whole learned — a wrong assumption, a STOP, a skipped step, a gate that
blocked, a plan that had to be rewritten — which no tool ever logged. On close-out the
`## Learned rules` bullets below are copied into `_shared/project-rules.md` → Learned rules
(`run-pack.sh <slug> --sync-rules`, called by `close-out.sh`, the same shape as
`retrospective.sh --apply`), so the next run in this repo starts with them. Keep the rules
general; keep the retrospectives specific; never restate an `error.log` entry here.

## Retrospectives

### 2026-09-25 — the ready push built no preview

- what happened: after the flip, the contract's empty commit (`chore: leads-table-board — ready`, b20a11e) came back with every Vercel project `Skipped - Not affected`; `ci-status.sh` settled GREEN with "no preview URL to test against".
- why: an empty commit changes no file, and this repo's Vercel ignored-build step skips a push that touches nothing it watches. The next push that carried files (the run's closing commit, `.icm/` only) built `Vercel – jamie-nisbet` again and passed.
- fixed by: the closing commit's push, which the contract makes anyway — its head carries the preview the operator smokes (served on the branch alias).

### 2026-09-25 — criteria ticks in the PR body were not written

- what happened: Build step 6 asks for the met criteria to be ticked in the PR body. Re-rendering the body with `project-body.sh` and re-sending it was refused, because the rewrite also re-writes the **Spec approved** gate line.
- why: the only body writer the pipeline ships re-projects the whole body, gates included; a gate line is the operator's alone.
- fixed by: left the PR body as it is; the criteria status is in `03_build/output/notes.md`.

## Learned rules

- In this repo, the post-flip push must change a file (an `.icm/` run file is enough): an empty commit is skipped by Vercel as "Not affected" and leaves the full gate with no preview.
- Never re-render a whole PR body to tick acceptance criteria — that also rewrites the gate boxes; tick criteria only by editing those lines, or leave the ticks to `notes.md`.
