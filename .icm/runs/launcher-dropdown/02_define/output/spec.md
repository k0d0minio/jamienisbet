# Spec: Turn "Start in Claude Code" into a tool dropdown

- slug: launcher-dropdown
- personas: operator
- touches: .icm/intake/triage, packages/ui/src/components/app, packages/ui/src/index.ts, packages/ui/BRAND.md, websites/admin-dashboard/lib/launchers, websites/admin-dashboard/lib/tickets.ts, websites/admin-dashboard/components/ticket-detail.tsx, websites/admin-dashboard/components/batch-row.tsx, websites/admin-dashboard/components/board-ticket-row.tsx, websites/admin-dashboard/components/repo-maintenance.tsx, websites/admin-dashboard/app/(app)/tickets/page.tsx, websites/admin-dashboard/README.md
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
   The maintenance (triage, sweep), recut and estate-check launchers return the same list shape
   plus the prompt text they copy. Where a target cannot carry the hint, its link's prompt opens
   with the recommendation line in **that target's** vocabulary (`withHintLine(target.id, …)`); a
   verb pick-up stays untouched, as today. Repo preselection and `mode=code` are unchanged
   (decisions 4 and 6): every URL the web target emits is byte-identical to today's.
2. **A new `AppMenu` in `packages/ui` (app tier).** An action menu built on Radix DropdownMenu,
   styled like `AppSelect`'s content — the material with popover elevation and 44px rows —
   supporting a per-item secondary line and a disabled item with its reason. Exported from the
   package and documented in `BRAND.md` beside `AppSelect`. No tokens forked.
3. **Copy is the default action; tools live in the menu** (revised 2026-09-23 — the terminal
   link opened nothing when smoke-tested, so no tool link is the default until each is proven).
   On an opened ticket, a split button replaces both the old start button and the standalone
   Copy button: the primary half is **Copy prompt** (or **Copy pick-up** for a verb) and copies
   exactly what Copy copied before (`ticket.pickup`); the chevron opens `AppMenu` listing every
   registered target by its registry `label`, each with its model/effort recommendation where
   the target cannot carry it. The component names no tool. The "Open in terminal" link is gone.
4. **A registry-level "parked" state.** A target can be marked parked in its own file with a
   one-line reason; it stays in the menu, **disabled with that reason**, and emits no link. The
   terminal target (`claude-cli://`) is parked now with "Not working yet". A target that cannot
   express one launch (a prompt past its cap) is disabled the same way with its own reason —
   never hidden.
5. **Rows and swipes copy too.** The repo maintenance rows (triage, sweep), the batch sheet's
   "Recut this batch" row and the board's "Estate check" row copy their prompt on tap and carry
   a trailing menu control that opens the same `AppMenu` of targets. Swipe-right on a ticket row
   (`board-ticket-row.tsx`) copies its pick-up; swipe-right on a batch row (`batch-row.tsx`)
   copies the next stub's pick-up. The copied text is the default target's version (the
   recommendation line in its vocabulary, for a prompt body), the same text Copy gave before.
6. **A triage stub** parks the terminal fix: `.icm/intake/triage/<slug>.md`, lane `bug`, naming
   what was seen (the menu entry opened nothing) and that un-parking it is the fix's last step.
7. **README § Tickets:** the target table and the controls re-worded around copy-first (the
   terminal target listed as parked), and a short "Add a launch target" recipe: one
   `lib/launchers/<tool>.ts` citing that tool's documented link shape, one line in
   `LAUNCH_TARGETS`, zero component changes; parking/un-parking is a field on the target.

## Acceptance criteria

- [ ] No file under `websites/admin-dashboard/components/` or `app/` names a launch tool — no
      "Claude"/"terminal" literal in launch UI and no `claude*Url` import; `claudeSessionUrl` and
      `claudeTerminalUrl` no longer exist in `lib/tickets.ts`.
- [ ] An opened ticket shows one split button whose primary half reads "Copy prompt" (or "Copy
      pick-up" for a verb) and copies the same text the old Copy button copied; there is no
      separate Copy button and no "Start in …" button.
- [ ] Its chevron opens a menu listing "Claude Code" and "Claude Code (terminal)" in registry
      order; "Claude Code" opens the same `claude.ai/code/new?q=…&repo=owner%2Fname&mode=code`
      URL as before, with its recommendation (e.g. "Opus · high") where the ticket has a hint;
      "Claude Code (terminal)" is disabled with "Not working yet" and has no link.
- [ ] Parking is data: the terminal target's file carries the parked reason, and removing that
      one field re-enables it with no other change.
- [ ] For a ticket whose prompt is past the cap, every menu entry is disabled with a one-line
      reason and the primary Copy still works.
- [ ] Tapping the triage, sweep, recut or estate-check row copies its prompt (with a toast), and
      each row has a menu control listing every target; the web entry's URL is unchanged.
- [ ] Swipe-right on a ticket row copies its pick-up, and on a batch row copies the next stub's
      pick-up; neither opens a tab.
- [ ] Adding a third target is proven to need no component change: the launch list and every menu
      are built by iterating `LAUNCH_TARGETS`, with no per-target branch outside `lib/launchers/`.
- [ ] `AppMenu` is exported from `packages/ui`, uses the tier's material, popover elevation and
      44px rows, is keyboard-operable (Radix), and is documented in `packages/ui/BRAND.md`.
- [ ] A triage `bug` stub for the terminal target exists in `.icm/intake/triage/`.
- [ ] `websites/admin-dashboard/README.md` § Tickets describes copy-first, lists the terminal
      target as parked, and carries the "Add a launch target" recipe.
- [ ] The stub is archived and, as the epic's last stub, `.icm/intake/session-launchers/` is moved
      to `.icm/intake/_done/session-launchers/` in this PR.
- [ ] CI's required checks are green.

## Out of scope

- Fixing the terminal target — the triage stub carries it.
- Any new tool target (Codex, opencode, Hermes, …) — each is a future triage stub citing that
  tool's documented link shape (decision 5).
- Persisting the last-picked tool.
- The swipe-left trays: their Copy / GitHub / client actions stay as they are.
- Any change to the hint rule, the prompt cap, or the link parameters (`mode`, `repo`).

## Open questions

- none
