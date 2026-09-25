# Tasks: work-phone

The queue, with a definition of done per item. Ticked by the stage that finishes the item —
a human checkbox, never a script's. The definition of done is seeded from the spec's
acceptance criteria when the run is opened; the queue is Build's own, one line per commit-sized
step, so a resuming session can pick up the first unticked line.

## Definition of done

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

## Queue

- [ ] <task — small enough for one commit; name the file or area>
