---
description: The estate ticket ritual — reconcile the board, pick today's ≤3, or close out a session. Ends as ticket commits pushed to main.
allowed-tools: Bash(_system/scripts/tickets-board.sh:*), Bash(/home/jamie-nisbet/Apps/_system/scripts/tickets-board.sh:*), Bash(_system/scripts/ticket-hygiene.sh:*), Bash(/home/jamie-nisbet/Apps/_system/scripts/ticket-hygiene.sh:*), Bash(git -C:*), Read, Glob, Grep, Edit, Write, Agent, AskUserQuestion
---

# /day [wrap] — keep the board honest, then decide what's next

Work from the Apps root. Sustentus is exempt (its `.icm/` plans itself).

**Two modes, one ritual.** Bare `/day` plans — reconcile, then flip tomorrow's picks.
`/day wrap` closes out — reconcile, then bank what happened and cut what's left. Both
share §1, §2 and §5, so running either after the other is harmless.

**This command touches only `.icm/intake/` ticket files.** Deciding *what a project is
for* is `/project`'s job; this one only moves tickets that already exist and cuts the
leftovers of work that already happened.

## 1. Survey

Run `_system/scripts/tickets-board.sh` and show the board. Run
`_system/scripts/ticket-hygiene.sh` and show what it found. The scripts report; **you
verify and fix with judgment** — never bulk-apply their findings.

## 2. Reconcile — the board must be true before it's useful

Planning around a board that lies wastes the whole ritual, so this comes first in both
modes.

- **Merged but still open.** For each open ticket whose ID appears in merged commits,
  check `git -C <repo> log` for the actual work commit — *the commit that created the
  ticket file doesn't count*, nor does an estate-sweep commit. Where the work genuinely
  merged, `git mv` it to `_done/`. Where it's ambiguous, batch the questions and ask.
- **`today` dilution.** More than 3 flagged estate-wide means none of them are flagged.
  List them, ask which ≤3 survive; the rest go back to `ready`. Stale flags from a past
  day default to `ready` without asking.
- **Prefix drift.** A repo whose intake README uses a prefix missing from
  `_system/contracts/TICKETS.md` gets reconciled — the spec follows reality once tickets
  exist; before the first ticket, reality follows Jamie.
- **Active repo, empty intake.** Real work happening off-ticket. Distinguish client work
  from sweep and config commits by reading the log; where real work is untracked, offer to
  cut tickets from recent history. `ticket-scout` proposes candidates per repo — batch
  them, never create unasked.

## 3. Plan — bare `/day`

Ask what tomorrow (or this week) is for, grounded in board candidates in this order: P0s ·
in-progress that stalled · blocked that may have unblocked · P1s longest waiting · active
repos with nothing ticketed.

- **Day:** clear every leftover `today` flag first (back to `ready` unless Jamie says
  otherwise), then flip tomorrow's picks — **at most 3 across the whole estate.** If Jamie
  wants more, push back once (a diluted flag is no flag), then obey.
- **Week:** walk the `Priority` rows instead — what is genuinely P0/P1 now, what demotes,
  what dies. Dead tickets go to `_done/` with a `> Dropped: <reason, date>` line, or are
  deleted, per Jamie's call.

If a repo's priorities look wrong at the *project* level — the tickets no longer match what
the thing is for — that's `/project <repo>`, not this command. Say so and move on.

## 4. Close out — `/day wrap`

- **Bank what finished.** Tickets whose work merged this session `git mv` to `_done/`.
- **Cut what's left.** Anything discovered, started, half-done or promised becomes a ticket
  per `_system/contracts/TICKETS.md` — with a standalone `## Prompt`. **Never a loose
  `TODO.md`.** Cutting tickets is part of stopping.
- **Clear the flags.** `today` tickets that didn't get done go back to `ready`; a flag that
  survives the night it was set for is noise.
- **Note the drift.** If the session did work no ticket described, say so plainly in the
  summary — that's how off-ticket work gets caught next time.

## 5. Ship — pushing is publishing

The board reads each repo's `main`, so an unpushed ticket does not exist.

- Show Jamie a per-repo summary of the ticket diff first.
- Per changed repo: commit **only** `.icm/` paths on `main` (message `Plan: <one line>` or
  `Wrap: <one line>`) and push. If anything else is dirty, leave it strictly alone — stage
  the paths explicitly, **never `git add -A`**.
- A rejected push (diverged main) gets one `pull --rebase` and retry; otherwise report and
  move on. Never force-push.

End by printing the Today list — that's the worklist on the phone.
