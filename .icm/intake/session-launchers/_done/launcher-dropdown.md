# Stub: Turn "Start in Claude Code" into a tool dropdown

- feature-slug: launcher-dropdown
- sequence: 3 of 3
- depends-on: launcher-registry, model-effort-preselect
- size: S

## What this is

The UI stops naming Claude. The start action becomes a split button: the primary half
launches the default target (`claude-web`, label unchanged: "Start in Claude Code"); the
chevron opens a menu rendered **from the registry** — today Claude Code (web) and Claude
Code (terminal), which folds the quiet "Open in terminal" link into the menu. Each entry
shows its model/effort recommendation where it has one. A target that can't express this
launch (prompt past its cap, a capability it lacks) renders disabled with a one-line
reason, not hidden. Swipe-right on a row keeps launching the default target.

`lib/tickets.ts` swaps the `claude*Url` wrappers from stub 1 for one target-aware call
(e.g. `launchesForTicket(ticket) → { target, url, hint, unavailableReason }[]`), and the
maintenance / recut / estate-check buttons use the same shape.

The point of the stub is the seam: **adding Codex, opencode, Hermes or anything else must
be one new `lib/launchers/<tool>.ts` + one registry line, with zero component changes.**
Document that recipe in the README. Building any of those tools is out of scope — each
gets its own triage stub later, citing that tool's documented link shape.

No persistence of the last-picked tool in this stub.

## Prompt

In this repo, replace the admin dashboard's hard-coded "Start in Claude Code" button
with a split button whose menu lists every registered launch target. Read this stub
first — `.icm/intake/session-launchers/launcher-dropdown.md` — then
`.icm/intake/session-launchers/breakdown.md`, `websites/admin-dashboard/lib/launchers/`,
and `.claude/skills/design-dna/SKILL.md` (this is UI work: use `packages/ui`
components, match the app tier). Confirm `launcher-registry` and
`model-effort-preselect` have merged first.

1. Replace the `claude*Url` wrappers in `websites/admin-dashboard/lib/tickets.ts` with
   one target-aware function returning, per registered target, its URL (or why it's
   unavailable) and its hint. Move the maintenance / recut / estate-check launchers onto
   the same shape.
2. Build the split button and use it in `components/ticket-detail.tsx` and the batch
   sheet (`components/batch-row.tsx`); fold the separate terminal link into the menu.
   Keep "Copy prompt" where it is. Keep swipe-right on the default target
   (`components/board-ticket-row.tsx`).
3. Render menu entries from the registry only — no component may name a tool.
4. Update `websites/admin-dashboard/README.md` § Tickets: the link table and a short
   "Add a launch target" recipe (one file, one registry line, cite the tool's doc).

Don't run build/lint/typecheck locally — CI is the source of truth. Ship on a `claude/`
branch through a PR, and in that PR `git mv` this stub to
`.icm/intake/session-launchers/_done/` — and, since it's the last stub, archive the epic
with `git mv .icm/intake/session-launchers .icm/intake/_done/session-launchers`.
