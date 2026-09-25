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
- why: this repo's Vercel ignored-build step diffs the push against the project's last deployment, and the previous push (the build notes, on top of the code commit) had already deployed the admin — so an empty commit changes nothing it watches. The admin preview of the finished code is the draft-era deployment of that previous head, served on the branch alias.
- fixed by: nothing to fix in code — the operator smokes the branch alias (jamie-nisbet-git-claude-charming-archimedes-2b59uc-kodominio.vercel.app), which serves that head.

### 2026-09-25 — criteria ticks in the PR body were not written

- what happened: Build step 6 asks for the met criteria to be ticked in the PR body. Re-rendering the body with `project-body.sh` and re-sending it was refused, because the rewrite also re-writes the **Spec approved** gate line.
- why: the only body writer the pipeline ships re-projects the whole body, gates included; a gate line is the operator's alone.
- fixed by: left the PR body as it is; the criteria status is in `03_build/output/notes.md`.

## Learned rules

- In this repo, don't count on the post-flip empty commit for a preview: Vercel skips it as "Not affected" when the previous push already deployed; point the operator at the branch alias of the last code push and say so.
- Never re-render a whole PR body to tick acceptance criteria — that also rewrites the gate boxes; tick criteria only by editing those lines, or leave the ticks to `notes.md`.
