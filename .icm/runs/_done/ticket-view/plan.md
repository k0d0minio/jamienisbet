# Plan: ticket-view

Build's execution plan in passes — each pass one layer of the change, in the order it lands, so
a session that resumes mid-build sees where it is. Written by the advisor pass (Define, or
Build's first act on `sonnet` after reading the spec), executed pass by pass, and rewritten when
reality disagrees with it — never left describing a plan that was abandoned.

## Passes

1. **Summary line** — `components/tickets-board.tsx` (the `case "ticket"` pane subtitle) plus a
   small `TicketSummary` (in `ticket-detail.tsx` or its own file) built from `GROUP_DOT` /
   `GROUP_LABELS` / `priorityClass` in `components/ticket-look.ts`: dot + label · priority ·
   `n of m` · repo slug · client link or "house", absent segments dropped with their separator,
   id gone; blocked reason from the `Blocked` meta row or the derived `Waiting on` row
   (`lib/tickets.ts` appends it to `meta`), which the table then filters out. — done when: a
   blocked, a queued and a legacy ticket each show the right line.
2. **Action row + metadata table** — `components/ticket-detail.tsx`: split button + Recommended
   hint in a `flex-wrap` group that breaks under the button when narrow, "Open on GitHub" as the
   row's secondary action, the client link removed from here, the "Sends" block deleted; the
   `dl` keeps its grid, drops Blocked / Waiting on, and renders `Depends on` values as one link
   per slug when `<epic>/<slug>` is a ticket in the same batch (needs the batch's ticket ids
   passed down from `TicketView` in `board-views.tsx`; selection through `useBoardParams()` in
   `components/use-board-params.ts`, the same call a row tap makes). — done when: a dependency
   link swaps the pane with no loading skeleton.
3. **Body with the Prompt disclosure** — split `ticket.body` at `^## Prompt` (to the next `^## `
   or the end) in `ticket-detail.tsx`; render the rest through `Markdown`, the prompt section
   inside a `<details>` closed by default, styled like the existing disclosure in
   `components/client-repo-link.tsx` (`min-h-app-touch`, `list-none` summary). — done when: a
   stub with and one without `## Prompt` both render correctly.
4. **Phone-width overflow** — `app/globals.css` `.prose` layer (and `components/markdown.tsx` if a
   table needs a wrapper): `overflow-wrap:anywhere` on inline code/links, `overflow-x:auto` on
   `pre` and a wrapped `table`. — done when: a long ticket at 375 px shows no horizontal page
   scroll in either colour mode on the preview.

Passes 1–3 are one component's rewrite and can land as one commit; pass 4 is independent.

## Risks

- The pane subtitle is shared with the batch/repo views — change only the ticket case, or the
  other views' headers regress.
- `Depends on` is a joined string in `meta` (`dependsOn.join(", ")`); splitting it back is safe
  only because slugs contain no commas — if `lib/tickets.ts` is touched instead, keep it out of
  scope (spec: no parsing changes).
- Splitting the body on `## Prompt` must not catch a `## Prompt` inside a fenced code block.
- `.prose` is shared with every rendered markdown in the app — check a lead profile or other
  consumer still reads the same after the overflow rules.
