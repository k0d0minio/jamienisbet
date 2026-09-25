# Build notes: desk-tier

- commits: `feat: desk-tier — tokens and entry stylesheet` · `feat: desk-tier — primitives` · `docs: desk-tier — BRAND, design-dna, package docs`
- ci: pending the ready flip (see status.md)

## What changed

- `packages/ui/tokens/desk.css` (new): the `--desk-*` tokens — colour aliases of semantic tokens only, the seven-step dense type scale, sizes, 4/6/8px radii, `--desk-shadow-float` (= `--shadow-xl`), and the single `@media (pointer: coarse)` block with the touch values.
- `packages/ui/desk.css` (new): `@theme inline` mapping into `--font-desk`, `--text-desk-*` (with line-height, weight, tracking), `--tracking-desk-eyebrow`, `--spacing-desk-*`, `--radius-desk-*`, `--shadow-desk-float`, `--color-desk-*`; the `desk-tier` switch utility with an inset focus outline.
- `packages/ui/package.json`: `./desk.css` export, `files`, `check:css:desk` in `lint`.
- `packages/ui/src/lib/utils.ts`: tailwind-merge learns the desk names (D-24).
- `packages/ui/src/components/desk/` (new): `RailItem`, `Pane`/`PaneHeader`/`PaneToolbar`/`PaneBody`, `ListRow`, `StatusDot`, `PriorityTag`, `Kbd`, `DeskSegmentedControl`, `DataGrid` + parts, `CommandPalette` + parts, `DeskButton`; exported from `src/index.ts` under a "desk tier — opt-in" block.
- `packages/ui/BRAND.md`: § App tier rewritten as § Desk tier (five rules, D-1/D-3/D-4 amendments, the type table, the inventory) with a short § App tier (retiring); cross-references in Visual foundations and the manifest updated.
- `packages/ui/SKILL.md`, `packages/ui/README.md`: the desk files, a Desk tier usage section with its utility table and an example.
- `.claude/skills/design-dna/SKILL.md`: the desk tier is the admin's tier for new work; the app tier marked retiring; checklist lines for both.

## Acceptance criteria status

- [x] `desk.css` exists, exported and in `files`, imports `tokens/desk.css`; `styles.css` / `tokens.css` import neither (grep).
- [ ] `check:css:desk` in `lint` — wired; CI's lint and typecheck on the ready head are the proof (pending).
- [x] Every custom property in `tokens/desk.css` is `--desk-*`; colours are `var()` of semantic tokens; no hex / rgb / ramp (grep).
- [x] Exactly one `@media (pointer: coarse)` block; no pointer or width query and no arbitrary size class in `components/desk/` (grep — the only "pointer" hits are `cursor-pointer`).
- [x] All named primitives present and exported (plus `PaneBody`, `DataGridBody`).
- [x] No hex / rgb / ramp / arbitrary px in component classes; the open dot's 1.5px ring is the token `--desk-dot-ring`, reached as `border-(length:--desk-dot-ring)`.
- [x] StatusDot five states with spoken labels; PriorityTag P0/P1/P2 and null otherwise; RailItem's name carries the count.
- [x] Sortable header: a button inside a `<th aria-sort>` (D-25); segmented control is a `radiogroup` with arrow/Home/End keys; the palette is a Radix Dialog (focus trap, Esc, focus return).
- [x] BRAND.md § Desk tier + "App tier (retiring)"; design-dna, SKILL.md, README.md updated.
- [x] No file under `websites/` and no existing token / style / component file touched (git diff) — Vercel previews on the ready head are the render proof (pending).

## Notes for Release

- No local typecheck or CSS compile was run (CI is the verdict; no `node_modules` in the session). The riskiest lines for the typecheck: the `extendTailwindMerge` `theme` extension in `utils.ts`, `DeskButton` passing `variant={null} size={null}` to the shared `Button`, and the generic `DeskSegmentedControl<T>`.
- The CSS risks: `--text-desk-*--font-weight` (Tailwind v4 text-step weight), `border-(length:--desk-dot-ring)`, `not-last:border-r`, `[tbody>&]:hover:`. `check:css:desk` compiles the entry alone, like `check:css:app`, so a utility that fails to generate only shows at first use.
- Nothing renders the primitives until `shell-rail-palette` (D-23): review the component source against the canvas sheet rather than a preview.
- `utils.ts` was outside `touches:` (D-24) — additive, no existing name changed.
