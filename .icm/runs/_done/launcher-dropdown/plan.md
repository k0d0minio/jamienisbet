# Plan: launcher-dropdown

Build's execution plan in passes — each pass one layer of the change, in the order it lands, so
a session that resumes mid-build sees where it is. Written by the advisor pass (Define, or
Build's first act on `sonnet` after reading the spec), executed pass by pass, and rewritten when
reality disagrees with it — never left describing a plan that was abandoned.

## Passes

1. **Launch list in the data layer** — `websites/admin-dashboard/lib/launchers/` (a helper that
   iterates `LAUNCH_TARGETS` and returns `{ target, url, hint, unavailableReason }[]`, applying
   `withHintLine(target.id, …)` per target to a prompt-body pick-up; the reason string for a
   past-cap prompt lives here, not in a component) and `lib/tickets.ts` (`claudeSessionUrl` /
   `claudeTerminalUrl` replaced by one `launchesForTicket(ticket)`; `repoMaintenanceLaunchers`,
   `recutSessionUrl`, `estateCheckSessionUrl` return the same list; `Ticket` keeps the raw
   pick-up alongside the default-target one so per-target hint lines are possible) — done when:
   for the default target every URL equals today's string (compare against the `main` build).
2. **`AppMenu` in `packages/ui`** — `src/components/app/menu.tsx` on `radix-ui`'s DropdownMenu,
   content styled exactly as `AppSelectContent` (read `select.tsx` and reuse its classes/material),
   item with a secondary line, disabled item with a reason; export from `src/index.ts`; a bullet in
   `BRAND.md` beside `AppSelect` — done when: exported and documented.
3. **Split button + list-row menu control** — a `LaunchButton` (split) and a trailing menu control
   for `GroupedRow` launchers in `websites/admin-dashboard/components/`, both taking the launch
   list only; `ticket-detail.tsx` uses the split button (terminal link removed, Copy stays,
   "Recommended" line keyed off the default entry); `repo-maintenance.tsx`, the batch sheet's
   Recut row and the page's Estate check row gain the menu control; `page.tsx` passes launch lists
   instead of URLs; swipes read the default entry's `url` — done when: `grep -rn -i 'claude'` over
   `components/` and `app/` finds no launch-tool literal.
4. **README § Tickets** — link table around targets, "Add a launch target" recipe — done when the
   recipe names the file, the registry line, and the doc-citation rule.
5. **Epic archive** — `git mv .icm/intake/session-launchers .icm/intake/_done/session-launchers`
   (the stub is already in its `_done/`) — done when `ls .icm/intake/` no longer lists it.

## Risks

- Byte-identity regresses for the default target if the hint line is re-applied per target on an
  already-hinted pick-up (double "Recommended:" line) — signal: a prompt link whose `q` starts
  with two recommendation lines. Keep one raw pick-up and apply the line once per target.
- `GroupedRow` may not accept a trailing control beside its `href` without nesting interactive
  elements (`<a>` inside `<a>`) — signal: a hydration warning or the menu tap also navigating.
  Put the control as a sibling, not a child of the link.
- A Radix menu inside a Sheet (batch sheet) can fight focus trapping — signal: the menu closes the
  sheet or can't be reached by keyboard.
