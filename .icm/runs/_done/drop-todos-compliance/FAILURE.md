# Failures: drop-todos-compliance

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

### 2026-09-25 — the stub asked for a proof this repo cannot run
- what happened: the scope cut gave `drop-todos-compliance` the criterion "runs cleanly on a Neon
  branch", but `.icm/project.json` declares `database.isolation: none` — no per-run branch, and a
  run never migrates a database itself.
- why: Scope wrote the migration criterion without reading `database.isolation`.
- fixed by: Define asked the operator; the criterion became `Validate migrations (no DB writes)`
  green on the PR plus `Apply migrations to production` green after the merge.

### 2026-09-25 — Build's model check failed on its own slug
- what happened: `select-model.sh drop-todos-compliance --stage 03_build` → "no stub under
  .icm/intake/", because `new-run.sh --stub` had already moved the stub to `_done/`.
- why: the template resolver searches live intake only; it does not fall back to the run's spec.
- fixed by: passed the spec path instead; parked `triage/template-change-select-model-run-slug.md`.

## Learned rules

- A migration acceptance criterion must match `database.isolation` in `.icm/project.json`: with
  `none`, the proof is the PR's `Validate migrations (no DB writes)` plus the post-merge
  `Apply migrations to production` — never a Neon branch or a local `db:migrate`.
