# Build notes: launcher-dropdown

- commits: feat: launcher-dropdown — tool menu from the launcher registry · feat: launcher-dropdown — copy-first, terminal parked
- ci: GREEN (full gate) on aaa5c79

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

## Revision rework (2026-09-23, after the operator's smoke: terminal link opened nothing)

- `lib/launchers/types.ts` + `claude-terminal.ts`: optional `parked` field on `LaunchTarget`;
  the terminal target is parked "Not working yet". `launchesFor` lists a parked target with its
  reason and no link.
- `lib/tickets.ts`: maintenance / recut / estate-check return a `LaunchSet` — the prompt to copy
  (default target's vocabulary) plus the `Launch[]`; the past-cap guard now checks every target.
- `components/launch-menu.tsx`: `CopySplitButton` (primary half copies, chevron menu) replaces
  `LaunchButton`; `CopyLaunchRow` (tap copies, trailing `…` menu) replaces the link rows.
- `ticket-detail.tsx`: one split button — the standalone Copy button is gone.
- `board-ticket-row.tsx`, `batch-row.tsx`: swipe-right copies (ticket pick-up / next stub's);
  `openSession` removed.
- `.icm/intake/triage/claude-terminal-link-opens-nothing.md`: the parked fix, lane bug.
- README § Tickets: copy-first, target table with a State column, parking in the recipe.

## Acceptance criteria status

- [x] No component/app file names a launch tool (grep over `components/` and the tickets route
      is empty).
- [x] One split button; primary half "Copy prompt" / "Copy pick-up" copies `ticket.pickup`.
- [x] Chevron menu: Claude Code (same URL, with its recommendation), Claude Code (terminal)
      disabled "Not working yet", no link.
- [x] Parking is one field in `claude-terminal.ts`.
- [x] Past the cap: entries disabled with the reason; Copy unaffected.
- [x] Triage, sweep, recut, estate check copy on tap with a toast, and carry the menu.
- [x] Swipe-right copies on ticket and batch rows; no tab opens.
- [x] Menus iterate `LAUNCH_TARGETS`; no per-target branch outside `lib/launchers/`.
- [x] `AppMenu` exported and documented.
- [x] Triage bug stub parked.
- [x] README updated.
- [x] Epic archived.
- [x] CI green — see the ci line.

## Notes for Release

- `packages/ui` gained a component; the portfolio/sellers-site builds re-run but nothing there
  consumes it.
- A Radix menu opens inside two Sheets (the batch sheet, the maintenance sheet): the menu should
  open over the sheet and Escape should close the menu first.
- The swipe-left trays still carry their own Copy — now the same action as swipe-right. Left as
  is (spec: out of scope).

## Release

- gate: Ready to merge ticked — merge authorised
- ci: GREEN on 294b304 (ci-status.sh, full gate); re-read after the last push
- reviews: code medium — no findings · security security-check.sh --branch --audit: OK · /security-review n/a — no auth, payments, PII or route policy touched · /production-readiness n/a — no DB, auth, payments or env vars · readiness env.sh audit --changed: OK
- parked: claude-terminal-link-opens-nothing.md (in Build, per the revised spec)
- migrations: skip — none of this run's own
- learned: skip — no error.log (FAILURE.md adds 1 rule through close-out)
- docs: websites/admin-dashboard/README.md § Tickets, packages/ui/BRAND.md (in Build) · announce: public
