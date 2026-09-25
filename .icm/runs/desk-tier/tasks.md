# Tasks: desk-tier

The queue, with a definition of done per item. Ticked by the stage that finishes the item —
a human checkbox, never a script's. The definition of done is seeded from the spec's
acceptance criteria when the run is opened; the queue is Build's own, one line per commit-sized
step, so a resuming session can pick up the first unticked line.

## Definition of done

- [ ] `@jamie-nisbet/ui/desk.css` exists, is exported in `packages/ui/package.json` and listed in `files`, imports `tokens/desk.css`, and neither `styles.css` nor `tokens.css` imports either file.
- [ ] `pnpm --filter @jamie-nisbet/ui lint` compiles `desk.css` through a `check:css:desk` script, and CI's lint and typecheck jobs pass on the PR head.
- [ ] Every custom property in `tokens/desk.css` is prefixed `--desk-`, and every colour token is a `var()` of an existing semantic token — the file contains no hex, `rgb()` or raw ramp reference for colour.
- [ ] `tokens/desk.css` contains exactly one `@media (pointer: coarse)` block, which sets rows and controls to 44px and each type step to its touch value; no file under `packages/ui/src/components/desk/` contains a `pointer` or width media query or an arbitrary-value size class.
- [ ] `packages/ui/src/components/desk/` provides and the package barrel exports `RailItem`, `Pane`, `PaneHeader`, `PaneToolbar`, `ListRow`, `StatusDot`, `PriorityTag`, `Kbd`, `DeskSegmentedControl`, `DataGrid` (with its header, header-cell, row and cell parts), `CommandPalette` (with its input, group, item and empty parts) and `DeskButton`.
- [ ] No component under `components/desk/` contains a hex colour, `rgb()`, a raw ramp token or a `px` value in its classes; each is styled through `desk-*` utilities or semantic tokens only.
- [ ] `StatusDot` renders the five states (next, open, running, blocked, done) with an accessible text label for each; `PriorityTag` renders P0 / P1 / P2 per the spec and nothing for no priority; `RailItem`'s accessible name includes its badge count.
- [ ] `DataGridHeaderCell` for a sortable column is a button with `aria-sort`; `DeskSegmentedControl` is a `radiogroup` operable with arrow keys; `CommandPalette` is a dialog that traps focus and closes on Esc.
- [ ] `packages/ui/BRAND.md` has a § Desk tier naming it the admin's tier and recording D-1, D-3 and D-4 as scoped amendments, and the app-tier rules survive only as an "App tier (retiring)" subsection; `.claude/skills/design-dna/SKILL.md` names the desk tier for new admin work; `packages/ui/SKILL.md` and `packages/ui/README.md` list the new files.
- [ ] The PR diff touches no file under `websites/`, and no existing file in `packages/ui/tokens/`, `packages/ui/src/components/ui|brand|motion|app/`, `styles.css`, `tokens.css` or `app.css` — so the portfolio, the sellers site and the admin render exactly as before, and their Vercel builds pass.

## Queue

- [x] Tokens + entry: `packages/ui/tokens/desk.css`, `packages/ui/desk.css`, `package.json` (export, files, `check:css:desk`), `src/lib/utils.ts` (tailwind-merge knows the desk names)
- [x] Primitives + barrel: `packages/ui/src/components/desk/*`, `src/index.ts`
- [x] Docs: `BRAND.md` § Desk tier + App tier (retiring), `packages/ui/SKILL.md`, `packages/ui/README.md`, `.claude/skills/design-dna/SKILL.md`
- [x] Ready flip + full verdict (`ci-status.sh desk-tier` → GREEN on the post-flip head 931b24a, advisory Quality pass)
