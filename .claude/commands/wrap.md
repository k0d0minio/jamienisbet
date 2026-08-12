---
description: End a working session cleanly — finished tickets to _done/, leftovers cut as tickets, today flags cleared
allowed-tools: Bash(_system/tickets-board.sh:*), Bash(/home/jamie-nisbet/Apps/_system/tickets-board.sh:*), Bash(git -C:*), Read, Glob, Grep, Edit, Write, AskUserQuestion
---

# /wrap — cutting tickets is part of stopping

Work from the Apps root. Ask which repo(s) the session touched if it isn't obvious from
the conversation or from `git status` across the estate. Sustentus-v2 is exempt (its
pipeline closes its own runs). **Touch only `.icm/intake/` files.**

## 1. Close what finished

For each ticket whose work shipped this session (merged PR, or Jamie says it's done):
`git mv` the file to `.icm/intake/_done/`. If the work is merged but the branch/PR is
still open, flip `Status` to `in-progress` instead and say why.

## 2. Cut what's left

Everything discussed, discovered, or half-done that isn't finished becomes a ticket —
per `_system/TICKETS-SPEC.md`, next number in sequence, standalone `## Prompt`. This is
the rule that keeps loose `TODO.md`s from ever coming back. Small is fine; vague is not.

## 3. Clear the flags

Any `today` flag on a ticket that didn't finish goes back to `ready` unless Jamie wants
it carried into tomorrow (that's a `/plan` decision, offer to defer it).

## 4. Hand back

Show a per-repo summary of ticket changes. Commit and push **ticket-only** changes on
`main` (`Wrap: <one line>`) when Jamie confirms — stage `.icm/intake/` paths explicitly,
never `git add -A`. If he declines, leave them uncommitted and say where they sit.
