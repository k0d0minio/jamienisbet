> Dropped: superseded by JN-016 — acceptance referenced the retired /groom command and _system/PROCESS.md, so it could not be closed as written. 2026-08-18

# JN-011 · Weekly automated /groom run (first scheduled routine)

| | |
|---|---|
| Status | ready |
| Type | automation |
| Priority | P1 |
| Size | S |

## Problem

Estate audit open decision #9: scheduled routines were wanted in July and none exist.
The first natural candidate now exists — `/groom` keeps the tickets board honest
(merged-but-open tickets, `today` dilution, off-ticket work), but it only runs when
Jamie remembers to run it. Drift is exactly the kind of rot a weekly cadence prevents.

Constraint: the client repos in `projects/` exist only on this machine (gitignored
here, each its own git repo), so the routine must run locally —
`_system/ticket-hygiene.sh` finds nothing in a cloud checkout of this repo.

## Acceptance

- [ ] Once a week, a hygiene result reaches Jamie without him initiating it
- [ ] Read-only by default — the routine reports; fixes stay judgment work in `/groom`
- [ ] Survives reboots (cron/systemd timer, not a long-running process)
- [ ] Mechanism + schedule documented in `_system/PROCESS.md` (Hygiene section)

## Prompt

Implement a weekly automated hygiene run for the Apps estate. Read
.icm/intake/JN-011-weekly-groom-routine.md for full context. Decide the mechanism
with Jamie before building — candidates: (a) a user cron/systemd timer running
`_system/ticket-hygiene.sh` and delivering the report (notification, email, or a
dated file in .icm/docs/), or (b) a scheduled headless Claude Code run of /groom in
report-only mode. Must run on this machine (cloud sessions can't see the estate).
Keep it read-only; never auto-fix tickets. Update _system/PROCESS.md's Hygiene
section with whatever ships.
