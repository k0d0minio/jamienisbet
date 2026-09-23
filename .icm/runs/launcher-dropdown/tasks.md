# Tasks: launcher-dropdown

The queue, with a definition of done per item. Ticked by the stage that finishes the item —
a human checkbox, never a script's. The definition of done is seeded from the spec's
acceptance criteria when the run is opened; the queue is Build's own, one line per commit-sized
step, so a resuming session can pick up the first unticked line.

## Definition of done

- [ ] No file under `websites/admin-dashboard/components/` or `app/` names a launch tool — no
- [ ] An opened ticket shows a split button: the primary half reads "Start in Claude Code" (`Start in ${label}` of the default target) and
- [ ] Its chevron opens a menu listing "Claude Code" and "Claude Code (terminal)" in registry
- [ ] For a ticket whose prompt is past the cap, both menu entries render disabled with a one-line
- [ ] The triage, sweep, recut and estate-check rows still launch the default target on tap
- [ ] Swipe-right on a ticket row and on a batch row still opens the default target's URL.
- [ ] Adding a third target is proven to need no component change: the launch list and every menu
- [ ] `AppMenu` is exported from `packages/ui`, uses the tier's material, popover elevation and
- [ ] `websites/admin-dashboard/README.md` § Tickets carries the updated link table and the
- [ ] The stub is archived and, as the epic's last stub, `.icm/intake/session-launchers/` is moved
- [ ] CI's required checks are green.

## Queue

- [ ] <task — small enough for one commit; name the file or area>
