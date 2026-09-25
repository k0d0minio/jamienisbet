# Plan: lead-profile-columns

Build's execution plan in passes — each pass one layer of the change, in the order it lands, so
a session that resumes mid-build sees where it is. Written by the advisor pass (Define, or
Build's first act on `sonnet` after reading the spec), executed pass by pass, and rewritten when
reality disagrees with it — never left describing a plan that was abandoned.

## Passes

1. **Order handover** — new `lib/lead-order.ts` (read/write the ordered ids in session storage,
   try/catch, SSR-safe) and a client `components/lead-order.tsx` recorder mounted once in
   `app/(app)/leads/page.tsx` with the ids exactly as rendered (after filter / view / crack /
   sort) — done when: opening `/leads?filter=open` then a lead leaves the rendered id order in
   session storage.
2. **Head and action bar** — the head (back + `N of M`, monogram, name, company · status menu ·
   deal stage · tier, figure + badges, repo/Stripe lights, last worked) and the action bar
   rebuilt on desk primitives from `lead-action-row.tsx`, `lead-status-row.tsx`,
   `lead-links.tsx`, `mark-touched-button.tsx`, `work-started-button.tsx`; the destructive menu
   wraps `client-actions.tsx` and opens `lead-suppress.tsx`'s sheet; Log a touch opens the
   touch-log sheet lifted out of `lead-touches.tsx` so the bar can trigger it — done when: every
   action in the bar works on a real lead, opt-outs disable their channel.
3. **Left column** — Next step block (`lead-next-action.tsx`, red + "N days late"), then Contact,
   Facts, Deal, Deal folder as desk key–value lists with their existing edit sheets, then the
   folded intake — done when: each card's Edit opens today's sheet and saves.
4. **Right column tabs** — Activity (`LeadReply` + `TouchRow` list + derived "came in" row),
   Draft, Forms, Notes; `?tab=` replaces `lib/lead-segments.ts` (retired values → activity);
   delete `components/lead-segments.tsx` — done when: tabs switch in place and survive a refresh.
5. **Page layout + responsive** — `page.tsx` composes head + two columns from `lg` (independent
   scroll), one stacked column below; drop `AppProfileScreen` / Grouped* / ActionCircle imports
   from the profile — done when: 1440 and 390 widths match the spec's §3 / §4 order.
6. **Keys** — j / k (neighbour from the stored order, keep `?tab=`), L, T; ignored in fields,
   open sheets/menus, with modifiers — done when: the key AC rows pass by hand.
7. **Copy, states, docs** — `form-links.tsx` stale line + comment, `loading.tsx` / `error.tsx`
   in the new shape, admin README Lead row and profile paragraph — done when: grep finds no
   "in the Deal card" copy.

## Risks

- `leads-table-board` runs in parallel and rewrites `leads/page.tsx`: keep the list-page change
  to one import + one mounted component so the merge is trivial; whichever lands second
  re-mounts it on the rebuilt table (signal: a merge conflict on `leads/page.tsx`).
- The touch-log sheet lives inside `LeadTouches` today; lifting it for the action bar must keep
  the next-step pane flow intact (signal: saving a touch from the bar closes without offering
  the next step).
- The app-tier sheets restyled only where they render; if a sheet still pulls glass/spring
  styles from the app tier, leave it (the sweep is `retire-app-tier`) rather than widening.
- Keyboard handler collisions with the palette's ⌘K and with the board's `useBoardKeys`
  (signal: ⌘K or typing in the palette navigates leads).
