---
description: Plan the day (or reshuffle the week) — ends as ticket edits pushed to main, nothing else
allowed-tools: Bash(_system/tickets-board.sh:*), Bash(/home/jamie-nisbet/Apps/_system/tickets-board.sh:*), Bash(_system/ticket-hygiene.sh:*), Bash(/home/jamie-nisbet/Apps/_system/ticket-hygiene.sh:*), Read, Glob, Grep, Edit, Write, Agent, AskUserQuestion
---

# /plan — tickets ARE the plan

Work from the Apps root. Sustentus-v2 is exempt (its `pipeline/` plans itself). The
process behind this ritual: `_system/PROCESS.md` §4. **This command never touches code
files — only `.icm/intake/` ticket files.**

## 1. Survey

Run `_system/tickets-board.sh` and show the board. Run `_system/ticket-hygiene.sh`; if
it reports drift that would corrupt the plan (merged-but-open tickets, stale `today`
flags), surface it — offer to fold quick fixes into this session or defer to `/groom`.

## 2. Interrogate

Ask Jamie what tomorrow (or this week) is for. Ground the conversation in candidates
from the board, in this order: P0s · in-progress that stalled · blocked that may have
unblocked · P1s longest waiting · active repos with no tickets (from hygiene). For a
week-level reshuffle, walk the Priority rows instead: what is genuinely P0/P1 now, what
demotes to P2, what dies.

## 3. Edit tickets

- **Day plan:** clear every leftover `today` flag first (back to `ready` unless Jamie
  says otherwise), then flip tomorrow's picks to `today` — **at most 3 across the whole
  estate**. If Jamie wants more, push back once (a diluted flag is no flag), then obey.
- **Week plan:** adjust `Priority` rows; cut new tickets per `_system/TICKETS-SPEC.md`
  (next `NNN` = highest existing number in `intake/` **and** `_done/` + 1 — numbers are
  never reused); dead tickets are deleted or moved to `_done/` with a one-line
  `> Dropped:` note prepended, per Jamie's call.
- New tickets need a standalone `## Prompt` — pasteable into a fresh session at the
  repo root, telling it to read the ticket file.

## 4. Ship the plan

The board reads each repo's `main` — pushing IS publishing the plan.

- Show Jamie a per-repo summary of the ticket diff first.
- Then, per changed repo: commit **only** `.icm/intake/` paths on `main` (message
  `Plan: <one line>`) and push. If anything else is dirty in a repo, leave it strictly
  alone — stage the intake paths explicitly, never `git add -A`.
- If a push is rejected (diverged main), pull --rebase and retry once; otherwise report
  and move on. Never force-push.

End by printing the Today list — that's tomorrow's worklist on the phone.
