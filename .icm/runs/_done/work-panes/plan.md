# Plan: work-panes

Build's execution plan in passes — each pass one layer of the change, in the order it lands, so
a session that resumes mid-build sees where it is. Written by the advisor pass (Define, or
Build's first act on `sonnet` after reading the spec), executed pass by pass, and rewritten when
reality disagrees with it — never left describing a plan that was abandoned.

## Passes

1. **The status model in `lib/tickets.ts`** — the tree read also collects `_done/` stub names
   per epic and `triage/_done/` (names only, no blob); parse each breakdown's `## Build order`
   lines (`N. <slug> — <title> — depends-on: …`) into slug → {sequence, title}; derive per stub
   "dependency merged" (in `_done/`, no active run), the one-per-epic Up next pick, Blocked with
   its reason ("Waiting on <dep>", "— running"), Running rows titled from their `_done/` stub;
   extend `BoardData` with what the panes need (each epic's full ordered row set including done
   and running, done/total, the four view lists as ticket keys, the today order). Keep every
   cache invariant in the file header untouched. — done when: a unit-level read of this repo's
   own tree (fixture) yields Up next = one stub per epic, `_done/` rows titled from the
   breakdown, and the request count per board read is unchanged.
2. **The selection model — `board-model.ts` + `use-board-params.ts`** — list key (`v` | `b` |
   `r`) plus optional `t`; resolution of `?t=` alone, `?b=<repo>/_runs`, `?repo=`, shipped and
   unknown keys; the phone board's reading (`t` wins, `v` ignored). Pure functions, resolved from
   the URL on every render. — done when: each URL form in spec §5 resolves as written (unit
   tests in the admin's existing test setup, if any; else a table in notes.md walked by hand).
3. **Pane one and pane two** — new desk-tier components from `Pane`, `ListRow`, `StatusDot`,
   `PriorityTag`: the views with counts, the foldable repos with epics/Triage/Backlog and fold
   state in `localStorage` (try/catch), the list header + meter, estate-view rows with the mono
   `repo / epic · n of m` line and red/amber notes, epic rows with sequence and dimmed done rows,
   the repo list grouped by epic. `tickets-board.tsx` mounts the three panes from `lg` and keeps
   the drill board below `lg`; pane three wraps the existing `TicketView` / `BatchView` /
   `RepoView` / `EstateOverview` unchanged. Retire `board-pane.tsx` / chip rail at the desk only
   where nothing below `lg` still needs them. — done when: every row shape in spec §4 renders
   against real board data and the phone board is untouched below 1024px.
4. **Keyboard** — `use-board-keys.ts` gains a focused-pane model: j/k/arrows per pane, Enter /
   → / l moves right, Esc / ← / h moves left, `[`/`]` step pane-one entries (AltGr path kept),
   c/o/r unchanged; `replaceState` for pane-two cursor steps; `listbox` + `aria-activedescendant`
   per pane; `board-keys-sheet.tsx` rewritten to the new map. — done when: the whole estate can
   be walked with the keyboard alone and the `?` sheet matches the keys.
5. **States, palette, docs** — quiet-view lines, empty-estate line, the three-pane loading
   skeleton in `app/(app)/loading.tsx`, failed-repo / roster / no-token treatment on the desk
   tier with the "n repos couldn't be read" partial note; `palette-actions.ts` still compiles
   and its dots follow the new rules; the README's Work section rewritten for the panes. — done
   when: each of the four states is visible on the preview and the README describes what ships.

## Risks

- **Cache regression** — adding reads for `_done/` would spend the rate limit; the tree already
  lists `_done/` paths, so names cost nothing. Signal: any new `gh(` call or `fetchBlob` on a
  `_done/` path in the diff.
- **Two list models at once** — the drill board below `lg` and the panes above share
  `board-model.ts`; changing the selection shape can break the phone. Signal: `?t=`/`?b=` links
  opening the wrong level on a narrow window.
- **Breakdowns that don't follow the Build order format** (older or other-repo epics) — `_done/`
  rows fall back to the slug; never fail the read. Signal: an epic list with blank titles.
- **One-per-epic hides parallel tracks** — chosen at Define; once `work-panes` is running, this
  epic's next pick (`work-reader`) waits on it, so the epic shows in Blocked and `inbox-rebuild`
  sits in the epic list only. Not a bug.
