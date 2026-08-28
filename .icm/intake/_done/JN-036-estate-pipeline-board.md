# JN-036 · Tickets board speaks the estate pipeline — epics, stubs, runs, sustentus

| | |
|---|---|
| Status | in-progress |
| Type | feature |
| Priority | P0 |
| Size | M |
| Sources | icm-board PR #12 (the 2026-08-28 pipeline rework, decisions D10–D13) · _system/contracts/TICKETS.md (rewritten) |

## Problem

The estate ticket standard changed (icm-board PR #12): tickets are now stubs grouped in
epic folders (`intake/<epic>/<slug>.md` + `breakdown.md` + `_done/`) or a `triage/`
lane, with path identity, positional status (no Status rows), a `- priority:` dash-line,
in-flight state as `.icm/runs/<slug>/`, and the today flag in icm-board's
`.icm/today.md`. The board's reader lists `.icm/intake/` one level deep and parses the
old flat shape only — under the new layout it would silently show an empty board. It
also excludes sustentus by name, whose stubs are now natively parseable, and its roster
misses every repo not connected to a client row.

## Acceptance

- [ ] Dual-shape parser: legacy flat `PREFIX-NNN` tickets and new epic/triage stubs
      render side by side (migration is per-repo and gradual)
- [ ] One git-tree call per repo replaces the directory listing; `_done/` never fetched
- [ ] Groups become positional: Today (from icm-board `.icm/today.md`) · In flight
      (`.icm/runs/`, legacy in-progress) · Blocked (`- blocked:` line, legacy blocked,
      unmet depends-on shown as waiting) · Next (each epic's lowest open sequence,
      triage, legacy ready) · Queued
- [ ] Sustentus appears on the board (roster + parser); its runs/ history is not
      misread as in-flight
- [ ] Roster covers owner repos beyond client rows (union with listAccessibleRepos);
      chips only show repos with tickets
- [ ] Stubs without a `## Prompt` get a synthesized pick-up prompt from their path
- [ ] CI green

## Prompt

Rework the admin dashboard's tickets board to read the 2026-08-28 estate pipeline
shape. Read .icm/intake/JN-036-estate-pipeline-board.md for full context, then
websites/admin-dashboard/lib/tickets.ts (the whole data layer) and
app/(app)/tickets/page.tsx. The canonical spec is _system/contracts/TICKETS.md in the
icm-board repo (PR #12). Keep the board strictly read-only. Open a PR on a claude/
branch; do not run local checks — CI is the source of truth.
