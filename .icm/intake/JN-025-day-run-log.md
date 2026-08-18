# JN-025 · /day leaves a run log

| | |
|---|---|
| Status | ready |
| Type | process |
| Priority | P2 |
| Size | S |

## Problem

`/project` has an append-only run log in each repo's register; `/day` leaves only
`Plan:`/`Wrap:` commit messages, so nothing can tell how long since the board was last
reconciled — the metric that says whether the ritual is alive. The heartbeat (JN-016)
wants to warn "board not reconciled in N days" and has nothing to read.

## Build

One appended line per run — `date · mode (plan|wrap) · picked/banked counts · one-line
note` — in `.icm/docs/day-log.md`, written by `/day` as part of the ticket commit it
already makes. Update `.claude/commands/day.md` §5 (ship) to include it. Once it exists,
point the heartbeat's digest at the last line's age.

## Acceptance

- [ ] Every `/day` run (plan and wrap) appends exactly one line
- [ ] The heartbeat digest reports days since the last run
- [ ] Ticket-only commit path unchanged (straight to main)

## Prompt

Give /day a durable run log. Read .icm/intake/JN-025-day-run-log.md for full context.
Edit .claude/commands/day.md so §5 appends one line per run to .icm/docs/day-log.md
(create it with a two-line header on first run), and update the heartbeat digest
(_system/scripts/heartbeat.sh, from JN-016) to report the age of the last line. This is
command + script markdown/bash only; ticket-and-doc commits go straight to main per the
house rule.
