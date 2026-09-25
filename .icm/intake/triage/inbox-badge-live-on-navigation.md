# Stub: The Inbox badge trails the feed between shell renders

- lane: tweak
- found-by: release shell-rail-palette · 2026-09-25
- complexity: low
- priority: P2

## Problem

The rail's and the tab bar's Inbox badge is read in the `(app)` layout (`countFollowUps` in
`websites/admin-dashboard/lib/inbox.ts`, streamed from `app/(app)/layout.tsx`). A client-side
navigation between screens does not re-render that layout, so the count only moves on a load,
a pull-to-refresh or a server action. Between those it can differ from the rows `/inbox` shows —
a lead that went stale since the last render, or one cleared on a path that re-renders only its
own page.

## Proposed change

Keep the badge current across client navigations without a request per keystroke: for example,
re-read the count when `/inbox` renders and hand it to the chrome, or refresh the layout segment
when the Inbox is opened. The count's rule stays `countFollowUps`.

## Acceptance criteria (rough)

- [ ] Opening `/inbox` by a link shows the same number on the badge as the Inbox counts.
- [ ] No extra Neon read per navigation beyond what the Inbox page already makes.

## Prompt

Run `/pipeline tweak inbox-badge-live-on-navigation`. Context: shell-rail-palette's Release
review, finding 4.
