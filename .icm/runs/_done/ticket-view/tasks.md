# Tasks: ticket-view

The queue, with a definition of done per item. Ticked by the stage that finishes the item —
a human checkbox, never a script's. The definition of done is seeded from the spec's
acceptance criteria when the run is opened; the queue is Build's own, one line per commit-sized
step, so a resuming session can pick up the first unticked line.

## Definition of done

- [ ] Opening a ticket shows, top to bottom: title; the summary line; the action row; the metadata table; the body — and no "Sends" line anywhere.
- [ ] The summary line shows the status dot and label, priority, `n of m`, repo slug and the client link (or "house"), omitting any segment the ticket lacks, and does not show the ticket id.
- [ ] A ticket blocked by a `blocked:` line shows that text at the end of its summary line; one blocked by an open dependency shows "waiting on <dep>"; in both cases the metadata table has no Blocked / Waiting on row.
- [ ] The Recommended hint sits beside the split button at desktop width and wraps below it at 375 px; "Open on GitHub" opens the ticket's file in a new tab from the action row.
- [ ] A run in flight and a ticket with no prompt show their one-line explanation instead of the split button, and still offer "Open on GitHub".
- [ ] A `depends-on` slug naming an open ticket in the same epic is a link; tapping it selects that ticket in the pane (URL `?t=` updates, no full navigation or loading skeleton); a slug not on the board renders as plain text.
- [ ] A ticket body with a `## Prompt` section renders it inside a "Prompt" disclosure, collapsed on open; expanding it shows the prompt rendered; a body without one shows no disclosure.
- [ ] At 375 px, in light and dark mode, a long ticket (long code spans, a wide table, a fenced code block) causes no horizontal page scroll — overflow scrolls inside its own box.

## Queue

- [x] Ticket view rewrite — `components/ticket-detail.tsx` (TicketSummary, action row, metadata table with depends-on links, Prompt fold), `board-views.tsx` (dependency keys), `tickets-board.tsx` (summary as the pane subtitle)
- [x] Phone-width overflow — `app/globals.css` `.prose` (`min-width: 0`, `overflow-wrap` on the block and on links)
