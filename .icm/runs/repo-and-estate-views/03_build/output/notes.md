# Build notes: repo-and-estate-views

- commits: feat: repo-and-estate-views — repo view and estate overview
- ci: GREEN on 3f35dfa (cheap tier); full gate pending

## What changed

- `components/board-model.ts`: the repo selection now carries a `RepoFocus` (repo, section or
  null, error, maintenance), so `?r=<slug>` resolves for a repo in `board.errors` that has no
  section (D-1). `ticketsInGroup` is the one source for the Today/Blocked figures and the
  overview's Blocked rows (D-3); `repoFigures` narrows it to one repo and adds In flight;
  `blockedReason` reads the ticket's `Blocked` meta, else `Waiting on`.
- `app/(app)/tickets/page.tsx`: `extraMaintenance` also covers errored repos without a section,
  so their view carries triage/sweep (D-2). `lib/tickets.ts` untouched.
- `components/board-views.tsx`: `RepoView` renders figures → "Couldn't be read" → client →
  maintenance; `EstateOverview` gains the Blocked group and makes each repo error row open that
  repo's view (the roster row stays static).
- `components/tickets-board.tsx`: wiring — overview callbacks, repo pane from the focus.
- `websites/admin-dashboard/README.md`: Tickets section describes the new contents.

## Acceptance criteria status

- [x] Repo view order: figures, client, maintenance + GitHub — `RepoView`.
- [x] Repo figures match the section: Open = `section.open`, In flight = runs batch size,
      Today/Blocked = the strip's tickets for that repo (the same set the estate counts).
- [x] Maintenance launchers unchanged — same `RepoMaintenance`, same launchers.
- [x] Errored repo reachable from its error row, view with error, client, launchers, GitHub,
      no figures — `resolveSelection` + `page.tsx`.
- [x] Cold `?r=<errored repo>` resolves from URL like every selection; no section/chip added;
      roster row not interactive.
- [x] Section + error → the error shows (focus.error looked up for every repo).
- [x] Overview order: figures, Blocked, Couldn't be read, Estate check + footnote.
- [x] Blocked group = the Blocked figure's set (`ticketsInGroup`), title, repo slug, reason.
- [x] Blocked row tap → `navigate({ t })`, the same path a list tap takes.
- [x] List unchanged; empty/error states untouched.
- [x] `lib/tickets.ts` unchanged; no `force-dynamic`; refresh untouched.
- [x] README updated.
- [ ] Preview checked on phone and desktop, light and dark, with a read error — the operator's
      smoke.
- [ ] CI green — pending.

## Notes for Release

- The repo view's Today/Blocked count from `board.strip` (the estate figures' source), not
  from the section's batches, so the repo and the estate can't disagree; a run picked for today
  counts toward Today.
- Whether the preview has a repo with a read error depends on the roster at smoke time; a repo
  connected in `biz` that the token can't read produces one.
