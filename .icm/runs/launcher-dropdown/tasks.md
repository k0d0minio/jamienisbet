# Tasks: launcher-dropdown

The queue, with a definition of done per item. Ticked by the stage that finishes the item —
a human checkbox, never a script's. The definition of done is seeded from the spec's
acceptance criteria when the run is opened; the queue is Build's own, one line per commit-sized
step, so a resuming session can pick up the first unticked line.

## Definition of done

- [x] No file under `websites/admin-dashboard/components/` or `app/` names a launch tool — no
- [x] An opened ticket shows a split button: the primary half reads "Start in Claude Code" (`Start in ${label}` of the default target) and
- [x] Its chevron opens a menu listing "Claude Code" and "Claude Code (terminal)" in registry
- [x] For a ticket whose prompt is past the cap, both menu entries render disabled with a one-line
- [x] The triage, sweep, recut and estate-check rows still launch the default target on tap
- [x] Swipe-right on a ticket row and on a batch row still opens the default target's URL.
- [x] Adding a third target is proven to need no component change: the launch list and every menu
- [x] `AppMenu` is exported from `packages/ui`, uses the tier's material, popover elevation and
- [x] `websites/admin-dashboard/README.md` § Tickets carries the updated link table and the
- [x] The stub is archived and, as the epic's last stub, `.icm/intake/session-launchers/` is moved
- [ ] CI's required checks are green.

## Queue

- [x] Launch list in the registry (`lib/launchers/index.ts`: `Launch`, `launchesFor`, `primaryLaunch`, `launchLinkProps`) and `lib/tickets.ts` (`launchesForTicket`, `pickupBody`, maintenance/recut/estate-check as `Launch[]`)
- [x] `AppMenu` in `packages/ui/src/components/app/menu.tsx`, exported, documented in `BRAND.md`
- [x] `components/launch-menu.tsx` (split button + row accessory); `ticket-detail`, `batch-row`, `repo-maintenance`, tickets page rewired
- [x] README § Tickets: target table + "Add a launch target" recipe
- [x] Epic archived to `.icm/intake/_done/session-launchers/`
- [ ] CI GREEN (cheap tier), ready flip, full gate GREEN
