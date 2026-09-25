# Build notes: inbox-rebuild

- commits: feat: inbox-rebuild — the Inbox as a fast Follow-ups queue
- ci: see status.md (settled by ci-status.sh after the ready flip)

## What changed

- `websites/admin-dashboard/lib/inbox.ts`: the one follow-up rule, now with the caps (`INBOX_CAPS` — outreach 10, waiting 6, wake 3). `loadInbox()` is the page's only read (Neon: clients, due outreach, woken nurture, crack counts, touch summaries) and builds every row server-side; `countFollowUps()` sums the capped counts, so the badge equals the rows (D-30). `waitingOnYou` now sorts longest-wait first explicitly.
- `websites/admin-dashboard/lib/inbox-row.ts` (new): the client-safe row shape.
- `packages/services/src/queries/touches.ts`: `listTouchSummaries(ids)` — the last touch and the outbound count for the whole queue in two statements (DISTINCT ON + a grouped count), instead of a history read per row. Read-only; no schema change.
- `websites/admin-dashboard/app/(app)/actions.ts`: `moveNextStepToTomorrow` (keeps the step's words, dates it the start of tomorrow on the queue's own day boundary; returns a refusal rather than throwing, since Next redacts thrown messages) and `wakeTomorrow`.
- `websites/admin-dashboard/app/(app)/inbox/page.tsx`: rewritten — `loadInbox()` and nothing else; no Stripe, no GitHub. `loading.tsx`: the new two-pane skeleton.
- `components/inbox-list.tsx` (new): the queue — the group fold (localStorage via `useSyncExternalStore`, with an in-memory copy when storage refuses), selection, the desk keyboard (j/k/↓/↑, ↵, e, s; ignored in fields, under an overlay, with any modifier), optimistic clears with `useOptimistic` (a failed write restores the row and toasts), the "N more" lines, and the phone header's palette button + app menu.
- `components/inbox-row.tsx` (new): one row — a dense line from `lg`, two lines below; below `lg` it opens in place, and outreach/stale rows wear `SwipeRow` (right = mark touched, left = WhatsApp/email tray; D-32).
- `components/inbox-detail.tsx` (new): the kind table (`actionsFor`), shared by the desk pane and the phone's expanded row; the log-a-touch form (`logTouchAction`, then the cadence's suggestion accepted/edited via `saveNextAction`).
- Removed `components/nurture-wakes.tsx` and `listStrip()` in `lib/tickets.ts` — both used only by the old feed.
- `websites/admin-dashboard/README.md`: the Inbox section, the badge rule, the file map.

## Acceptance criteria status

- [x] One "Follow-ups" group, count in the header, fold remembered in the browser — `inbox-list.tsx` (`writeFold`/`readFold`).
- [x] No Money, tickets or tallies; page reads Neon only; the `?crack=` filters on Leads are untouched.
- [x] Order and caps: outreach (crack-finder order, ≤10), waiting (longest first, ≤6), wakes (≤3); a "N more" line per kind past its cap.
- [x] Kind tag in mono, name, who-line, age; overdue outreach and stale ages in `text-desk-blocked` (the destructive alias).
- [x] Badge = rows: `countFollowUps` sums the same capped counts `loadInbox` shows; hidden at 0 by the existing nav.
- [x] From 1024px: list + detail pane; first row selected on load; facts and kind-table actions.
- [x] Every kind clearable in place (touched / tomorrow / log + accept / wake / later) — with D-35's one refusal for a dated row with no step.
- [x] Tomorrow semantics per kind; not offered on stale leads.
- [x] Reach = plain `wa.me` / `mailto:` / `tel:` links only; no draft, no send; touches only by the operator's submit.
- [x] Optimistic removal, selection moves to the neighbour; failure restores + toasts.
- [x] "Nothing needs you" when empty; an error line on a failed read.
- [x] Desk keys with the guards.
- [x] Phone: expand in place, two main buttons (44px via the coarse-pointer tokens), text-button line; swipes on outreach/stale.
- [x] Desk tier, light/dark through the tokens; skeleton in the new layout.
- [x] README updated.
- [ ] CI + preview — settled after the ready flip.

## Notes for Release

- Two small reads were added outside `touches:`: `listTouchSummaries` in `packages/services` (so the pane's facts don't cost a query per row), and the removal of `listStrip` in `lib/tickets.ts` (orphaned by this change). No schema change, no migration.
- The phone's swipe engine (`swipe-row.tsx`) keeps its app-tier settle spring — kept by D-32, untouched here; `retire-app-tier` owns it.
- The "44px" buttons below `lg` come from the desk tier's coarse-pointer step, so they are 44px on a phone and 30px in a narrow desktop window — the tokens' rule, not a query in the component.
- Smoke focus: e on an outreach row → log → accept the suggestion clears the row; a woken lead returns as an Outreach row after the re-read; the badge equals the row count.
