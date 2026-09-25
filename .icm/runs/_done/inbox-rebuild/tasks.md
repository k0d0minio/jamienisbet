# Tasks: inbox-rebuild

The queue, with a definition of done per item. Ticked by the stage that finishes the item —
a human checkbox, never a script's. The definition of done is seeded from the spec's
acceptance criteria when the run is opened; the queue is Build's own, one line per commit-sized
step, so a resuming session can pick up the first unticked line.

## Definition of done

- [ ] `/inbox` shows one group, "Follow-ups", with its row count in the header; activating the header folds and unfolds it, and the fold survives a reload in the same browser.
- [ ] No Money row, no Today's tickets and no "worth a look" tally appears on `/inbox`, and the page makes no Stripe or GitHub request; `/leads?crack=unplanned` and `/leads?crack=idle` still filter Leads.
- [ ] The group lists outreach due (≤10, overdue first then fit tier), then open leads untouched 7+ days that are not on today's outreach queue (≤6, longest first), then nurture wakes whose date has come (≤3); each kind past its cap ends with a line naming how many more are waiting.
- [ ] Each row shows its kind tag in mono, the lead's name, the who-line and the age; overdue outreach and stale ages render in the destructive colour.
- [ ] The rail and tab-bar Inbox badge equals the number of rows `/inbox` shows after the same read (capped counts summed), and is hidden at 0.
- [ ] At 1024px and wider, the list and a detail pane sit side by side; the first row is selected on load; the pane shows the row's facts and the actions in the kind table for that row.
- [ ] Every follow-up can be cleared from `/inbox` without opening the lead: a stale lead by Mark touched; an outreach row by Tomorrow or by logging a touch and accepting (or editing) the suggested next step; a wake by Wake, Tomorrow or Later · +90 days.
- [ ] Tomorrow on an outreach row keeps the step's text and dates it tomorrow; Tomorrow on a wake sets the wake date to tomorrow; neither is offered on a stale lead.
- [ ] Reach actions are plain `wa.me`, `mailto:` or `tel:` links for the lead's own details; no AI draft is generated and no message is sent from `/inbox`; a touch is only ever logged by the operator's own submit.
- [ ] A cleared row leaves the list immediately and the selection moves to the neighbouring row; a failed action restores the row and shows a toast.
- [ ] With no rows, the list reads "Nothing needs you"; with a failed database read it shows an error line instead.
- [ ] At the desk, `j`/`k` and ↓/↑ move the selection, `↵` runs the primary, `e` the done action and `s` Tomorrow; none of them fire while typing in a field, while the palette is open, or with ⌘/Ctrl held.
- [ ] Below 1024px, tapping a row opens it in place with its primary and secondary as two 44px buttons and the remaining actions as text buttons; outreach and stale rows swipe right to mark touched and left to reveal the reach tray; at 390px wide every action is reachable with one thumb and no horizontal scroll.
- [ ] The Inbox renders in the desk tier in light and dark (system appearance), with a loading skeleton in the new layout.
- [ ] `websites/admin-dashboard/README.md` describes the Inbox as the Follow-ups queue, its keys and the badge rule.
- [ ] CI's lint, typecheck and build pass on the PR head, and the admin's Vercel preview builds.

## Queue

- [x] Capped follow-up rule, queue read and badge — `lib/inbox.ts`, `lib/inbox-row.ts`, `listTouchSummaries` in `packages/services`
- [x] `moveNextStepToTomorrow` and `wakeTomorrow` — `app/(app)/actions.ts`
- [x] The page (Neon only) and its skeleton — `app/(app)/inbox/`
- [x] The queue, row and detail pane — `components/inbox-list.tsx`, `inbox-row.tsx`, `inbox-detail.tsx`
- [x] Cleanup: `nurture-wakes.tsx` and `listStrip` (orphaned), README
