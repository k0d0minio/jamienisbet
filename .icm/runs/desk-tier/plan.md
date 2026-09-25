# Plan: desk-tier

Build's execution plan in passes — each pass one layer of the change, in the order it lands, so
a session that resumes mid-build sees where it is. Written by the advisor pass (Define, or
Build's first act on `sonnet` after reading the spec), executed pass by pass, and rewritten when
reality disagrees with it — never left describing a plan that was abandoned.

## Passes

1. **Tokens** — `packages/ui/tokens/desk.css`: every `--desk-*` token (colour aliases of semantic
   tokens, the seven type steps, sizes, radii, `--desk-shadow-float` with its dark value), then
   the single `@media (pointer: coarse)` block with the touch values — done when: the file has no
   hex/rgb/ramp colour, one coarse-pointer block, and every value in the spec's tables is present.
2. **Entry + package wiring** — `packages/ui/desk.css` (`@theme inline` mapping into
   `--font-desk`, `--text-desk-*`, `--spacing-desk-*`, `--radius-desk-*`, `--shadow-desk-float`,
   `--color-desk-*`; the `desk-tier` switch utility with its inset focus outline);
   `package.json` export `./desk.css`, `files`, `check:css:desk`, added to `lint` — done when:
   `pnpm --filter @jamie-nisbet/ui check:css:desk` compiles (CI's lint job reads it).
3. **Leaf primitives** — `components/desk/`: `status-dot.tsx`, `priority-tag.tsx`, `kbd.tsx`,
   `desk-button.tsx` (composes `ui/button`, no edit to it) — done when: they typecheck and use
   only `desk-*` / semantic utilities.
4. **Structural primitives** — `rail-item.tsx`, `pane.tsx` (`Pane`, `PaneHeader`,
   `PaneToolbar`), `list-row.tsx`, `segmented-control.tsx` (`DeskSegmentedControl`, radiogroup +
   arrow keys), `data-grid.tsx` (real `<table>`, sortable header cell with `aria-sort`) — done
   when: each matches its spec bullet's states and a11y line.
5. **Command palette shell** — `command-palette.tsx` on Radix Dialog (overlay, focus trap, Esc,
   focus return), input row, group, item, empty — no filtering, no shortcut — done when: it
   typechecks and renders from props alone.
6. **Barrel** — `src/index.ts` gains a "desk tier — opt-in" block exporting all of the above —
   done when: the names in acceptance criterion 5 all resolve from `@jamie-nisbet/ui`.
7. **Docs** — `BRAND.md` § Desk tier (five rules, inventory, touch step, D-1/D-3/D-4 amendments)
   with "App tier (retiring)" kept short; `packages/ui/SKILL.md`, `packages/ui/README.md`;
   `.claude/skills/design-dna/SKILL.md` — done when: a fresh session reading design-dna would
   build a new admin screen on the desk tier.
8. **Proof** — grep the diff: nothing under `websites/`, no edit to existing tokens, `styles.css`,
   `tokens.css`, `app.css` or `components/{ui,brand,motion,app}`; no raw colour or `px` in
   `components/desk/`; flip ready and read `ci-status.sh desk-tier` → GREEN (lint, typecheck,
   the three site builds).

## Risks

- **Tailwind namespace collision** — a `--text-desk-*` or `--spacing-desk-*` name that shadows a
  built-in or an `app-*` mapping; signal: `check:css:desk` or the admin build warns, or an app
  utility changes value. Keep every name `desk-`-prefixed.
- **Barrel side effects** — exporting desk components through the shared barrel pulls Radix
  Dialog into marketing bundles only if they import it; signal: a portfolio/sellers bundle-size
  jump on the Vercel preview. Tree-shaking should hold (`sideEffects` lists CSS only).
- **No preview surface** (operator's choice) — visual mistakes surface only in
  `shell-rail-palette`; keep the components minimal and faithful to the canvas sheet so that
  stub corrects values, not structure.
- **`DeskButton` over the shared `Button`** — the shared button's own height/padding classes may
  fight the desk sizes in `twMerge`; signal: a 36px button. Override through `cn()` with the desk
  size classes last, or render the desk variants directly with `buttonVariants` untouched.
