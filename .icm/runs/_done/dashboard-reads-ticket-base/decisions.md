# Decisions: dashboard-reads-ticket-base

The `D-n` ids this run rests on, mirrored from the scope's Decisions table
(`_shared/scope-template.md` → `D-n` ids are permanent), plus any the run itself had to make.
`validate-decisions.sh <slug>` traces the scope's ids into `spec.md` and `notes.md`; this file
is the run's own ledger, so a session need not open the scope to know what was settled and a
decision made mid-run has one home.

## From the scope

- none — no scope; the rule is icm-board D38 (ticket base branch, ticket PR, icm-board exempt)

## Made in this run

- D-1 (Define, operator) — a declared UAT branch that can't be read falls back to the default
  branch and is named on the board, never silently.
- D-2 (Define, operator) — the maintenance prompts point at `pr-conventions` → "The ticket PR"
  rather than spelling the shape out.
- D-3 (Build) — a non-UAT repo's prompt names `main` as its ticket base branch (D38: "else
  `main`"); a fallback repo's prompt names `main` too, since the declared branch isn't there to
  PR into. The home feed does not list a fallback repo as unread — its tickets are shown.
