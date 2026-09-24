# Spec: Repo view and estate overview

- slug: repo-and-estate-views
- personas: operator
- touches: websites/admin-dashboard/app/(app)/tickets, websites/admin-dashboard/components, websites/admin-dashboard/README.md
- complexity: standard

## Problem

The master–detail shell (`master-detail-shell`, #158) moved the Tickets board's masthead
figures, read errors, Estate check and per-repo maintenance rows into the pane *as they were*,
so nothing was lost — but the two views that hold them are placeholders. The repo view names
its client and lists the launchers, and says nothing about the repo's own state: how much is
open, what is picked for today, what is stuck, what is running. The estate overview counts the
blocked tickets without letting you reach one. And a repo whose GitHub read failed has no
section in the list, so its view can't be opened at all; its error sits in the overview with
nowhere to go. This is stub 5 of the `tickets-master-detail` epic (breakdown decision 3): it
turns both placeholders into the real views, serving the operator's goal of an estate glance
that is one tap from anything that needs attention.

## Proposed change

Presentation only. `lib/tickets.ts` (reads, cache clocks, link and launcher building) and the
`readBoard()` payload are untouched; everything below is derived on the client from the data the
board already holds, plus maintenance launchers built in `page.tsx` for the repos that need them.

- **Repo view** (`?r=<repo>`, opened from a repo section header as today, and — new — from a
  "Couldn't be read" row in the estate overview). The pane's title stays the repo slug in mono,
  its subtitle the client name or "House repo". Body, in order:
  1. **Figures** — a `GlanceRow` of the repo's **Open** (the section's `open`), **Today** and
     **Blocked** (its tickets in those groups, runs included, as the estate figures count them)
     and **In flight** (its runs). A zero figure is omitted, as in the estate overview; all zero
     → no row.
  2. **The read error, in full**, when this repo appears in `board.errors` — a destructive group
     "Couldn't be read" with what GitHub said as a `GroupedBlock`, never truncated.
  3. **Client** — the client link (`/leads/<id>`) or the "House repo" row, as today.
  4. **Maintenance** — the repo's `repoMaintenanceLaunchers` as `CopyLaunchRow`s, then
     **Open the repo on GitHub**, as `RepoMaintenance` renders them today; launcher shapes and
     prompts unchanged.
- **Errored repos get a view.** A repo named in `board.errors` resolves under `?r=` even though
  it has no section: it shows the view above with its figures omitted (it has no tickets), the
  error in full, its client link and its maintenance launchers — built server-side in
  `page.tsx` next to today's `extraMaintenance` for run-only repos, since the client can't reach
  `lib/tickets`. It still gets no section, row or chip in list level 0 (operator, Define
  2026-09-24). A repo on neither the list nor the error list still falls back to no selection,
  as today.
- **Estate overview** (desktop pane with nothing selected; foot of list level 0 on a phone — as
  placed today). Body, in order:
  1. **Figures** — Today / Blocked / Open in a `GlanceRow`, for the current repo filter, zeros
     omitted — as today.
  2. **Blocked** — a group listing every blocked ticket in view (the Blocked figure's own set:
     group `blocked`, same repo filter), in board order. Each row: the ticket title, the repo slug
     in mono and the reason it is blocked — its `Blocked` meta value, else `Waiting on <slug>` —
     as the description, and the status dot. Tapping a row selects the ticket (`?t=`), opening
     its ticket view with the list at its batch, exactly as selecting it from the list does. No
     group when nothing is blocked. The rows carry no swipe (they are the pane's, not the list's).
  3. **Couldn't be read** — the roster error first (not tappable: it names no repo), then one
     row per repo with what GitHub said in full below it, as today; each repo row is now
     tappable and opens that repo's view. The error text stays on the overview too, so a glance
     still shows it without a tap.
  4. **Estate check** launcher and the board footnote — as today.
- **The list stays as the shell left it**: no masthead figures, no per-section maintenance row,
  no error group in the list. The not-configured (`page.tsx`), database-unavailable and
  no-repos states keep their copy and full-width single-column placement; "Nothing open" and
  "Nothing in this repo" stay in the list column (the overview still stands in the pane beside
  them on desktop and at the foot on a phone).
- **README** — the admin-dashboard README's Tickets section describes the repo view's figures
  and error, the overview's Blocked group and the tappable error rows.

## Acceptance criteria

- [ ] Opening a repo from its section header shows, in order: the figures row (Open, Today,
      Blocked, In flight — zeros omitted, no row when all are zero), the client link or "House
      repo", the maintenance launchers and Open the repo on GitHub.
- [ ] The repo view's figures match the repo's list section: Open equals the tickets across its
      epic, Triage and Backlog rows (runs excluded), In flight equals its In flight row's runs, Today and Blocked equal its tickets in
      those groups.
- [ ] Each maintenance launcher in the repo view copies, and opens in its menu, exactly the
      prompt and links today's repo placeholder does.
- [ ] With a repo read error present, its row under "Couldn't be read" in the estate overview
      opens `?r=<that repo>`, whose view shows the error in full, the client link or "House
      repo", the triage and sweep launchers and Open the repo on GitHub, and no figures row.
- [ ] A cold load of `?r=<errored repo>` restores that view on phone and desktop; the errored
      repo has no section, row or chip in list level 0; the roster error row is not tappable.
- [ ] A repo that has a section and also appears in `board.errors` shows its error in full in its
      repo view.
- [ ] The estate overview shows, in order: the Today / Blocked / Open figures (filter-aware, zeros
      omitted), a Blocked group, "Couldn't be read", then Estate check with the board footnote.
- [ ] The Blocked group lists exactly the tickets the Blocked figure counts for the current repo
      filter, each with title, repo slug and its blocked reason (`Blocked` value, else
      `Waiting on <slug>`); the group is absent when the figure is.
- [ ] Tapping a Blocked row selects that ticket (`?t=`): on desktop the pane shows its ticket
      view and the list moves to its batch; on a phone the ticket view is pushed and back returns
      to the batch level.
- [ ] The list shows no figures, maintenance rows or error group; the not-configured,
      database-unavailable, no-repos, "Nothing open" and "Nothing in this repo" states keep
      their copy.
- [ ] `lib/tickets.ts` is unchanged, launcher URL shapes are unchanged, no route reading the board
      exports `dynamic = "force-dynamic"`, and refresh / on-return re-read / "as of" still work
      with a repo view open.
- [ ] The admin-dashboard README's Tickets section describes the repo view's figures and error,
      the overview's Blocked group and the tappable error rows.
- [ ] The Vercel preview is checked on a phone and a desktop in light and dark mode, including a
      board with a repo read error.
- [ ] CI green: Typecheck + lint and Build admin-dashboard.

## Out of scope

- The redesigned ticket view (stub 3, `ticket-view`) and the epic view with `breakdown.md`
  (stub 4, `epic-view`) — the Blocked rows open whatever ticket view is on `main`.
- Keyboard navigation (stub 6, `keyboard-nav`), including over the Blocked rows.
- A section, row or chip in list level 0 for an errored repo (operator, Define 2026-09-24).
- Today's tickets as rows in the overview — the Needs you home carries them (breakdown
  decision 6).
- Swipe gestures on the overview's Blocked rows.
- Any change to `lib/tickets.ts`, `readBoard()`'s payload shape, cache clocks, launcher URLs or
  maintenance prompts.

## Open questions

- none — errored repos reached from their error row, with a full view including launchers, were
  settled with the operator in Define, 2026-09-24. Blocked rows following the repo filter (the
  Blocked figure's set), the blocked-reason description, the repo figures' order and the
  omit-zeros rule are Define's technical calls.

Context budget: Define read `board-pane.tsx`, `board-views.tsx` (repo view, overview),
`repo-maintenance.tsx`, the board root and `page.tsx`, and greps of `lib/tickets.ts` (read
errors, blocked meta) and `board-model.ts` (figures, sections, repo selection), to find what the
shell already moved and to settle the errored-repo case.
