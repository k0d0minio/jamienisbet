# Stub: AGENTS.md and the intake README still say ticket commits go straight to main

- lane: chore
- found-by: Define of `ticket-base-branch/dashboard-reads-ticket-base` · 2026-09-23
- priority: P2
- size: S
- sources: `AGENTS.md` → Standing rules ("Ticket-only commits go straight to `main`") ·
  `.icm/intake/README.md` → Standing rules ("The board reads `main`… Ticket-only commits go
  straight to `main`") · `.claude/skills/pr-conventions/SKILL.md` → "The ticket PR" (synced, D38)
  · icm-board `.icm/project.md` D38

## What this is

icm-board D38 retires direct ticket pushes for every repo but icm-board: ticket state goes through
a `type:tickets` ticket PR into the ticket base branch (`pr-conventions` already says so after the
#149 sync). This repo's own `AGENTS.md` and its intake micro-copy still state the old rule, and the
intake README still says the board reads `main`. Neither file is template-owned (`.icm/MANIFEST`
lists neither), so the fix is local.

## Prompt

In jamienisbet, read `.icm/intake/triage/ticket-rule-wording-d38.md`, then
`.claude/skills/pr-conventions/SKILL.md` → "The ticket PR". Rewrite the ticket-commit rule in
`AGENTS.md` (Standing rules) and `.icm/intake/README.md` (Standing rules, and "the board reads
`main`") to D38: ticket-only changes land as a ticket PR into the ticket base branch (`main` here —
no `uat` declared), shape and merge rule in `pr-conventions`; the board reads each repo's ticket
base branch. Point at `pr-conventions` rather than restating it. Ship as `chore` on a `claude/`
branch, `git mv` this stub into `triage/_done/` in the same PR.
