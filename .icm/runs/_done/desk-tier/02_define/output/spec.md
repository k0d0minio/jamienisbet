# Spec: The desk tier: tokens and primitives

- slug: desk-tier
- personas: operator
- touches: packages/ui/tokens/desk.css, packages/ui/desk.css, packages/ui/src/components/desk, packages/ui/src/index.ts, packages/ui/package.json, packages/ui/BRAND.md, packages/ui/SKILL.md, packages/ui/README.md, .claude/skills/design-dna/SKILL.md
- complexity: complex

## Problem

The admin runs on the app tier — translucent materials, springs, the system font and 17px iOS
type — an idiom built for a phone and stretched to the desk, where it wastes width and hides the
work. The `admin-cockpit-redesign` scope (initiative: operator cockpit; objective: less time
finding work, more time launching it) replaces it with a dense, flat work tool designed at the
desk and compressed for the phone (D-1, D-3). Every screen stub in the scope builds on a design
system for that, and there is none yet: this stub (2 of 11) adds it to `packages/ui` without
switching any screen over.

## Proposed change

A **desk tier** in `@jamie-nisbet/ui`, beside the marketing tier and the app tier, opt-in exactly
the way the app tier is: an entry stylesheet `@jamie-nisbet/ui/desk.css`, linked after
`styles.css`, never imported by `styles.css` or `tokens.css`. The canvas's design-system sheet
("Desk — the design system", https://claude.ai/artifact/EtnAmedYSgzwYG2jNKB3bC) is the visual
reference throughout.

**1. Tokens — `packages/ui/tokens/desk.css`** (variables only, all prefixed `--desk-*`, so the
admin can link it alongside `app.css` during the migration without a name collision):

- **Colour** — no new hue and no raw value. Every desk colour token is an alias of an existing
  semantic token (`--surface`, `--surface-2`, `--surface-sunken`, `--border`, `--border-strong`,
  `--text-1/2/3`, `--primary`, `--primary-fg`, `--success`, `--warning`, `--danger` and their
  `-soft` twins), so dark mode flips through the existing `[data-theme="dark"]` block and the
  file carries no dark block of its own for colour. (D-3; the brand ramp is untouched.)
- **Type** (D-4) — UI text in Hanken Grotesk (`--font-sans`, already loaded by `styles.css`),
  figures and metadata in IBM Plex Mono (`--font-mono`). Each step carries size / line-height /
  weight, desk → touch:

  | Step | Desk | Touch | Face |
  | --- | --- | --- | --- |
  | title | 22/28 · 700 · −0.02em | 28/34 | sans |
  | heading | 15/20 · 600 | 17/22 | sans |
  | body (reading) | 14/22 · 400 | 16/24 | sans |
  | ui (rows, labels, controls) | 13/18 · 500 | 15/20 | sans |
  | meta | 12/16 · 400 | 13/18 | mono |
  | micro (key hints, priority tags, eyebrows, table headers) | 11/14 · 500 | 12/16 | mono |
  | figure | 20/26 · 500 | 22/28 | mono, tabular |

- **Size** — desk row 32px / touch 44px; desk control 30px / touch 44px; small control 26px / touch 44px; data-grid body row 40px
  / touch 48px; data-grid header row 32px / touch 44px; rail 56px wide with 40px items (44px on
  touch); pane header 56px; secondary toolbar 44px.
- **Shape** — radius 6px (controls, rows, rail items) and 8px (panes, cards, palette, menu);
  hairlines are 1px `--border`; a key hint's bottom edge is 2px `--border-strong`.
- **Elevation** — one token, `--desk-shadow-float`, and only the palette, a menu and a sheet
  use it (D-3: a shadow only on what floats); it has a dark value like the brand shadows.
- **Motion** — none of the app tier's springs: state changes are instant, or a plain
  ≤120ms opacity/colour transition that the brand's reduced-motion reset removes.
- **The touch step is built into the tokens.** One `@media (pointer: coarse)` block in
  `tokens/desk.css` redefines the size and type tokens to their touch values; no component
  carries a pointer or breakpoint query of its own. A touch-primary device (a phone, an iPad
  without a trackpad) therefore gets 44px rows and controls from the same markup. Where the desk
  *layout* starts is `shell-rail-palette`'s call, not this stub's.

**2. Entry — `packages/ui/desk.css`**, the twin of `app.css`: imports `tokens/desk.css` and maps
every token into Tailwind's theme namespaces with `@theme inline` (`--font-desk`,
`--text-desk-*` with its line-height and tracking, `--spacing-desk-*`, `--radius-desk-*`,
`--shadow-desk-float`, `--color-desk-*`), so call sites write `h-desk-row`, `text-desk-ui`,
`rounded-desk-control`, `bg-desk-sunken` and never a number. It defines one switch utility,
`desk-tier`, applied once at an app root: font, base UI size, text colour, canvas background,
antialiasing, and a focus-visible outline drawn inside the control (as `app-tier` does, so a
clipping pane cannot hide it). It never imports Tailwind. `package.json` exports `./desk.css`,
lists it in `files`, and gains a `check:css:desk` script that `lint` runs, so CI compiles it.

**3. Primitives — `packages/ui/src/components/desk/`**, exported from the package barrel under a
"desk tier — opt-in" heading like the app tier's, inert unless the surface links `desk.css`.
Each is a thin, typed React component styled only through desk utilities; names are prefixed
`Desk` where they would collide with an existing export:

- **`RailItem`** — an icon-only nav link/button for the 56px rail: 18px lucide icon, active
  state (sunken fill, primary text) exposed as `aria-current="page"`, an optional count
  **badge** (mono micro, primary fill, hidden at 0, "99+" above 99) whose count is part of the
  accessible name ("Inbox, 9 waiting"), and a tooltip-style `title`.
- **`Pane`** and **`PaneHeader`** — a flat pane separated by hairlines (no card, no shadow);
  the header is 56px with a title slot (heading step), a meta slot (mono) and a trailing actions
  slot. `PaneToolbar` is the 44px secondary strip under it.
- **`ListRow`** — a 32px / 44px row: leading slot (status dot or icon), a label that truncates
  with an ellipsis, trailing meta slots (mono), a hairline under it. States: rest, hover
  (`--surface-2`), selected (sunken fill + 600 weight, `aria-selected`), done (text-3 with a
  struck label), focus-visible. Renders as a link or a button when given `href` / `onClick`.
- **`StatusDot`** — `next` (filled primary), `open` (hollow 1.5px ring, text-3), `running`
  (warning), `blocked` (danger), `done` (a 12px check in success). Always carries its state as
  accessible text (visually hidden label, overridable), never colour alone.
- **`PriorityTag`** — a mono micro tag, never a pill: `P0` danger 600, `P1` text-1 600, `P2`
  text-3 400; renders nothing for no priority.
- **`Kbd`** — a key hint: mono micro, surface fill, `--border-strong` hairline with a 2px bottom
  edge, 4px radius; accepts a combo (`["⌘", "K"]`) rendered as adjacent keys.
- **`DeskSegmentedControl`** — the dense two-to-four-option switch (sunken track, 2px inset,
  the chosen option on surface with a hairline): a control-height track holding small-control options, 44px on touch, keyboard operable as a
  radio group (arrow keys, `role="radiogroup"`).
- **`DataGrid`**, **`DataGridHeader`**, **`DataGridHeaderCell`**, **`DataGridRow`**,
  **`DataGridCell`** — a real `<table>` underneath. Header row 32px, sticky, mono micro
  uppercase text-3; a sortable header cell is a button carrying `aria-sort` and a direction
  arrow. Body rows 40px with hairlines; numeric cells right-aligned in tabular mono; cells
  truncate. Selected and hover states as `ListRow`.
- **`CommandPalette`** shell — the floating container and its parts only: a Radix Dialog
  (overlay, focus trap, Esc closes, returns focus) at 8px radius with `--desk-shadow-float`, a
  44px search input row with a leading search icon and a trailing `esc` key hint, group headings
  (mono micro eyebrow), items (label, trailing mono meta or a `Kbd`, highlighted item on sunken
  fill, `aria-selected`) and an empty state line. It filters nothing and binds no shortcut —
  search, ranking, `⌘K` and the data sources are `shell-rail-palette`'s.
- **`DeskButton`** — the tier's button, composing the existing `Button` so the marketing
  button is not changed: sizes `sm` (26px), `md` (30px, default) and `icon` (30px square) and
  `icon-sm` (26px square, for dense table rows), each 44px on touch through the tokens; variants `primary`
  (ink fill), `secondary` (surface + strong hairline), `ghost`; an optional trailing `Kbd` slot
  (the "Launch ⌘↵" pattern); 6px radius; 600 weight; loading and disabled states.

Every primitive reads semantic desk tokens only — no hex, rgb, px or raw ramp value at a call
site — and so renders in light and dark by construction.

**4. Documentation.** `packages/ui/BRAND.md`: § App tier is rewritten as **§ Desk tier** — the
admin's tier: the five rules from the canvas sheet (density earns its keep; mono is metadata;
state is a dot; everything one keystroke away; flat), the token and primitive inventory above,
the touch step, and the scoped amendments it records — D-1 (desk first, compressed for the
phone; replaces "one design that grows"), D-3 (flat, dense, monochrome; no glass, blur or
springs; state is a small dot; 32px / 44px rows) and D-4 (Hanken Grotesk UI text, Plex Mono for
figures, slugs, dates and metadata). The app tier's rules shrink to a short **"App tier
(retiring)"** subsection kept only until `retire-app-tier` deletes it, because the admin's
screens still run on it until each screen stub moves them. `packages/ui/SKILL.md` and
`packages/ui/README.md` list `desk.css`, `tokens/desk.css` and `components/desk/`.
`.claude/skills/design-dna/SKILL.md` names the desk tier as the admin's tier for new work — its
bent rules, its primitives, its checklist lines — and marks the app tier as retiring. The four
designed states (loading, empty, error, populated) still apply to every desk screen and are
restated there.

The admin does not link `desk.css` and no screen changes in this stub.

## Acceptance criteria

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

## Out of scope

- Switching any admin screen, or linking `desk.css` from the admin — `shell-rail-palette` and the screen stubs do that.
- A specimen or preview page for the primitives (Jamie, 2026-09-25: no surface; the first visual check is `shell-rail-palette`'s preview).
- Palette behaviour: search, ranking, result sources, the `⌘K` / `⌘↵` bindings — `shell-rail-palette`.
- Where the desk layout begins (the iPad-portrait breakpoint) — `shell-rail-palette`.
- The phone tab bar, the sticky action bar and the phone title bar — built with the screens that use them (`shell-rail-palette`, `work-phone`).
- Deleting the app tier, its tokens or its components — `retire-app-tier`.
- Any change to the brand ramp, semantic colours, marketing tokens or the shared `Button`.
- A new dependency (no `cmdk`; Radix and lucide are already in the package).

## Open questions

- none
