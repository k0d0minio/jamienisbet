# Tasks: work-reader

The queue, with a definition of done per item. Ticked by the stage that finishes the item —
a human checkbox, never a script's. The definition of done is seeded from the spec's
acceptance criteria when the run is opened; the queue is Build's own, one line per commit-sized
step, so a resuming session can pick up the first unticked line.

## Definition of done

- [ ] At the desk, selecting a ticket shows its head, its stub sections, Notes for Define and the full prompt together, with no extra click.
- [ ] The reader's head shows `repo / epic / slug` in mono, the title, and a summary line with status, priority, `n of m`, size and client; a blocked ticket shows its reason.
- [ ] Launch in Claude Code is the primary button and opens the default target's link in a new tab; the model and effort recommendation shows beside it.
- [ ] `⌘↵` launches the selected ticket at the desk, and does nothing while a text field, the palette or a sheet has focus; `?` lists it.
- [ ] Copy prompt copies exactly the text the prompt block shows, which is exactly what Launch sends.
- [ ] A prompt past the link's length cap offers no Launch: Copy prompt is primary, the too-long line shows, and `⌘↵` copies.
- [ ] The side column lists the stub's dash-lines, the epic's build order with the current stub marked and each open or running row selectable, and the breakdown's "What I understood" with a link to the whole breakdown; a triage stub shows only its dash-lines.
- [ ] An epic stub with an open spine PR (by Slug row or `claude/<slug>` head) reads as running everywhere on the board, shows `PR #n` linked with its stage and age, and offers no Launch.
- [ ] A triage stub whose move to `triage/_done/` is in an open lane PR's file list reads as running in the same way.
- [ ] A folder under `.icm/runs/` holding only `01_scope/` produces no running ticket.
- [ ] A failed pull-request read leaves the repo's tickets on screen, says so in one line, and falls back to run-folder detection.
- [ ] Batch and repo selections keep their views in pane three, drawn in the desk tier.
- [ ] No reader file uses an app-tier class or token.
- [ ] README § Tickets describes the reader, `⌘↵`, the pull-request read and its request budget.

## Queue

- [x] `lib/tickets.ts` — open-PR read per repo, lane-PR file list, stub/run match, scope-run filter, `prErrors` (299139c)
- [x] `lib/launchers/index.ts` — `primaryAction`, shared by the reader's button and ⌘↵ (299139c)
- [x] `components/ticket-reader.tsx` + `app/globals.css` desk prose — head, action row, body, side column (299139c)
- [x] `components/work-views.tsx` — desk batch, repo and overview views for pane three (299139c)
- [x] `components/work-desk.tsx`, `use-board-keys.ts`, `board-keys-sheet.tsx`, `work-model.ts` — wiring, ⌘↵, PR line on rows (299139c)
- [x] `websites/admin-dashboard/README.md` — the reader, ⌘↵, the PR read and its budget (299139c)
- [ ] Verified on the preview — the operator's smoke
