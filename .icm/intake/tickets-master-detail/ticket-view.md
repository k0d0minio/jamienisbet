# Stub: The ticket view, readable on a phone

- feature-slug: ticket-view
- sequence: 3 of 6
- depends-on: master-detail-shell
- priority: P1
- size: S

## What this is

A rewrite of `components/ticket-detail.tsx` for the detail pane / pushed view. Today it
stacks a split button, a hint, a "Sends `…`" line, a key/value list and the body with
equal weight. The order Jamie wants above the fold on a phone:

1. **Title** — the view's large title (the pushed view's nav title on a phone).
2. **One summary line** — status (Today / Next / Blocked / In flight / Open, with its
   dot) · priority · `n of m` · repo slug (mono) · client link or "house". Blocked
   tickets show the blocked reason here, not only in the table.
3. **The action row** — the `CopySplitButton` (label "Copy pick-up" / "Copy prompt",
   every launch target behind its chevron) with the **Recommended** hint beside it (wraps
   under on narrow widths), and "Open on GitHub" as a secondary action. Runs in flight
   and prompt-less tickets keep their one-line explanation instead of the button.
4. **The metadata table** — the dash-lines (depends-on, size, sources, lane, found-by…)
   as a compact two-column grouped list; values in mono; `depends-on` slugs that are
   in the same epic link to those tickets (client-side selection).
5. **The body** — rendered markdown below. The `## Prompt` section is collapsed by
   default under a disclosure ("Prompt") since the button already carries it.

Dropped: the "Sends `…`" line (decision 5 in the breakdown). Check the `.prose` scale at
phone width — long code spans and tables must wrap or scroll inside their own box, never
widen the page.

## Prompt

Read `.icm/intake/tickets-master-detail/breakdown.md`, then this stub
(`.icm/intake/tickets-master-detail/ticket-view.md`). `master-detail-shell` must be
merged. Then read `websites/admin-dashboard/components/ticket-detail.tsx`,
`components/launch-menu.tsx`, `components/markdown.tsx`, the `.prose` layer in the app's
`globals.css`, and the `design-dna` skill.

Rewrite the ticket detail in the order the stub gives (title, summary line, copy split
button + Recommended hint, metadata table, body with the Prompt section collapsed); drop
the "Sends" line; make depends-on links select the dependency. Phone width first.

Work on a `claude/` branch, open a PR, let CI verify (never build locally), check the
Vercel preview on a phone in both colour modes with a long ticket. In the same PR,
`git mv` this stub to `.icm/intake/tickets-master-detail/_done/`.
