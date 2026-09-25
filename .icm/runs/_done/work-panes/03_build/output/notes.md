# Build notes: work-panes

- commits: 5ec6cc7 (status model), 2ed4d52 (three panes, keyboard, states, README), then Up next without legacy + run files
- ci: GREEN on the full gate (both previews built; Quality (advisory) passed on 27af4cc — the later heads change only run files)

## What changed

- `lib/tickets.ts`: `TicketStatus` (next / open / blocked / running), `today`, `lane`, `waitingOn`, `origin` on every ticket; the tree read now also collects `<epic>/_done/` stub names (never their blobs); `buildOrder()` parses each breakdown's `## Build order`; a dependency is merged when in `_done/` with no active run; one Up next candidate per epic (lowest open stub without `blocked:`), blocked when a dependency is unmet; runs titled from their consumed stub; epic rows (open / running / done) and `done/total` from open + `_done/`; `todayOrder` on `BoardData`. The phone group is derived from status + today. No new GitHub request; every cache invariant in the header is untouched.
- `components/work-model.ts` (new): the desk's URL model (`?v=`/`?b=`/`?r=` + `?t=`), old-link resolution and in-place correction, view lists and order, pane-two rows, pane-one entries.
- `components/work-desk.tsx` (new): the three panes on the desk tier (`Pane`, `ListRow`, `StatusDot`, `PriorityTag`, `Kbd`, `DeskButton`), the focused-pane keyboard, fold state in `localStorage`, the quiet / failed / no-token states. Pane three wraps the existing `TicketView` / `BatchView` / `RepoView` / `EstateOverview`.
- `components/work-screen.tsx` + `use-desk.ts` (new): mounts the desk from `lg`, the phone board below.
- `app/(app)/page.tsx`, `app/(app)/loading.tsx`: both layouts; a three-pane skeleton from `lg`.
- `components/use-board-params.ts`: `v` joins the selection keys. `use-board-keys.ts`: an `enabled` flag (the phone board passes false). `board-refresh.tsx`: a desk variant. `board-keys-sheet.tsx`: the desk's keys. `board-model.ts`: figures by status/today. `palette-actions.ts`: dots by status.
- `README.md`: the Work section rewritten for the panes, the status rules, the URL and the keys.

## Acceptance criteria status

- [x] Three panes from 1024px, each scrolling on its own; the drill board below — `work-screen.tsx`, `work-desk.tsx`.
- [x] Pane one: views with counts, foldable repos with open counts, epics `done/total`, Triage, Backlog; folds remembered — `navEntries`, `NavPane`, `jn:work:folds`.
- [x] Up next one per epic with merged dependencies, plus triage, by priority — `lib/tickets.ts` status derivation, `viewTickets("next")`.
- [x] Running rows: stub title, `repo / epic · n of m`, what is running — `originOf`, `whereLine`, `rowNote`.
- [x] Blocked rows with their reason, "— running" for a dependency in flight — `unmetDependency`, `blockedReason`.
- [x] Estate rows: dot, title, priority, mono line — `ListPane`.
- [x] Epic lists every stub, done dimmed, titles from the build order, no `_done/` blob — `epicRows` in `lib/tickets.ts`, `paneRows`.
- [x] Repo: its open tickets and runs grouped by epic; repo view in pane three; overview for a view — `paneRows` repo case, `paneSelection`.
- [x] Deep links, old-link resolution, back/forward — `resolveWork` + in-place correction.
- [x] Keyboard: per-pane cursor, Enter right, Esc left, `[`/`]`, `c`/`o`/`r`, `?` sheet — `onKey` in `work-desk.tsx`, `board-keys-sheet.tsx`.
- [x] Four states: content, quiet lines, three-pane skeleton, failed repo / roster / no token — `emptyLine`, `ReposEyebrow`, `DeskLoading`, `WorkDeskNotConfigured`.
- [x] No new GitHub request; `force-cache`, no `force-dynamic`, `MAX_CONCURRENT_REQUESTS` unchanged — `_done/` names come from the tree already read.

## Notes for Release

- Nothing was seen rendered in this session (no local run, no typecheck — CI's advisory job and the preview are the first compile). The smoke is the operator's: widths 1024 and 1280+, both themes, a keyboard walk, and a narrow window to confirm the phone board is unchanged.
- Decisions B-1 to B-6 in `decisions.md` — B-3 (done rows not selectable) and B-4 (legacy tickets out of Up next) are this stage's calls on gaps the spec left.
- Pane three is still app-tier inside a desk-tier root (by design until `work-reader`); it sits on `bg-app-canvas` so its grouped sections read as before.
- Context budget: Build read `tickets-board.tsx`, `board-views.tsx` and the desk primitives in `packages/ui` beyond `touches:` — the panes reuse them.

## Release

- gate: Ready to merge ticked — merge authorised
- ci: GREEN on the head that merged (ci-status.sh, after the last push)
- reviews: code high (10 findings — 6 fixed on the branch, 2 parked, 2 trivial cleanups fixed) · security security-check.sh --branch --audit: OK · /security-review n/a (no auth, payments, PII or route policy touched) · /production-readiness n/a (no DB, auth, payments or env var touched) · readiness env.sh audit --changed: OK
- fixed from review: only the live layout corrects the URL and takes keys (work-screen.tsx context); the live layout is no longer remounted when the width settles; the phone board keeps only batches with open tickets; legacy `Status: today` tickets join the Today view; `[`/`]` step from a repo or a folded epic; wrapped build-order lines joined and `n of m` totals from the highest place
- parked: up-next-pick-unsequenced-stubs.md, work-model-shared-helpers-and-memo.md
- migrations: skip — none of this run's own
- learned: skip — no error.log
- docs: websites/admin-dashboard/README.md (Work section, in Build) · announce: public
- Context budget: Release read the merged-in `lib/tickets.ts` diff from main (inbox-rebuild removed `listStrip`) to confirm the merge left no consumer of the phone groups behind.
