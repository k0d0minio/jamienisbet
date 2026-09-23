# Build notes: launcher-dropdown

- commits: feat: launcher-dropdown — tool menu from the launcher registry
- ci: pending

## What changed

- `packages/ui/src/components/app/menu.tsx` (new) + `src/index.ts` + `BRAND.md`: `AppMenu` —
  Radix DropdownMenu on `AppSelectContent`'s surface (material, popover elevation, 44px rows),
  with an item `description` and dimmed disabled rows.
- `websites/admin-dashboard/lib/launchers/index.ts`: `Launch` (plain, serializable),
  `launchesFor` (iterates `LAUNCH_TARGETS`, applies the recommendation line per target in its
  own vocabulary), `primaryLaunch`, `launchLinkProps` (new tab for `web`, in place otherwise),
  `PROMPT_TOO_LONG`.
- `lib/tickets.ts`: `claudeSessionUrl` / `claudeTerminalUrl` → `launchesForTicket`;
  `Ticket.pickupBody` (the pick-up before the recommendation line, so each target re-hints it);
  `MaintenanceLauncher.url` → `launches`; `recutSessionUrl` → `recutLaunches`;
  `estateCheckSessionUrl` → `estateCheckLaunches`. Default-target URLs are built from the same
  inputs as before (`withHintLine(default, body, hint)` for prompt bodies, raw verbs), so they
  are byte-identical.
- `components/launch-menu.tsx` (new): `LaunchButton` (split: primary half + chevron menu) and
  `LaunchMenuAccessory` (a row's trailing `…`). Both render from `Launch[]` only.
- `components/ticket-detail.tsx`: split button replaces the button + terminal link; the
  "Recommended" line and the too-long reason come from the default entry.
- `components/batch-row.tsx`, `repo-maintenance.tsx`, `app/(app)/tickets/page.tsx`: recut,
  triage/sweep and estate-check rows keep tapping the default and gain the menu accessory;
  swipes read the default entry's URL. Copy no longer names a tool.
- `README.md` § Tickets: target table, how the controls read the list, "Add a launch target".
- `.icm/intake/session-launchers/` → `.icm/intake/_done/session-launchers/` (last stub).

## Acceptance criteria status

- [x] No component/app file names a launch tool — `grep -rni 'claude\|terminal'` over
      `components/` and `app/(app)/tickets` is empty; the wrappers are gone.
- [x] Split button, primary "Start in {label}" = "Start in Claude Code", same URL.
- [x] Chevron menu lists both targets in registry order with "Recommended …" per entry; terminal
      link folded in.
- [x] Past the cap: every entry disabled with "Too long for a link — copy it into a new
      session", primary half disabled, the reason beside it, Copy prompt unchanged.
- [x] Triage, sweep, recut, estate check tap the default and carry the menu.
- [x] Swipes unchanged (default entry's URL).
- [x] Menus and lists iterate `LAUNCH_TARGETS`; no per-target branch outside `lib/launchers/`
      (the only surface-dependent choice, new tab vs in place, lives in `launchLinkProps`).
- [x] `AppMenu` exported and documented.
- [x] README updated.
- [x] Epic archived.
- [ ] CI green — see the ci line.

## Notes for Release

- `packages/ui` gained a component; the portfolio/sellers-site builds re-run but nothing there
  consumes it.
- A Radix menu opens inside two Sheets (the batch sheet, the maintenance sheet) — worth a look in
  the preview on a phone: the menu should open over the sheet and Escape should close the menu
  first, not the sheet.
