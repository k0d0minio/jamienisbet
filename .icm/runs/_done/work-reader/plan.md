# Plan: work-reader

Build's execution plan in passes — each pass one layer of the change, in the order it lands, so
a session that resumes mid-build sees where it is. Written by the advisor pass (Define, or
Build's first act on `sonnet` after reading the spec), executed pass by pass, and rewritten when
reality disagrees with it — never left describing a plan that was abandoned.

## Passes

1. **Running from GitHub, in `lib/tickets.ts`** — per active repo, one `pulls?state=open&per_page=100`
   read through the existing `gh()` fetch path (force-cache, `REVALIDATE_SECONDS`, the
   `MAX_CONCURRENT_REQUESTS` queue); match spine PRs by the `PIPELINE RUN` marker + Spec-table
   `Slug` row, then `claude/<slug>` head; for each PR labelled `type:bug|tweak|chore|hotfix`, one
   `pulls/{n}/files` read at `DISCOVERY_REVALIDATE_SECONDS`, matching a
   `triage/<name>.md → triage/_done/<name>.md` rename. A matched stub gets `status: "running"`
   and a new `pr: { number, url, draft, stage, openedAt } | null` field; `WaitingOn.running` and
   `EpicRow.state` read it too; a `runs/<slug>` ticket gets its PR when the slug matches. A run
   folder with only `01_scope/` stops producing a ticket (spec §4). A failed PR or files read
   marks the repo partial with a one-line reason and falls back to run folders (spec §5). Keep
   every cache invariant in the file header, and document the added request count there. —
   done when: this repo's own board shows `work-reader` as running with PR #176 while that PR is
   open, `admin-cockpit-redesign` is no longer a running ticket, and a repo whose PR read fails
   still lists its tickets.
2. **Launch data, in `lib/launchers/index.ts` + `launch-menu.tsx`** — a primary-action helper
   that says, for one ticket, whether the primary is Launch (url), Copy (too long / no link), or
   none, from the existing `launchesFor` / `primaryLaunch`; the launch button component (label
   from the registry, `⌘↵` hint, new-tab props from `launchLinkProps`) beside the existing copy
   split button, which becomes secondary. No new target, no change to `claude-web.ts`. — done
   when: the text Copy prompt copies and the `q` of the launch URL decode to the same string for
   a verb pick-up and for a prompt-body pick-up with its recommendation line.
3. **The reader, in `ticket-detail.tsx` (+ `markdown.tsx`, `globals.css` `.prose`)** — split the
   stub body into What this is / Notes for Define / Prompt (the existing fence-aware splitter,
   generalised to any `## ` heading); the head (mono path, GitHub ↗, title, `TicketSummary`
   extended with size, blocked line); the action row (running block from pass 1 in place of
   Launch); the prompt block showing `ticket.pickup` verbatim with `owner/repo · mode code`; the
   side column (dash-lines with `DependsOn`, the epic build order from `epicRows` with current /
   running / done marks and row selection, the breakdown's `## What I understood` excerpt + link).
   Desk-tier tokens and primitives only; the `.prose` styles move to desk tokens. The phone's
   detail keeps rendering until `work-phone` (it may share the new pieces, not its layout). —
   done when: a selected ticket at 1280px shows head, body and side column with no click, and a
   triage stub shows no epic block.
4. **Wiring and keyboard — `work-desk.tsx`, `work-model.ts`, `board-pane.tsx`, `board-views.tsx`,
   `use-board-keys.ts`, `board-keys-sheet.tsx`** — pane three renders the reader for a ticket and
   the restyled batch / repo / estate views otherwise (content unchanged, desk tier); `⌘↵` /
   `Ctrl+↵` intent triggers the selected ticket's primary action from any pane, ignored in text
   fields, the palette and sheets (`window.open` inside the key handler, so it counts as a user
   gesture); `?` lists it. — done when: every AC in spec §2 holds by keyboard alone.
5. **Docs** — `websites/admin-dashboard/README.md` § Tickets / Work: the reader, `⌘↵`, the PR read
   and its request budget (1 per repo + 1 per open lane PR), the lane-PR match rule, the scope-run
   rule. — done when: the README matches what shipped.

## Risks

- **Request budget.** A repo with many open lane PRs adds a files read each; with the 8-in-flight
  cap a cold board read gets slower. Signal: board read time rising on the preview. Mitigation
  already in the spec: the files read is cached for an hour.
- **Unauthenticated `force-cache` misses.** The file header explains that a revalidate alone does
  not cache a request with an Authorization header — the new reads must opt in the same way or
  they hit GitHub on every render. Signal: rate-limit headers dropping per page load.
- **PR body shape drift.** Matching relies on the Spec-table `Slug` row and lane labels written by
  the pipeline scripts; older PRs without them fall back to the `claude/<slug>` head only, and a
  harness-named branch (like this run's) then does not match. Signal: an open spine PR whose
  stub still reads "next".
- **`⌘↵` pop-up blocking.** A new tab opened outside a direct user gesture is blocked; the open must
  happen synchronously in the keydown handler.
