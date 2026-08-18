# JN-016 · Estate heartbeat — daily timer, digest, session-start delta

| | |
|---|---|
| Status | ready |
| Type | automation |
| Priority | P1 |
| Size | M |

## Problem

Zero scheduled automation exists estate-wide (audit open decision #8; formerly JN-011).
The estate scripts (`_system/scripts/`: pull-all, ticket-hygiene, icm-check,
tickets-board) walk the gitignored `projects/` on disk, so any routine over them must run
on this machine — cloud sessions see half the estate. Meanwhile the one automatic surface,
the SessionStart hook, prints only the Today group: a morning with 0 today, 3 blocked and
17 hygiene findings reports "nothing to do".

## Build

1. `_system/scripts/heartbeat.sh` — runs pull-all → ticket-hygiene → icm-check →
   tickets-board --today and writes a digest **outside the repo** (recommend
   `~/.claude/estate/heartbeat-latest.md`; precedent: pull-all already logs to
   `~/.claude/pull-all.log`). Keeps the tree clean; read-only on every repo
   (pull --ff-only excepted); proposes, never fixes.
2. A **systemd user timer** (survives reboots, unlike a bare crontab line) invoking it
   daily. Unit files are machine-level, not in git — document them in ROUTINES.md.
3. Upgrade `_system/hooks/session-start.sh` to print the digest delta: today group,
   hygiene finding count, conformance gaps, and the digest's age.
4. Create `_system/contracts/ROUTINES.md` — the registry of every scheduled thing (what
   runs, where — this machine vs Vercel cron — cadence, and what it may write: tasks and
   digest files only; never tickets, never client email). Register the heartbeat as its
   first row. This keeps "the folders are the orchestration" true once routines exist.

## Acceptance

- [ ] A daily digest reaches the next session without Jamie initiating anything
- [ ] Read-only: no repo is modified; fixes stay judgment work in /day
- [ ] Survives reboots (systemd user timer, not a long-running process)
- [ ] `_system/contracts/ROUTINES.md` exists and registers the heartbeat

## Prompt

Build the estate heartbeat for the Apps estate. Read
.icm/intake/JN-016-estate-heartbeat.md for full context. It must run on this machine —
client repos in projects/ are gitignored and local-only. Add _system/scripts/heartbeat.sh
(digest written outside the repo, recommend ~/.claude/estate/), a daily systemd user
timer invoking it, upgrade _system/hooks/session-start.sh to print the digest delta, and
create _system/contracts/ROUTINES.md registering the routine. Keep everything read-only —
report, never fix. Never build an orchestrator: the timer calls the scripts exactly as a
human would. Repo files go through a PR on a claude/ branch; do not run local checks — CI
is the source of truth. The systemd units are machine-level: show Jamie the unit files
and the enable commands rather than enabling them silently.
