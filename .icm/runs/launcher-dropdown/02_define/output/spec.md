# Spec: Turn "Start in Claude Code" into a tool dropdown

- slug: launcher-dropdown
- personas: operator
- touches: packages/ui/src/components/app, packages/ui/src/index.ts, packages/ui/BRAND.md, websites/admin-dashboard/lib/launchers, websites/admin-dashboard/lib/tickets.ts, websites/admin-dashboard/components/ticket-detail.tsx, websites/admin-dashboard/components/batch-row.tsx, websites/admin-dashboard/components/board-ticket-row.tsx, websites/admin-dashboard/components/repo-maintenance.tsx, websites/admin-dashboard/app/(app)/tickets/page.tsx, websites/admin-dashboard/README.md
- complexity: standard

## Problem

The Tickets board's launch UI still names Claude: a hard-coded "Start in Claude Code" button, a
separate quiet "Open in terminal" link, and `lib/tickets.ts` exporting `claudeSessionUrl` /
`claudeTerminalUrl` wrappers that the page calls by name. The registry landed in
`launcher-registry` and the model/effort hint in `model-effort-preselect`, but a new tool would
still need component edits at every call site. This is the last stub of the session-launchers
epic, whose aim is that adding Codex, opencode, Hermes or any other tool is one
`lib/launchers/<tool>.ts` plus one registry line (breakdown decisions 1 and 5).

## Proposed change

1. **One target-aware launch call.** `lib/tickets.ts` replaces `claudeSessionUrl` and
   `claudeTerminalUrl` with one function returning, for every registered target in registry order,
   `{ target, url, hint, unavailableReason }` — `url` null exactly when `unavailableReason` is set.
   The maintenance (triage, sweep), recut and estate-check launchers return the same list shape.
   Where a target cannot carry the hint, its link's prompt opens with the recommendation line in
   **that target's** vocabulary (`withHintLine(target.id, …)`), not the default target's; a verb
   pick-up stays untouched, as today. Repo preselection and `mode=code` are unchanged (decisions
   4 and 6): for the default target every emitted URL is byte-identical to today's.
2. **A new `AppMenu` in `packages/ui` (app tier).** An action menu built on Radix DropdownMenu,
   styled like `AppSelect`'s content — the material with popover elevation and 44px rows —
   supporting a per-item secondary line and a disabled item with its reason. Exported from the
   package and documented in `BRAND.md` beside `AppSelect`. No tokens forked.
3. **A split launch button** (admin-dashboard component) fed only by the launch list: the primary
   half launches the default target with the label "Start in Claude Code" taken from the registry
   (the component itself names no tool); the chevron half opens `AppMenu` listing every target by
   its registry `label`, each with its model/effort recommendation (`hintLabel`) where the target
   cannot carry it. A target that cannot express the launch renders **disabled with its one-line
   reason**, never hidden. Used in `ticket-detail.tsx` (which also covers the batch sheet's
   expanded rows and the now-strip peek); the separate "Open in terminal" link is removed and
   folded into the menu. "Copy prompt" / "Copy pick-up" stays where it is.
4. **Menus on the list-row launchers too.** The repo maintenance rows (triage, sweep), the batch
   sheet's "Recut this batch" row and the board's "Estate check" row keep tapping through to the
   default target, and gain a trailing menu control that opens the same `AppMenu` of targets.
5. **Swipe unchanged.** Swipe-right on a ticket row (`board-ticket-row.tsx`) and on a batch row
   (`batch-row.tsx`, the next stub) still launches the default target.
6. **README § Tickets:** the link table re-worded around targets (the terminal link is now a menu
   entry), and a short "Add a launch target" recipe: one `lib/launchers/<tool>.ts` citing that
   tool's documented link shape, one line in `LAUNCH_TARGETS`, zero component changes.

## Acceptance criteria

- [ ] No file under `websites/admin-dashboard/components/` or `app/` names a launch tool — no
      "Claude"/"terminal" literal in launch UI and no `claude*Url` import; `claudeSessionUrl` and
      `claudeTerminalUrl` no longer exist in `lib/tickets.ts`.
- [ ] An opened ticket shows a split button: the primary half reads "Start in Claude Code" (`Start in ${label}` of the default target) and
      opens the same `claude.ai/code/new?q=…&repo=owner%2Fname&mode=code` URL as before this change.
- [ ] Its chevron opens a menu listing "Claude Code" and "Claude Code (terminal)" in registry
      order, each with its recommendation (e.g. "Opus · high") where the ticket has a hint; the
      terminal entry opens `claude-cli://open?repo=owner/name&q=…`, and no separate "Open in
      terminal" link remains.
- [ ] For a ticket whose prompt is past the cap, both menu entries render disabled with a one-line
      reason, the primary half is disabled or absent with the same reason shown, and "Copy prompt"
      still works.
- [ ] The triage, sweep, recut and estate-check rows still launch the default target on tap
      (URLs unchanged) and each has a menu control listing every target.
- [ ] Swipe-right on a ticket row and on a batch row still opens the default target's URL.
- [ ] Adding a third target is proven to need no component change: the launch list and every menu
      are built by iterating `LAUNCH_TARGETS`, with no per-target branch outside `lib/launchers/`.
- [ ] `AppMenu` is exported from `packages/ui`, uses the tier's material, popover elevation and
      44px rows, is keyboard-operable (Radix), and is documented in `packages/ui/BRAND.md`.
- [ ] `websites/admin-dashboard/README.md` § Tickets carries the updated link table and the
      "Add a launch target" recipe.
- [ ] The stub is archived and, as the epic's last stub, `.icm/intake/session-launchers/` is moved
      to `.icm/intake/_done/session-launchers/` in this PR.
- [ ] CI's required checks are green.

## Out of scope

- Any new tool target (Codex, opencode, Hermes, …) — each is a future triage stub citing that
  tool's documented link shape (decision 5).
- Persisting the last-picked tool; the default target stays the registry's first.
- Changing the swipe gestures to anything but the default target.
- Any change to the hint rule, the prompt cap, or the link parameters (`mode`, `repo`).

## Open questions

- none
