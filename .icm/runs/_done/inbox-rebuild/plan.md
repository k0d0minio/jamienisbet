# Plan: inbox-rebuild

Build's execution plan in passes — each pass one layer of the change, in the order it lands, so
a session that resumes mid-build sees where it is. Written by the advisor pass (Define, or
Build's first act on `sonnet` after reading the spec), executed pass by pass, and rewritten when
reality disagrees with it — never left describing a plan that was abandoned.

## Passes

1. **The rule and the badge** — `lib/inbox.ts`: one `loadFollowUps(now)` that returns the three
   capped row lists (outreach ≤10, stale ≤6, wakes ≤3) plus each kind's uncapped total, and
   `countFollowUps()` rewritten to sum the capped lengths from the same function (D-30) — done
   when: the badge and the page both call it and no other place restates a cap.
2. **The server actions** — `app/(app)/actions.ts`: `moveNextStepToTomorrow(id)` (keeps the
   action text, dates it tomorrow on the queue's day boundary) and `wakeTomorrow(id)` beside
   `pushWake`; both `revalidateLead` + revalidate `/inbox` like their neighbours — done when:
   typecheck passes and each is a one-call action returning void or throwing like the others.
3. **The page, server side** — `app/(app)/inbox/page.tsx`: drop `loadMoney`, `loadTickets`,
   `QuietCracks`, `MoneyNeedingAction`, `TodaysTickets`, `FeedNotes` and their imports; read
   pass 1; serialise each row into one `InboxRow` shape (id, kind, name, who-line, age label,
   late flag, channel, reachable channels with their hrefs, next-step text and date, last touch,
   cadence rung, wake context) — done when: the page makes no Stripe or GitHub call and hands a
   plain array to one client component.
4. **The queue at the desk** — `components/inbox-list.tsx` (client: group header with fold in
   localStorage wrapped in try/catch, rows, selection, keyboard, optimistic removal via
   `useOptimistic`/transition with a toast on failure), `components/inbox-row.tsx`,
   `components/inbox-detail.tsx` (facts, kind-table actions, the log-a-touch form calling
   `logTouchAction` then offering the suggestion through `saveNextAction`) — desk primitives only
   (`DeskButton`, `Kbd`, desk tokens) inside the `desk-tier` root — done when: at ≥1024px the list
   and pane work end to end with j/k/↵/e/s and the key guard (field focus, open palette, modifier).
5. **The phone** — below `lg` the same list renders rows that expand in place (one open), with
   the two 44px buttons and the text-button line; outreach and stale rows wrap in the existing
   `LeadRow`/`SwipeRow` gestures (right = mark touched, left = reach tray); wakes do not — done
   when: at 390px every action is reachable and nothing scrolls sideways.
6. **States and cleanup** — new `inbox/loading.tsx` skeleton, "Nothing needs you", the error
   line; retire `components/nurture-wakes.tsx` if nothing else imports it (grep first); README
   section for the Inbox — done when: no dead import remains and the README matches the screen.

## Risks

- `LeadRow`/`SwipeRow` are app-tier components used by Leads too — styling them for the desk
  tier inside the Inbox must not change Leads; signal: a diff in `components/lead-row.tsx` that
  touches classes Leads renders. Prefer passing the desk row as children over editing them.
- The badge streams from the layout while the page reads separately; both must call the same
  function with the same caps, or badge ≠ rows (an acceptance criterion).
- "Tomorrow" across midnight and the server's timezone: use the same boundary `isOnTodaysQueue`
  uses, or a row moved at 23:30 comes straight back.
- A woken lead reappears as an Outreach row on the re-read — expected, but the optimistic removal
  must not also hide the new row (key rows by kind + id).
