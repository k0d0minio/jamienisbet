# Failures: work-reader

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

### 2026-09-25 — the spec's "gates-read reuses this read" was overtaken while Build ran

- what happened: the spec (Out of scope) said gates-read would reuse this run's pull-request
  read; gates-read merged to main mid-Build with its own GraphQL read, so the two screens now
  read PRs separately.
- why: two stubs in the same epic ran in parallel, and Define wrote a claim about the other
  stub's future design without it being settled anywhere.
- fixed by: decisions.md → Build; triage stub `work-and-gates-one-pr-read.md`.

### 2026-09-25 — Define was asked for the last stub of a batch whose dependencies had not started

- what happened: `new admin-cockpit-redesign/retire-app-tier` named 11 of 11 while work-phone
  and gates-read were unstarted stubs.
- why: `new <stub-name>` does not run the dependency check that bare `new` does.
- fixed by: the dependency check was run by hand and the operator switched to work-reader.

## Learned rules

- A spec never promises how another, unbuilt stub will use this run's work; name the overlap as
  out of scope and let whichever run lands second reconcile it.
- For `new <stub-name>`, run the same `depends-on` merged check bare `new` runs before opening a
  run, and say which dependencies are unmet.
