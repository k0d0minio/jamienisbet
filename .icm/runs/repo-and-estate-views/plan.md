# Plan: repo-and-estate-views

Build's execution plan in passes — each pass one layer of the change, in the order it lands, so
a session that resumes mid-build sees where it is. Written by the advisor pass (Define, or
Build's first act on `sonnet` after reading the spec), executed pass by pass, and rewritten when
reality disagrees with it — never left describing a plan that was abandoned.

## Passes

1. **Model: figures, blocked set, errored-repo resolution** — `components/board-model.ts`:
   a `repoFigures(section)` (Open = `section.open`; Today / Blocked from the section's tickets
   incl. its runs batch; In flight = runs batch size; zeros dropped, same shape as
   `boardFigures`); a `blockedTickets(board, repoSlug)` returning exactly the set
   `boardFigures`'s Blocked counts (`board.strip`, group `blocked`, filter applied) — share the
   filter helper so the two can't drift; extend the `repo` selection so `?r=<slug>` resolves for
   a repo in `board.errors` with no section (a variant carrying `repo` + `error`, section-less),
   still falling back to none otherwise. Done when: typecheck passes and `resolveSelection`
   returns a repo selection for an errored repo slug.
2. **Server: maintenance launchers for errored repos** — `app/(app)/tickets/page.tsx`: add every
   `board.errors` repo without a section to the launchers map passed down (today's
   `extraMaintenance`, rename if it reads better, e.g. `sectionlessMaintenance`), via
   `repoMaintenanceLaunchers(repo)`. `lib/tickets.ts` untouched. Done when: an errored repo's
   triage/sweep launchers reach the client.
3. **Views** — `components/board-views.tsx`: `RepoView` takes the figures, the optional error and
   the launchers (not a whole `ListSection`, so the errored case fits), renders figures →
   "Couldn't be read" block → client → `RepoMaintenance`; `EstateOverview` gains the Blocked
   group (rows: title, mono repo slug, reason from the ticket's `Blocked` meta else
   `Waiting on <dep>`, status dot via `ticket-look.ts`; tap → `onSelectTicket(key)`) between the
   figures and "Couldn't be read", and each repo error row becomes a button/row selecting
   `?r=<slug>` (roster row stays static). Done when: both views render per the spec's order.
4. **Wiring** — `components/tickets-board.tsx`: pass `onSelectTicket` / `onSelectRepo` into the
   overview, build the repo pane for both repo-selection variants (title mono slug, subtitle
   client or "House repo"), `paneKey` for the errored variant. Done when: tapping a Blocked row
   and an error row navigate via `useBoardParams` with no server request, cold loads restore.
5. **README + preview** — `websites/admin-dashboard/README.md` Tickets section (repo view figures
   and error, the overview's Blocked group, tappable error rows); push, ready flip, check the
   preview on phone + desktop, light + dark, with a repo read error (a connected repo the token
   can't see produces one). Done when: CI green and the preview checks pass.

## Risks

- **Blocked set drifting from the Blocked figure** — two filters written separately. Signal: the
  group's row count ≠ the figure. Derive both from one helper.
- **Section-less repo selection breaking existing code paths** that assume `selection.section`
  (filter conflict via `selectedRepo`, `paneKey`, level-0 highlight). Signal: typecheck errors
  on `.section`; handle by reading `repo` off the selection, not the section.
- **Filter vs errored repo** — an errored repo has no chip; selecting it with `?repo=` set to
  another repo must drop the filter as the shell's conflict rule does, not blank the list.
- **Reproducing a read error on the preview** — may need a repo connected in `biz` that the token
  can't read; if none exists, say so under Unverified rather than faking one.
