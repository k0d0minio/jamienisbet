# Spec: The ticket view, readable on a phone

- slug: ticket-view
- personas: operator
- touches: websites/admin-dashboard/components, websites/admin-dashboard/app/globals.css
- complexity: standard

## Problem

The Tickets board's ticket view (`components/ticket-detail.tsx`, shown in the master–detail
pane since `master-detail-shell`) stacks a split button, a Recommended hint, a "Sends `…`" line,
a key/value list and the full body with equal weight, so on a phone the operator scrolls past
machinery before learning what state a ticket is in or what it waits on. The board's job is to
let the operator pick work up from anywhere (AGENTS.md: the admin dashboard is the owner-only cockpit); this
is stub 3 of the `tickets-master-detail` epic, breakdown decision 5 — one screen above the fold
that says what the ticket is, where it stands and how to start it.

## Proposed change

The ticket view is rewritten phone-first, in this order:

1. **Title** — the pane's large title (the pushed view's title on a phone), unchanged.
2. **One summary line** — the pane subtitle for a ticket selection becomes: status dot + status
   label (the board's own labels: Today / In flight / Blocked / Next / Queued) · priority (P0 in
   the destructive tint, as on the rows) · `n of m` (mono, tabular) · repo slug (mono) · the
   client link, or "house" for the house repo. Segments whose value is absent (a legacy ticket's
   sequence, a stub with no priority) are omitted with their separator. The ticket id is no longer
   shown (Jamie, 2026-09-24). On a **Blocked** ticket the line ends with the reason — the stub's
   `blocked:` text, or "waiting on <dep>" when it is blocked by an open dependency — and the
   metadata table no longer carries the Blocked / Waiting on row (said once). The line wraps on a
   phone; it never truncates.
3. **The action row** — the `CopySplitButton` ("Copy pick-up" / "Copy prompt", every launch target
   behind its chevron) with the **Recommended** hint beside it, wrapping under the button on narrow
   widths; "Open on GitHub" as a secondary action in the same row. A run in flight and a
   prompt-less ticket keep their one-line explanation in place of the button; "Open on GitHub"
   stays. The client link leaves this row (it is on the summary line). The "Sends `…`" line is
   removed.
4. **The metadata table** — the remaining dash-line fields (depends-on, size, sources, lane,
   found-by, sequence…) as a compact two-column list, keys in the secondary label colour, values
   in mono. Each `depends-on` slug that names a ticket on the board in the same epic is a link that
   selects that ticket client-side (the same URL state a row tap sets — `?t=<repo>/<id>`, no
   navigation round-trip); a slug not on the board (already shipped, or mistyped) stays plain mono
   text.
5. **The body** — the ticket's markdown rendered below. Its `## Prompt` section (heading to the next
   `## ` or the end) is pulled out and shown collapsed under a disclosure labelled "Prompt", closed
   by default; the rest renders in its original order.

At phone width (375 px) nothing in the view widens the page: long code spans and URLs break inside
their line, and code blocks and tables scroll horizontally inside their own box (the `.prose`
layer in `globals.css`).

## Acceptance criteria

- [ ] Opening a ticket shows, top to bottom: title; the summary line; the action row; the metadata table; the body — and no "Sends" line anywhere.
- [ ] The summary line shows the status dot and label, priority, `n of m`, repo slug and the client link (or "house"), omitting any segment the ticket lacks, and does not show the ticket id.
- [ ] A ticket blocked by a `blocked:` line shows that text at the end of its summary line; one blocked by an open dependency shows "waiting on <dep>"; in both cases the metadata table has no Blocked / Waiting on row.
- [ ] The Recommended hint sits beside the split button at desktop width and wraps below it at 375 px; "Open on GitHub" opens the ticket's file in a new tab from the action row.
- [ ] A run in flight and a ticket with no prompt show their one-line explanation instead of the split button, and still offer "Open on GitHub".
- [ ] A `depends-on` slug naming an open ticket in the same epic is a link; tapping it selects that ticket in the pane (URL `?t=` updates, no full navigation or loading skeleton); a slug not on the board renders as plain text.
- [ ] A ticket body with a `## Prompt` section renders it inside a "Prompt" disclosure, collapsed on open; expanding it shows the prompt rendered; a body without one shows no disclosure.
- [ ] At 375 px, in light and dark mode, a long ticket (long code spans, a wide table, a fenced code block) causes no horizontal page scroll — overflow scrolls inside its own box.

## Out of scope

- The epic, repo and estate-overview views (stubs `epic-view`, `repo-and-estate-views`).
- Keyboard navigation (stub `keyboard-nav`), including focus moving on a depends-on link.
- Linking dependencies that live in another epic or repo, and any change to how `lib/tickets.ts` parses stubs or groups tickets.
- Any change to the launch targets, the split button's menu, or the pick-up / prompt text itself.

## Open questions

- none
