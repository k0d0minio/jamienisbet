# Spec: Work on the iPhone

- slug: work-phone
- personas: operator
- touches: websites/admin-dashboard/components/work-screen.tsx, websites/admin-dashboard/components/work-model.ts, websites/admin-dashboard/components/use-board-params.ts, websites/admin-dashboard/components/use-desk.ts, websites/admin-dashboard/components/ticket-reader.tsx, websites/admin-dashboard/components/work-views.tsx, websites/admin-dashboard/components/work-desk.tsx, websites/admin-dashboard/components/tickets-board.tsx, websites/admin-dashboard/components/board-pane.tsx, websites/admin-dashboard/components/board-views.tsx, websites/admin-dashboard/components/batch-row.tsx, websites/admin-dashboard/components/board-ticket-row.tsx, websites/admin-dashboard/components/ticket-detail.tsx, websites/admin-dashboard/components/ticket-look.ts, websites/admin-dashboard/app/(app)/page.tsx, websites/admin-dashboard/app/globals.css, websites/admin-dashboard/README.md
- complexity: standard

## Problem

Jamie reads and launches tickets on the iPhone as one of its three jobs (D-2, D-21), but under
`lg` Work is still the old phone board: a chip rail over inset grouped lists, a drill of batch
levels, pushed views on the retiring app tier (`Material`, `GroupedBlock`), and a detail view
where Launch is buried under the stub. The desk got Up next, the reader and one-click launch in
`work-panes` and `work-reader`; the phone got none of it. The `admin-cockpit-redesign` scope
(initiative: operator cockpit; objective: less time finding work, more time launching it)
settles the compressed Work from the mockup. This stub (6 of 11) builds it, on the same data and
selection model as the desk.

## Proposed change

Below the desk breakpoint (`lg`, 1024px — the same `DESK_QUERY` `WorkScreen` already switches
on; an iPad in portrait keeps the rail and gets this layout at its full width), Work is a stack
of pushed levels on the desk tier. **One codepath for data, two layouts**: the phone reads the
same `readBoard()` result, resolves its selection with the same `resolveWork` / `work-model.ts`
rules and the same `v` / `b` / `r` / `t` query keys as the desk, and renders the same reader
content; only the layout differs. The old phone board (`tickets-board.tsx` and the files only it
uses) is deleted, not left beside it.

### 1. The list level — title bar and a two-way switch

- **Title bar:** a plain "Work" title; at its trailing end the mono "as of HH:MM" (Europe/Lisbon,
  as the desk), the refresh button and the palette's search button, each a 44px target. Refresh
  and the quiet re-read after five minutes away behave as they do today.
- **Switch:** a two-segment control, **Up next** and **Repos** (the desk tier's
  `SegmentedControl`), each segment a 44px-tall target. It is sticky under the title bar while
  the list scrolls.
- **Up next** (D-12 "what do I launch next"): three sections in this order — **Up next**,
  **Running**, **Blocked** — each headed by a mono eyebrow and its count (Running's count amber,
  Blocked's red once non-zero), holding exactly the tickets the desk's views of the same names
  hold, in the same order (`viewTickets`). Each ticket is a two-line row: a `StatusDot`, the
  title, the `PriorityTag`, the desk's "today" mark on a today.md pick; under them the mono
  `repo / epic · n of m` (`repo / triage · <lane>`) from `whereLine`; a blocked row's red reason
  or a running row's amber PR-and-stage note from `rowNote`, as a third line. A section with
  nothing in it says so in one line. There is no Today section: today picks are marked where
  they fall. Repos that couldn't be read are counted in one line under the sections, as the desk
  view does.
- **Repos** (D-12 "where is client X at"): every repo in the board's urgency order. Each repo is
  a **tappable header** — mono slug, client name, a chevron, a red dot and a one-line reason when
  its read failed — that pushes the repo level (§3). Under it, one row per epic: the epic title,
  a thin progress meter with a mono `done of total`, and a next line — "Next: <title>",
  "Running: <title>" or "Blocked: <title>" for its lowest-sequence open stub in that state —
  then **Triage** and **Backlog** rows (when non-empty) with their open counts and no meter.
  Tapping an epic, Triage or Backlog row pushes the epic level (§2). A failed roster read is a
  line above the repos.
- **Rows only tap.** No row carries a swipe tray; copy, GitHub and client links live in the
  reader and the repo level. Nothing depends on hover.

### 2. The epic level

Pushed from a Repos epic row, a repo level's epic heading, or a deep link. A back bar (§5); the
mono `repo / epic`, the epic title, the meter with `done of total`, and the breakdown's *What I
understood* as a paragraph. Then **every** stub in sequence, as the desk's epic list holds them:
mono sequence, status dot, title, priority. Open and running rows push the reader; done rows are
dimmed and are not buttons (a done stub is known by name only and has no body to read). Triage
and Backlog use the same level with no meter, no breakdown paragraph and the lane in place of
the sequence.

### 3. The repo level

Pushed from a repo header, or opened by `?r=<repo>` (the palette's Repos group) or the retired
`?repo=<slug>`. A back bar; the mono slug and client name, the client's profile link
(`/leads/<id>`) and GitHub ↗ when there is one; the repo's open tickets and runs grouped by epic
(the desk's repo list — the same grouping and order), each group heading tappable to that epic's
level, each row the two-line row of §1 pushing the reader; then the repo's maintenance launchers
(`RepoMaintenance`, as the desk repo view shows them). A repo whose read failed shows what GitHub
said and its maintenance launchers, as the desk does.

### 4. The reader

Pushed from any row. The same content as the desk reader (`work-reader`, D-8), in one column,
top to bottom, with no tab and no disclosure:

- **Back bar:** the back button (§5) and GitHub ↗ at its trailing end.
- **Head:** the mono path `repo / epic / slug`, the title, the one summary line (status,
  priority, `n of m` or lane, size, client), and a blocked ticket's reason.
- **Body:** *What this is*, *Notes for Define*, *Prompt · what the launch sends* (mono, never
  folded, the stub's own `## Prompt` after it when the launch sends a `/pipeline` verb).
- **Then the epic:** the stub's dash-lines (each `depends-on` on the board is a link that pushes
  its reader), the epic's title and progress, its build order (current stub marked, open and
  running rows push their reader, done rows dimmed and inert), and the *What I understood*
  excerpt with a link to the whole breakdown. A triage stub shows none of the epic block.
- **The launch bar** (D-10), sticky at the bottom of the reader and always visible while the
  body scrolls: **Launch in Claude Code** full width at 44px, a 44px Copy prompt icon button
  beside it (labelled for assistive tech), and — only when more than one launch target is
  registered — a 44px menu button holding the others. Under them, the mono model and effort
  recommendation ("<model> · <effort> · recommended"). The bar follows the desk reader's rules
  for its primary act: a prompt past the link's cap shows Copy prompt as the full-width primary
  with the registry's "Too long for a link" line and no Launch; a ticket with an open PR shows,
  in place of Launch, the amber running line (`draft PR #n` linked, its stage, how long ago it
  opened) and keeps Copy prompt; a run folder with no PR keeps Launch, to resume it. Launch opens
  in a new tab, sends nothing and stores nothing (D-9, D-11).
- **Clearance:** the bar sits directly above the tab bar, which already extends under the home
  indicator; where there is no tab bar (`md` and up — an iPad in portrait) the bar itself pads
  for the bottom safe-area inset. The body pads its end so its last line scrolls clear of the
  bar. The bar never covers content and never slides under the tab bar.

### 5. Push, pop and the URL

- **Every level has a URL**, in the desk's grammar, so a link means the same thing at either
  width: Up next is no selection key (or `?v=next`); Repos is `?v=repos` (new, the one
  phone-only value); a repo is `?r=<repo>`; an epic, Triage or Backlog is `?b=<repo>/<batch>`;
  the reader is its list key plus `?t=<repo>/<ticket id>` — the list key is where it was opened
  from and where back returns (`?v=next&t=…`, `?b=…&t=…`, `?r=…&t=…`, `?v=repos&t=…`).
- **Desk links on the phone:** `?v=today|running|blocked` open the Up next segment (Running and
  Blocked scrolled to their section), without rewriting the URL; `?t=` alone opens the reader
  with its own epic or triage as its parent (a run: Up next); a ticket since shipped falls back
  to its epic; `?repo=<slug>` rewrites in place to `?r=<slug>`; anything unknown is Up next.
- **Phone links at the desk:** `?v=repos` reads as Up next at the desk and is not rewritten, so
  a rotation or a window resize back under `lg` returns to Repos.
- **Every tap is a `pushState`** (the existing `useBoardParams`), so the browser's back and
  forward step through levels. The switch between Up next and Repos is a `replaceState` — it is
  a filter, not a level.
- **The back button** sits at the leading edge of each pushed level's bar, a 44px target, and
  names where it goes ("Up next", "Repos", the repo slug, the epic title). When the entry behind
  is the level it returns to, it is `history.back()`; from a cold deep link it pushes the parent
  (the existing prev-query mechanism in `use-board-params.ts`).
- **The edge swipe:** a horizontal drag starting at the leading edge of a pushed level follows
  the finger and, past a threshold of its width or a quick flick, pops the level exactly as the
  back button does; short of it, it returns. Vertical scrolling is never captured. The motion is
  a short linear slide with no spring (D-3), and none at all under `prefers-reduced-motion`.
- **Scroll is kept per level:** popping back to a list restores where it was scrolled to.

### 6. Targets and hover

On a touch-primary device every interactive target is at least 44×44px — through the desk
tier's touch step (`@media (pointer: coarse)` in `tokens/desk.css`) for rows and controls, and by
construction for the back button, the switch segments, the title-bar buttons and the launch bar.
Nothing is reachable only by hover: no hover-only reveals, no tooltip-only information.

### 7. What leaves

`tickets-board.tsx`, `board-pane.tsx`, `batch-row.tsx`, `board-ticket-row.tsx`,
`ticket-detail.tsx` and `board-views.tsx` are deleted once nothing imports them; the one piece
the desk still imports from `board-views.tsx` (`BatchSummary`) moves beside its caller.
`ticket-look.ts` and `board-model.ts` keep only what a live file uses. `swipe-row.tsx`,
`board-keys-sheet.tsx` and `pull-to-refresh.tsx` stay (the Inbox, Leads, the desk and the shell
use them). The Work page renders the new phone layout in `WorkScreen`'s phone slot. The README's
"Under `lg` — the phone board" paragraph is rewritten for what shipped.

## Acceptance criteria

- [ ] Below 1024px Work shows the title bar and the Up next / Repos switch, and none of the desk panes; from 1024px the desk is unchanged.
- [ ] Up next lists the Up next, Running and Blocked sections with the same tickets, in the same order, as the desk's three views of those names, each row two lines with its status dot, priority, `repo / epic · n of m` line, a today mark on a today.md pick, and a blocked reason or running PR note where one applies.
- [ ] Repos lists every repo in the board's order, each with its epics (meter, `done of total`, next line) and its Triage and Backlog rows; a repo whose read failed shows a red dot and its reason.
- [ ] Tapping a repo header pushes the repo level with its open tickets grouped by epic and its maintenance launchers; tapping an epic (from Repos or the repo level) pushes every stub in sequence with done rows dimmed and not tappable; tapping an open or running stub pushes the reader.
- [ ] Each level has a URL (`?v=repos`, `?r=`, `?b=`, list key + `?t=`); reloading any of them reopens that level, and the same URL opened at 1024px or wider opens the matching desk selection (`?v=repos` as Up next).
- [ ] The back button and a leading-edge swipe each pop exactly one level, to the level named on the back button, and the browser's back and forward step through the same levels; from a cold deep link the back button goes to the level's parent.
- [ ] Popping back to a list restores its scroll position.
- [ ] The reader shows the path, title, status line, blocked reason, What this is, Notes for Define, the full prompt, then the dash-lines, the epic's build order and the What I understood excerpt, with no tab or disclosure; a triage stub shows no epic block.
- [ ] The launch bar stays visible while the reader's body scrolls, sits above the tab bar and clear of the home indicator on an iPhone (and above the bottom safe area on an iPad in portrait), and the body's last line scrolls clear of it.
- [ ] The launch bar holds a full-width 44px Launch and a 44px Copy prompt, the model and effort recommendation under them; a too-long prompt shows Copy prompt as primary with the "Too long for a link" line; a ticket with an open PR shows the linked running line in place of Launch; Launch opens Claude Code in a new tab with the same text Copy prompt copies.
- [ ] On a touch device every interactive target on Work is at least 44×44px, and nothing on Work requires hover.
- [ ] No row on Work swipes sideways.
- [ ] `tickets-board.tsx`, `board-pane.tsx`, `batch-row.tsx`, `board-ticket-row.tsx`, `ticket-detail.tsx` and `board-views.tsx` no longer exist, and Work imports no app-tier component (`Material`, `GroupedBlock`, `GroupedRow`, `GroupedSection`).
- [ ] With `prefers-reduced-motion`, pushes and pops happen without a slide.

## Out of scope

- Desk layout changes — the desk panes, its keyboard map and its URL behaviour stay as they are,
  beyond reading `?v=repos` as Up next.
- A keyboard map on the phone layout.
- A Today section on the phone (today picks are marked in place).
- Row swipe gestures on Work (dropped, not ported).
- Editing tickets, launching several at once, or new launch targets (D-9; whole-scope out of
  scope).
- Deleting the app tier from `packages/ui`, and moving pull-to-refresh or the other shell
  screens off it — `retire-app-tier`.
- The Inbox and Leads phone layouts.

## Open questions

- none
