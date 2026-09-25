# Spec: Work at the desk: views, repos and the ticket list

- slug: work-panes
- personas: operator
- touches: websites/admin-dashboard/components/tickets-board.tsx, websites/admin-dashboard/components/board-model.ts, websites/admin-dashboard/components/board-views.tsx, websites/admin-dashboard/components/board-ticket-row.tsx, websites/admin-dashboard/components/batch-row.tsx, websites/admin-dashboard/components/board-pane.tsx, websites/admin-dashboard/components/board-keys-sheet.tsx, websites/admin-dashboard/components/use-board-params.ts, websites/admin-dashboard/components/use-board-keys.ts, websites/admin-dashboard/components/ticket-look.ts, websites/admin-dashboard/app/(app)/page.tsx, websites/admin-dashboard/app/(app)/loading.tsx, websites/admin-dashboard/app/(app)/palette-actions.ts, websites/admin-dashboard/lib/tickets.ts, websites/admin-dashboard/README.md
- complexity: complex

## Problem

Work is home (D-6), but at the desk it is still the phone board drawn wider: a list that drills
repos → batches → tickets one level at a time beside a detail pane. Answering "what do I launch
next" or "where is client X at" (D-12) takes several taps and hides the rest of the estate while
you look. The `admin-cockpit-redesign` scope (initiative: operator cockpit; objective: less time
finding work, more time launching it) settles Work at the desk as three panes — views and repos,
the ticket list, the reader (D-7, mockup option A). This stub (4 of 11) builds the first two
panes on the desk tier; `work-reader` replaces the third, `work-phone` the layout under `lg`.

## Proposed change

The visual reference is the design canvas (https://claude.ai/artifact/EtnAmedYSgzwYG2jNKB3bC),
artboard "Work, three panes" (sample data): pane one 232px on a `surface2` ground, pane two
392px, the reader the rest, hairlines between them, 32–36px rows, Hanken Grotesk with Plex Mono
for every slug, count and `n of m`. Built from the desk primitives already in `packages/ui`
(`Pane` and its parts, `ListRow`, `StatusDot`, `PriorityTag`, `Kbd`, `DeskButton`) inside the
`desk-tier` root. Tickets stay read-only (D-9): nothing here writes to a repo or stores state.

**1. Where it applies.** From `lg` (1024px) Work is three panes filling the width beside the
rail: pane one 208px and pane two 320px at `lg`, 232px and 392px from `xl` (1280px), the third
pane the remainder, each pane scrolling on its own under one toolbar strip ("Work", "as of
HH:MM", the refresh button). **Below `lg` the current drill board is unchanged** — iPad
portrait and phones keep today's list, chips and pushed views until `work-phone` replaces them.
A URL the desk writes must still open sensibly there (§5).

**2. Pane one — views, then repos.**

- **Views**, each with a mono count: **Up next**, **Today**, **Running**, **Blocked**. Running's
  count reads amber and Blocked's red, as the mockup; a zero shows as `0`.
- **Repos**, under a "Repos" eyebrow, in the board's existing urgency order: one row per repo —
  a fold chevron, the repo slug, its open count — and, unfolded, its epics by title with a mono
  `done/total`, then **Triage** with its open count, then **Backlog** (unmigrated legacy
  tickets) with its count where the repo has any. The In flight pseudo-batch is not listed: its
  runs are the Running view.
- The chevron folds; the slug selects the repo (§4). Repos start folded except the one holding
  the current selection; what the operator folds or unfolds is remembered in this browser
  (`localStorage`, every access in try/catch — a convenience, never state).
- A repo whose GitHub read failed stays listed, its row marked (red dot, "couldn't be read"),
  and selecting it shows its repo view with what GitHub said. A roster failure is a line at the
  head of the repos list with GitHub's message.

**3. What each view lists — the status rules.** Computed on the server in `lib/tickets.ts` from
the one recursive tree read each repo already makes; no new GitHub request. The tree read now
also collects the **names** of each epic's `_done/` stubs and of `triage/_done/` (never their
blobs — `_done/` bodies stay unfetched).

- A stub's **dependency is merged** when the slug it names sits in the epic's `_done/` and has
  no active run folder in `.icm/runs/<slug>/`. A dependency still open in the epic, or in
  `_done/` with an active run, is **unmet**. A slug named nowhere in the epic does not block
  (it stays visible in the ticket's header fields).
- **Running** = every active run folder (`.icm/runs/<slug>/`, not `_done`, the sustentus skip
  kept), D-11. A running row's title is the title of the stub it came from — found by slug in
  that repo's epics' `_done/` via the breakdown's `## Build order` line, else the slug — its
  mono line `repo / epic · n of m` (`repo / triage · <lane>`, or `repo / run` when no stub
  matches), and an amber note saying what is running: "Build next", "Release next", or "Lane —
  PR open for your merge".
- **Up next** (one per epic — the operator's choice at Define): for each epic, its
  lowest-sequence open stub without a `blocked:` line, when every dependency it names is merged;
  plus every open triage stub. An epic whose lowest such stub has an unmet dependency
  contributes nothing to Up next. Ordered P0, P1, P2, then no priority; ties in the board's repo
  order, then sequence.
- **Blocked** = open stubs with a `blocked:` line, plus each epic's lowest open stub when a
  dependency is unmet. The red note says why: the `blocked:` text, else "Waiting on
  <dep>" — "Waiting on <dep> — running" when the dependency has an active run.
- **Today** = the tickets named in icm-board's `.icm/today.md`, as read today, in today.md's
  order; each row carries its own status dot.
- Every other open stub is **Open** (queued). The board's figures (repo view, estate overview,
  palette dots) move to these same rules, so no two surfaces disagree.

**4. Pane two — the list.** A header with the list's title and a mono sub-line (a view's
description, e.g. "runnable now, across every repo"; an epic's `repo/epic · done of total` over
a thin `Meter`), then the rows.

- **An estate view** (Up next, Today, Running, Blocked): per row a `StatusDot`, the title, the
  `PriorityTag` when the stub carries one, and under it the mono `repo / epic · n of m` (`repo /
  triage · <lane>` for a triage stub); a blocked row adds its red reason, a running row its
  amber note. A row in today.md shows a small mono "today" mark.
- **An epic** (`?b=<repo>/<epic>`): **every** stub of the epic in sequence — open, running and
  done — each with its sequence number before the title; done rows dimmed (`ListRow`'s `done`).
  Open stubs come from their parsed files; `_done/` stubs take their sequence and title from the
  breakdown's `## Build order` line (`N. <slug> — <title> — depends-on: …`); a `_done/` stub the
  breakdown does not name lists after the sequenced rows by its slug. A `_done/` stub with an
  active run is Running, not done. `done/total` counts the same set: done = in `_done/` without
  an active run; total = open + everything in `_done/`.
- **Triage** (`?b=<repo>/triage`) and **Backlog**: their open tickets, by priority.
- **A repo** (`?r=<repo>`): the repo's open tickets and running runs across its epics and
  triage, grouped under each epic's title in the pane-one order, rows as in an epic.
- Choosing a ticket selects it (`?t=`); the selected row takes the `sunken` fill.

**5. Pane three and the URL.** The third pane keeps today's detail views until `work-reader`:
the selected **ticket** (`TicketView`); with no ticket, an **epic's** batch view (its meter,
Copy next, Recut, breakdown) for `?b=`, the **repo** view (figures, GitHub error, client,
maintenance launchers) for `?r=`, and the **estate overview** (figures, Blocked group, couldn't
be read, estate check) for a view or nothing. The estate overview, repo view and maintenance
launchers from `repo-and-estate-views` are therefore reached from a view, a repo's slug, and
the palette.

The URL at the desk: the list is one of `?v=next|today|running|blocked`, `?b=<repo>/<batch>`,
or `?r=<repo>`; `?t=<repo>/<ticket id>` is the selected ticket and **combines** with the list
key. Nothing set means Up next with the estate overview. Written with `pushState` as today, so
back/forward step through lists and selections, and the board still loads once and filters on
the client. Old and foreign links resolve:

- `?t=` alone (the palette, an old link) → the ticket's own epic or triage list, ticket selected;
  a run ticket `?t=<repo>/runs/<slug>` → the Running view.
- `?b=<repo>/_runs` → the Running view.
- `?repo=<slug>` (the retired chip filter) with no list key → `?r=<slug>`; at the desk the chip
  rail is gone.
- A `?t=` that names something since shipped falls back to its epic, as today; anything unknown
  falls back to Up next.
- Below `lg` the drill board reads the same URL: `?t=` wins, else `?b=`, else `?r=`; `?v=` is
  ignored there.

**6. Keyboard, from `lg`.** One cursor per pane; the focused pane is marked.

- `j`/`k` and `↓`/`↑` move the cursor in the focused pane. In pane two the cursor **is** the
  selection — each step rewrites `?t=` in place (`replaceState`), so the reader follows and back
  does not replay every row passed.
- `Enter` (or `→`/`l`) opens: in pane one it shows that view, epic or repo in pane two
  (`pushState`) and moves focus there; in pane two it moves focus into the reader, where the
  arrows and `j`/`k` scroll it. `Esc` (or `←`/`h`) steps focus back a pane; in pane one it
  clears the selection.
- `[`/`]` step to the previous/next entry in pane one (views, then the epics of unfolded repos)
  and open it without moving focus — the AltGr/Option handling for `[`, `]` and `?` kept.
- `c`, `o` and `r` keep their meaning (copy what the view's own copy button would, open on
  GitHub, refresh). No key fires while typing, with a menu, sheet or the palette open, or with
  Ctrl/Cmd/Alt held (the AltGr exception aside).
- The `?` sheet lists these keys. Each pane's list is a `listbox` whose `aria-activedescendant`
  is its cursor row.

**7. Four states.**

- **Content** — as above.
- **A quiet estate** — a view with no rows says so in a line in pane two: Up next "Nothing
  runnable — every open stub waits on something, or the intake is empty."; Today "Nothing
  picked for today — /day in icm-board picks it."; Running "Nothing running."; Blocked "Nothing
  blocked." An epic with every stub done still lists them, all dimmed. No repo with an
  `.icm/intake/` at all: pane one's repos list says so.
- **Loading** — `app/(app)/loading.tsx` draws the three panes at `lg` as hairline skeletons
  (view rows, a few repo rows, list rows) with no motion beyond the desk tier's; below `lg`
  today's skeleton.
- **A GitHub read that failed** — per repo as in §2; a roster failure as a line in pane one and
  the estate overview; no token at all keeps today's "GitHub isn't configured here" notice,
  moved onto the desk tier. Counts never read a failure as zero work: a view whose data is
  partial because a repo failed says "n repos couldn't be read" under its header.

**8. Invariants kept.** The GitHub cache rules at the top of `lib/tickets.ts` hold unchanged:
every read `force-cache`, no `force-dynamic` on any route reading the board, the
`MAX_CONCURRENT_REQUESTS` cap, the three clocks, `_done/` blobs never fetched. `board-model.ts`
keeps its pure "selection resolved from the URL on every render" model, extended to a list plus
an optional ticket. The command palette (`palette-actions.ts`) keeps reading `readBoard()` and
its ticket dots follow §3. The README's Work section is rewritten for the panes.

## Acceptance criteria

- [ ] From 1024px wide, Work shows three panes beside the rail — views and repos, the list, the detail — each scrolling on its own; below 1024px the current drill board works as before.
- [ ] Pane one lists Up next, Today, Running and Blocked with counts, then every repo (foldable, with its open count) listing its epics with `done/total`, Triage with its count, and Backlog where legacy tickets exist; fold state survives a reload in the same browser.
- [ ] Up next lists, per epic, only its lowest open unblocked stub whose every `depends-on` is merged (in `_done/` with no active run), plus every open triage stub, ordered P0, P1, P2, none; a later-sequence stub whose dependencies are merged does not appear while a lower-sequence open stub exists in its epic.
- [ ] Running lists every active run folder with its stub's title, `repo / epic · n of m`, and what is running (Build next, Release next, or the lane's merge).
- [ ] Blocked lists stubs with a `blocked:` line and each epic's lowest open stub with an unmet dependency, each row saying why ("Waiting on <dep> — running" when the dependency has an active run).
- [ ] An estate-view row shows a status dot, the title, the priority when present, and the mono `repo / epic · n of m` line.
- [ ] Choosing an epic lists every stub in sequence — open, running and done — with done ones dimmed, titles for `_done/` stubs taken from the breakdown's build order, and no `_done/` blob fetched.
- [ ] Selecting a repo's slug lists its open tickets and runs in pane two and its repo view (figures, error, client, maintenance launchers) in pane three; the estate overview shows in pane three for a view with no ticket selected.
- [ ] A deep link restores the view or epic or repo and the selected ticket (`?v=`/`?b=`/`?r=` plus `?t=`); `?t=` alone, `?b=<repo>/_runs` and `?repo=` resolve as specified, and back/forward step through lists and selections without a reload.
- [ ] `j`/`k` and the arrows move the cursor in the focused pane, Enter opens and moves focus right, Esc moves focus left, `[`/`]` step pane one's entries, `c`/`o`/`r` still work, and the `?` sheet lists every key.
- [ ] Each of the four states is drawn: content, a quiet view or estate (the lines in §7), a three-pane loading skeleton, and a failed GitHub read (per repo, roster, no token) that never shows as zero work.
- [ ] No new GitHub request per board read: `lib/tickets.ts` keeps `force-cache` on every read, no route reading the board exports `force-dynamic`, and `MAX_CONCURRENT_REQUESTS` still caps them.

## Out of scope

- The reader (stub and prompt together, Launch as the primary act) — `work-reader`; pane three keeps today's views.
- The layout below `lg` — `work-phone`.
- Reading pull requests: Running comes from run folders only here; a PR-backed running state and matching lane PRs to triage stubs are `gates-read` and `work-reader`.
- Any ticket editing, reordering or state change from the dashboard (D-9).
- Listing done triage stubs (`triage/_done/` names are read only to title running lane runs).

## Open questions

- none
