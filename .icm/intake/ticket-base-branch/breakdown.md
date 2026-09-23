# Ticket base branch — breakdown

- epic: ticket-base-branch
- cut: 2026-09-23, from icm-board's `ticket-base-branch` epic (decision D38 there) — the
  dashboard's half; the template, board scripts and rollout are icm-board's stubs
- scope: `websites/admin-dashboard` (the Tickets board)

## What was understood

On a client repo that declares a UAT branch (`.icm/project.json` → `uat.branch`), a run's
close-out moves its stub to `_done/` inside a PR that merges into `uat`; `main` sees the move only
at promotion. The board reads each repo's default branch (`git/trees/HEAD`), so a finished stub
shows as open for the whole batch. Under D38 every client repo's ticket state lives on its
**ticket base branch** — `uat.branch` when declared, else `main` — and is written only through a
`type:tickets` PR. The board must read that branch, and the prompts it hands to sessions must stop
saying "commit straight to main".

## Build order

1. dashboard-reads-ticket-base — the board reads each repo's ticket base branch; the maintenance prompts follow D38 — depends-on: none
