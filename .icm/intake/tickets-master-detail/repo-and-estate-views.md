# Stub: Repo view and estate overview

- feature-slug: repo-and-estate-views
- sequence: 5 of 6
- depends-on: master-detail-shell
- priority: P2
- size: S

## What this is

Homes for what the old board kept at section feet and in the masthead.

- **Repo view** — opened by tapping a repo section header in list level 0 (URL state
  like any selection). Shows: the repo slug (mono) and its client link (or "house"); the
  repo's figures (open, today, blocked, runs in flight); the maintenance launchers now
  in `RepoMaintenance` (`repoMaintenanceLaunchers`), as `CopyLaunchRow`s; Open on GitHub;
  and the repo's read error in full, if its read failed.
- **Estate overview** — the pane when nothing is selected on desktop; the foot of list
  level 0 on a phone. Shows: the Today / Blocked / Open figures (`GlanceRow`, for the
  current repo filter — a zero figure is omitted, as today); the blocked tickets as rows
  that select into the ticket view; the "Couldn't be read" group (roster error first,
  then each repo with what GitHub said); the Estate check launcher; the board footnote
  (read-only, launchers hand you a prompt).
- The masthead figures and the per-section `RepoMaintenance` row leave the list.
- The not-configured, database-down, no-repos and empty states keep their current copy
  and move into the pane / single column as appropriate.

## Prompt

Read `.icm/intake/tickets-master-detail/breakdown.md`, then this stub
(`.icm/intake/tickets-master-detail/repo-and-estate-views.md`). `master-detail-shell`
must be merged. Then read `websites/admin-dashboard/app/(app)/tickets/page.tsx` (the
current masthead, error group, `BoardGroup`, empty states),
`components/repo-maintenance.tsx`, and the `design-dna` skill.

Build the repo view (opened from a repo header) and the estate overview (empty pane on
desktop, list foot on a phone) with the contents the stub lists; move the masthead
figures, maintenance rows, error group and Estate check into them. Launcher shapes
unchanged.

Work on a `claude/` branch, open a PR, let CI verify (never build locally), check the
Vercel preview on phone and desktop, including a board with a repo read error. In the
same PR, `git mv` this stub to `.icm/intake/tickets-master-detail/_done/`.
