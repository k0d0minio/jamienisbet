# Build notes: work-phone

- commits: 92f6b50 (the phone levels, the reader's parts, the swap and the deletions), adfc3d1
  (the two more orphaned files, the README)
- ci: GREEN on 1d664f6 — full gate (ready): Vercel jamie-nisbet and portfolio previews pass; main merged in at 4570f0b

## What changed

- `components/work-phone.tsx` (new): the phone under `lg` — list level (title bar, sticky Up next /
  Repos switch; Up next's three sections; Repos with tappable repo headers, epics with meter and
  next line, Triage and Backlog), the repo level (grouped open tickets + the desk's
  `DeskRepoView`), the epic level (every stub, done rows inert), the reader (compact head,
  stacked body, the sticky launch bar), the back bar, the edge swipe, scroll kept per level.
  `WorkPhoneNotConfigured` for no `GITHUB_TOKEN`.
- `components/work-model.ts`: `REPOS_VIEW`, and `resolveWork` reads `?v=repos` as Up next without
  a correction; `phoneLevel` / `phoneQuery` / `phoneParent` / `phoneLabel` / `phoneLevelKey` /
  `epicNextLine`; repo-list headings carry their batch key (`batch`).
- `components/use-board-params.ts`: `canonical()` reads a lone `?v=next` as `/`; `pop()`;
  `pushedFromQuery()`.
- `components/ticket-reader.tsx`: `ReaderHead compact`, `ReaderBody stacked`, `ReaderLaunchBar`,
  `CopyIconButton`, `DeskCopyButton` `keys` + `className`, `RunningBadge` `className`,
  `understood` exported. The desk's reader renders exactly as before.
- `app/(app)/page.tsx`: the phone slot is `WorkPhone` / `WorkPhoneNotConfigured` — no app-tier
  import left on the page.
- `app/globals.css`: `@utility bottom-tabs` — a sticky element resting on the tab bar.
- `components/work-desk.tsx`: `BatchSummary` moved in from `board-views.tsx` (its only caller).
- Deleted: `tickets-board.tsx`, `board-pane.tsx`, `batch-row.tsx`, `board-ticket-row.tsx`,
  `ticket-detail.tsx`, `board-views.tsx`, `ticket-look.ts`, and — orphaned by the same deletion
  — `launch-menu.tsx`, `repo-maintenance.tsx`. `board-model.ts` lost `selectedRepoSlug`,
  `CursorRow`, `levelZeroRows`, `rowSelection` (no caller).
- Comments naming the old board: `work-screen.tsx`, `use-desk.ts`, `use-board-keys.ts`,
  `work-views.tsx`, `work-model.ts`, `use-board-params.ts`.
- `README.md`: "Under `lg` — Work on the phone", the launch-control lines, the file tree.

## Acceptance criteria status

Every criterion is met in code; each needs the preview (390×844, and an iPad in portrait) to
prove it — nothing here was run in a browser (blind-until-ready).

- [x] Below 1024px Work shows the title bar and the Up next / Repos switch, and none of the desk panes; from 1024px the desk is unchanged. — `WorkScreen` mounts `WorkPhone` under `DESK_QUERY`; the desk's files change only in comments, `BatchSummary`'s home and `?v=repos`.
- [x] Up next lists the Up next, Running and Blocked sections with the same tickets, in the same order, as the desk's three views of those names, each row two lines with its status dot, priority, `repo / epic · n of m` line, a today mark on a today.md pick, and a blocked reason or running PR note where one applies. — `viewTickets` per section; `TicketRow` uses `whereLine` and `rowNote`, the desk's own.
- [x] Repos lists every repo in the board's order, each with its epics (meter, `done of total`, next line) and its Triage and Backlog rows; a repo whose read failed shows a red dot and its reason. — `Repos` / `RepoHeader` / `BatchRow`; failed repos with no section listed after, as the desk's nav does.
- [x] Tapping a repo header pushes the repo level with its open tickets grouped by epic and its maintenance launchers; tapping an epic (from Repos or the repo level) pushes every stub in sequence with done rows dimmed and not tappable; tapping an open or running stub pushes the reader. — `RepoLevel` (`paneRows` repo + `DeskRepoView`), `BatchLevel` (`paneRows` batch; done rows are `ListRow done` divs).
- [x] Each level has a URL (`?v=repos`, `?r=`, `?b=`, list key + `?t=`); reloading any of them reopens that level, and the same URL opened at 1024px or wider opens the matching desk selection (`?v=repos` as Up next). — every level is derived from the URL (`phoneLevel(resolveWork(…))`), never from state.
- [x] The back button and a leading-edge swipe each pop exactly one level, to the level named on the back button, and the browser's back and forward step through the same levels; from a cold deep link the back button goes to the level's parent. — `pop()`; the label reads the pushed-from entry.
- [x] Popping back to a list restores its scroll position. — `scrolls` map by `phoneLevelKey`, restored in a layout effect unless the change was a push.
- [x] The reader shows the path, title, status line, blocked reason, What this is, Notes for Define, the full prompt, then the dash-lines, the epic's build order and the What I understood excerpt, with no tab or disclosure; a triage stub shows no epic block. — `ReaderHead compact` + `ReaderBody stacked`.
- [x] The launch bar stays visible while the reader's body scrolls, sits above the tab bar and clear of the home indicator on an iPhone (and above the bottom safe area on an iPad in portrait), and the body's last line scrolls clear of it. — `sticky bottom-tabs`, `md:bottom-0` + safe-area padding; in the flow after the body.
- [x] The launch bar holds a full-width 44px Launch and a 44px Copy prompt, the model and effort recommendation under them; a too-long prompt shows Copy prompt as primary with the "Too long for a link" line; a ticket with an open PR shows the linked running line in place of Launch; Launch opens Claude Code in a new tab with the same text Copy prompt copies. — `ReaderLaunchBar` on `primaryAction` / `launchLinkProps`, the desk's decision.
- [x] On a touch device every interactive target on Work is at least 44×44px, and nothing on Work requires hover. — rows `min-h-desk-row` (44 under `pointer: coarse`), back button, segments and launch bar `h-11`, title-bar buttons through the tokens; no hover-only affordance.
- [x] No row on Work swipes sideways. — no `SwipeRow` on Work.
- [x] `tickets-board.tsx`, `board-pane.tsx`, `batch-row.tsx`, `board-ticket-row.tsx`, `ticket-detail.tsx` and `board-views.tsx` no longer exist, and Work imports no app-tier component (`Material`, `GroupedBlock`, `GroupedRow`, `GroupedSection`). — deleted; `page.tsx` imports none.
- [x] With `prefers-reduced-motion`, pushes and pops happen without a slide. — there is no slide at all (D-44).

## Notes for Release

- **Spec gap, D-44:** push and pop are instant, not the "short linear slide" spec §5 describes —
  `design-dna` forbids slides on the desk tier. The swipe follows the finger and, on release,
  pops or springs back with no animation. Worth a look in the smoke.
- **D-45:** the phone scrolls the window; scroll restore and the sticky launch bar rest on that.
  Smoke both on an iPhone in Safari and installed (standalone), where the toolbars differ.
- The edge swipe is native touch listeners on the level (a touch within 20px of its leading
  edge that moves sideways; Release replaced Build's `touch-none` overlay strip, which ate taps
  and vertical scrolls — see `## Release`). In a Safari tab the browser's own edge swipe may also
  fire — both land on the same history entry.
- `app/(app)/loading.tsx` still draws the old phone board's skeleton on the app tier; the
  loading states are `retire-app-tier`'s (its stub names them), so it was left alone.
- The two extra deletions (`launch-menu.tsx`, `repo-maintenance.tsx`) had no importer once the
  old board was gone; the maintenance launchers on the phone are the desk's (`DeskRepoView`).
- Context budget: Build read the desk's `work-desk.tsx` / `work-views.tsx` / `inbox-list.tsx`
  (for the phone chrome) and the desk-tier primitives in `packages/ui` beyond `touches:`, to reuse
  rather than fork them.
