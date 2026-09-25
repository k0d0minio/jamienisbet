# Jamie Nisbet — Design System

The brand and UI system for **Jamie Nisbet**, a freelance consultant and software engineer specialising in **AI infrastructure and bespoke solutions** for businesses of all sizes.

The brand voice is *quiet, casual confidence* — professional without being corporate. The visual language is **Swiss-minimal and monochrome**: generous whitespace, the logo's own paper and ink as the only two colours that matter, hairline borders over heavy shadows, and a monospace accent that signals the engineer behind the work.

> **Sources.** This system was created from a written brief only — no existing codebase, Figma, or decks were supplied. All product names, clients, and figures in the UI kits, slides, and proposal (Sonar, Mistlake, Keel, etc.) are **illustrative sample content**, not real engagements. Replace them with real work before publishing.

---

## Content fundamentals

**Voice — quiet, casual confidence.** Plain, direct, unhurried. The work speaks; the copy doesn't oversell.

- **Person.** First person singular ("I build…", "I'll reply within two working days"). Speak *to* the reader as "you" / "your team". Never the royal "we" — Jamie is one person, and that's a feature.
- **Tone.** Calm and concrete. State outcomes, not adjectives. "Cut p99 latency 60% on a fixed budget" — not "blazing-fast, world-class performance."
- **Casing.** Sentence case everywhere — headlines, buttons, nav. The *only* uppercase is the mono eyebrow/label (e.g. `SELECTED WORK`, `99.95% UPTIME`), always with wide tracking. Never Title Case headings.
- **Sentence length.** Short. One idea per sentence. Em dashes for the aside, not semicolons.
- **Technical detail is welcome, jargon is not.** Name the real thing (`p99`, `dynamic batching`, `SLO`) where it adds precision; skip buzzwords ("synergy", "leverage", "cutting-edge").
- **Numbers** are a rhetorical device — set them in mono and let them carry weight (`−60%`, `2B/day`, `99.95%`). Use real units.
- **Emoji:** never. **Exclamation marks:** essentially never.
- **CTAs** are quiet and specific: "Start a project", "See selected work", "Send brief" — not "Get started now!" or "Let's chat 🚀".

**Examples (use as reference):**
- Hero: *"Quiet, considered systems for teams that can't afford downtime."*
- Sub: *"I build and harden the AI infrastructure behind real products: inference, data pipelines, and the boring reliability work that keeps them up."*
- Availability: *"Booking from August"* (a fact, stated plainly).
- Reassurance: *"Your team owns it at the end. No lock-in to me."*

---

## Visual foundations

**Colour.** The palette is the logo's, and the logo has two colours: **paper** `--neutral-0 #FFFEFA` and **ink** `--neutral-900 #1E1E1E`. There is no brand hue. The page canvas *is* the paper (light) or the ink (dark), so the tile sits flush on it; cards lift one step off; everything between is a *warm* grey ramp — a tint of the paper, never a cool grey and never pure black. **Ink is the interaction tint** in light (buttons, links, focus, active nav) and paper is in dark: `--primary` flips with the theme along with everything else. Semantic colours (success/warning/danger) are the one place colour appears, **muted, never neon**, and only ever for state, so that meaning never rests on the tint alone. Always design against the semantic aliases (`--surface`, `--text-1`, `--border`, `--primary`), which flip correctly between the **light and dark** themes via `[data-theme="dark"]`. *(Slate blue `#3A5A78` was the tint until 2026-09-02; it was retired when the 2026 logo set landed and the sites took its palette.)*

**Type.** *(Marketing tier — the desk tier sets a denser scale in the same faces; see § Desk tier.)* **Hanken Grotesk** (neutral grotesque) for everything structural; **IBM Plex Mono** as the engineer's signature — eyebrows, metadata, figures, code, and table data. Hierarchy comes from **weight + size + tight tracking** (`-0.02` to `-0.03em` on display sizes), not decoration. Body is 16px at 1.5–1.65 leading. Weights 300–800; headings sit at 600.

**Spacing & layout.** 4px base grid, used *generously* — whitespace is the brand. Content max-widths: prose ~640px, marketing ~1080px — the `--layout-sm/md/lg/xl` set, reached as `max-w-[var(--layout-md)]`. Sections breathe (`--section-y` = 96px). Modal surfaces state their own width: `--dialog-w` (512px) and `--sheet-w` (544px, iPadOS's form-sheet width).

> A brand token must never take a name from a Tailwind utility namespace it does not mean. The layout widths were called `--container-*` until 2026-08-29, which is exactly where Tailwind v4 reads its `max-w-* / w-* / min-w-*` scale — so `max-w-lg` silently became 1080px, `max-w-sm` 640px, and every dialog and sheet in the estate opened near-full-width on a laptop. Overriding a scale with the *same* meaning is fine and deliberate (`--radius-*`, `--shadow-*`, `--text-*` all do it); overriding one with a different meaning is a bug you can only see at a width you didn't test.

**Backgrounds & texture.** Mostly flat `--surface` / `--bg`. The single permitted texture is the **blueprint grid** (`.dst-grid-bg`, 32–48px, ~5% opacity) behind heroes, section breaks, and dark covers — structural, never over body text. **No gradients** as decoration (the only gradient is the sticky-header backdrop blur). Faint grain is acceptable; loud imagery is not. Imagery, when present, is cool-toned and restrained — but the brand is comfortable being **type-and-data-led with no photography at all**.

**Corners & borders.** *(The desk tier sets its own 4 / 6 / 8px steps — see § Desk tier.)* Tight, precise radii: controls `5px`, cards `12px`, large panels `16–24px`, pills full. **Hairline 1px borders** (`--border`) do most of the structural work; they're the primary way surfaces are separated.

**Elevation.** *(The desk tier keeps one float step for the palette, menus and sheets — see § Desk tier.)* Shadows are **soft and low** and used sparingly — a card resting state is usually *just a border*. Shadow appears mainly on hover (cards lift `translateY(-2px)` + `--shadow-md`) and on overlays/dialogs (`--shadow-xl`).

**Motion.** Quick and confident: 120–260ms, ease-out (`cubic-bezier(0.2,0,0,1)`). **No bounce, no spring**, on any tier — the desk tier is stiller still (see § Desk tier). Transitions are fades and small translations. Hover = subtle background/border shift or a small lift; **press = colour deepens** (`--primary-active`), never a cartoonish shrink. The marketing tier has **one entrance**: a fade and an 8px rise as a section scrolls into view, played once (`Reveal` / `RevealGroup` / `RevealItem`, on [motion.dev](https://motion.dev)); the hero plays it on load, its lines 80ms apart. The logo, when it is a link, quietens on hover and press and crossfades when the theme flips (`LogoLockup`) — that is the whole of its choreography. Two decorative loops are allowed: the JN icon drawing itself in and breathing (`LogoLoader` — every route's loading state, pull-to-refresh, the board's refresh) and the "rolling deploy" ring on a pending button (`Spinner`); loops — those two and the skeleton shimmer — run on `--duration-spin`/`--duration-shimmer`-class timings, far slower than any transition. Everything respects `prefers-reduced-motion` (loops stand still; reveals render still and visible; transitions snap).

**Cards.** Surface fill, 1px `--border`, 12px radius, generous padding (`--space-5`). Interactive cards add a hover lift. No coloured left-border accents, no drop-shadow-by-default.

**Data & figures.** Numbers are the brand's rhetorical device, so they get a form of their own rather than a chart library. The stat tile is the canonical carrier: mono figure, sentence-case label, optional delta beside it. Trend reads as `↗ +12%` — a unicode arrow and a signed mono value, tinted with a **muted** semantic colour and only ever by a polarity the caller declares (a rise is not always good news). A series is drawn as a **hairline ~1.5px sparkline** — a shape, not a chart: no axes, no gridlines, no tooltips, and an area wash at most 10% of the same hue. Part-of-whole is a thin bar with a hairline track and a flat fill. **No gradients, no second axis, no neon.** Every one of these ships in `packages/ui` as `Stat` / `Delta` / `Sparkline` / `Meter`.

**Why three of those have no consumer.** Only `Meter` is on a screen today (the tickets board's batch arcs). `Stat`, `Delta` and `Sparkline` are **kept deliberately without one**: they are the executable form of the paragraph above, and deleting them would leave this page describing a numeric language the package cannot render — the rule and the implementation have to fail together or not at all. They are the **marketing tier's** numeric surface, waiting on the first page with figures to show (a case study's results, a proof strip on the portfolio), and they are designed as one composition — `Stat` takes a `Delta` and a `Sparkline` as slots, so the set is kept or dropped whole. In the admin, a summary of figures above a list is a plain row of mono figures at the desk tier's `text-desk-figure` step, not a `Stat`. Reach for `Stat` when a number is the point of a marketing surface. _(Audited 2026-08-29 — `.icm/intake/triage/_done/prune-unused-ui-primitives.md`.)_

**Transparency & blur.** *(Marketing tier only — the desk tier has none; see § Desk tier.)* Reserved: the sticky site header (`backdrop-filter: blur(10px)` over a translucent `--bg`) and the dialog overlay. Not used decoratively.

---

## Desk tier (the admin's tier)

Everything above is the **marketing tier** — the flat, Swiss, read-it-once brand of the
portfolio, the pay page, and the sellers site. It is unchanged and it is the default.

The **desk tier** is the sanctioned surface language for the thing Jamie *operates* rather
than publishes: the admin dashboard, a work tool used for real work on a laptop and on an
iPhone. It is **designed at the desk first and compressed for the phone** — a dense, flat,
keyboard-reachable cockpit, not a phone app stretched wide. Its visual reference is the
design-system sheet on the redesign canvas ("Desk — the design system",
<https://claude.ai/artifact/EtnAmedYSgzwYG2jNKB3bC>).

It is a tier, not a fork. It lives in this package, ships its own tokens, and is **opt-in**:
`tokens/desk.css` is reached only through `@jamie-nisbet/ui/desk.css`, which the admin
imports *after* `styles.css`. Nothing a marketing site imports loads it, and the desk-tier
components are inert without it.

There are two tiers and no third: **marketing** (every public site) and **desk** (the admin).
Every screen in the admin — login, "not here", the error and loading screens, and dormant
Money included — is on the desk tier, which the admin switches on once with `desk-tier` on
`<body>`.

*(Decided 2026-09-25 — see [`.icm/runs/admin-cockpit-redesign/01_scope/output/scope.md`](../../.icm/runs/admin-cockpit-redesign/01_scope/output/scope.md).
It replaced the admin's earlier iOS-idiom tier, which has been deleted. These are amendments
with a scope, not drift. A change outside that scope is drift.)*

**The five rules.**

1. **Density earns its keep.** 32px rows and 30px controls at the desk, 44px under a thumb.
2. **Mono is metadata.** Slugs, repos, figures, dates and keys set in IBM Plex Mono.
3. **State is a dot, not a colour field.** One small mark per state; never a tinted row.
4. **Everything is one keystroke away.** ⌘K reaches any record; lists move on j / k.
5. **Flat.** A shadow only on what floats: the palette, a menu, a sheet.

**What the desk tier amends — in the admin only:**

- **D-1 — desk first, compressed for the phone.** Replaces the admin-native-redesign rule
  "one design that grows" (2026-08-29). Lists and readers sit side by side in panes at the
  desk; on the phone the reader pushes over the list. The same tokens serve both, and the
  **touch step is built into them**: one `@media (pointer: coarse)` block in
  `tokens/desk.css` takes rows and controls to 44px and every type step up one. A
  touch-primary device gets the phone sizes from the same markup, and no component carries
  a pointer or width query of its own. Where the desk *layout* begins is the shell's call.
- **D-3 — flat, dense, monochrome.** No materials, no blur, no springs, no inset grouped
  slabs, no large-title collapse. Structure is hairlines (`--desk-line`) and panes; a
  selected row is the sunken fill plus weight, never a coloured side border and never a
  card in a card. State is a small dot — `next` ink, `open` a hollow ring, `running`
  warning, `blocked` danger, `done` a check in success — with its name always spoken as
  text. Priority is a mono tag (P0 danger and bold, P1 ink and bold, P2 muted), never a
  pill. Corners are tight: 4px keys, 6px controls and rows, 8px panes and floating panels.
  One elevation step, `--desk-shadow-float`, and only what floats takes it. Motion is
  instant or a plain ≤120ms colour change: a sheet or a dialog appears and disappears with
  no slide and no spring, and a sheet's detents on the phone follow the finger and settle at
  once on release.
- **D-4 — Hanken Grotesk UI text, IBM Plex Mono for metadata.** Replaces the system font
  stack in the admin. The dense scale (desk → touch):

  | Step | Desk | Touch | Face |
  | --- | --- | --- | --- |
  | title | 22/28 · 700 · −0.02em | 28/34 | sans |
  | heading | 15/20 · 600 | 17/22 | sans |
  | body (reading) | 14/22 · 400 | 16/24 | sans |
  | ui (rows, labels, controls) | 13/18 · 500 | 15/20 | sans |
  | meta | 12/16 · 400 | 13/18 | mono |
  | micro (key hints, tags, eyebrows, table headers) | 11/14 · 500 | 12/16 | mono |
  | figure | 20/26 · 500 | 22/28 | mono, tabular |

  Body on touch is 16px, which is also what keeps iOS from zooming a focused field.
- **Focus draws inside the control.** Panes scroll and clip, so under `desk-tier`,
  `:focus-visible` also takes an outline at a negative offset that nothing can clip.
- **Appearance follows the system**, with no in-app toggle: the admin mirrors
  `prefers-color-scheme` onto `[data-theme]` before first paint.

**What does not change:** the brand ramp and the semantic colours are exactly as above —
the tier adds density and structure, **not a single hue**; every `--desk-*` colour is an
alias of a semantic token, so dark mode flips through the one `[data-theme="dark"]` block.
One tint (ink, paper in dark); semantic colour muted and for state only; sentence case, no
emoji; **semantic tokens only** at every call site; the 44px touch floor; and four designed
states per view — loading, empty, error, populated.

**What ships** (all requiring `@jamie-nisbet/ui/desk.css`):

- `tokens/desk.css` — the `--desk-*` colour aliases, the dense type scale, sizes, radii,
  the float shadow, and the coarse-pointer step.
- `desk.css` — the Tailwind entry: maps those tokens onto utilities (`text-desk-ui`,
  `h-desk-row`, `size-desk-control`, `rounded-desk-control`, `bg-desk-sunken`,
  `text-desk-fg-3`, `border-desk-line`, `shadow-desk-float`, `tracking-desk-eyebrow`,
  `font-desk`) plus `desk-tier`, the switch applied once at the top of the admin's tree.
  Sizes and colours are named disjointly (`text-desk-ui` is a size, `text-desk-fg` a
  colour), and `cn()` knows every desk name, so an override resolves instead of stacking.
- `RailItem` — an icon in the 56px rail, current screen on the sunken fill, a count badge
  whose number is part of the accessible name ("Inbox, 9 waiting").
- `Pane` / `PaneHeader` / `PaneToolbar` / `PaneBody` — a flat pane between hairlines: a
  56px header (title, mono meta, trailing actions), a 44px toolbar, a body that scrolls.
- `ListRow` — the 32px row: leading mark, truncating label, trailing mono meta; hover,
  selected, done and focus states.
- `StatusDot` — the five states above, each with its spoken name.
- `PriorityTag` — P0 / P1 / P2 as a mono tag; nothing for no priority.
- `Kbd` — a key hint, or a combo (`keys={["⌘", "K"]}`).
- `DeskSegmentedControl` — Table / Board and the like: a radio group on a sunken track,
  arrow-key operable.
- `DataGrid` / `DataGridHeader` / `DataGridBody` / `DataGridRow` / `DataGridHeaderCell` /
  `DataGridCell` — a real table: sticky mono header, 40px rows, tabular figures, sortable
  columns with `aria-sort`.
- `CommandPalette` / `CommandPaletteInput` / `CommandPaletteList` / `CommandPaletteGroup` /
  `CommandPaletteItem` / `CommandPaletteEmpty` — the ⌘K shell: a focus-trapping dialog that
  closes on Esc, a combobox over a listbox. It filters and binds nothing; the shell does.
- `DeskButton` — `primary` / `secondary` / `ghost`, `sm` 26 · `md` 30 · `icon` · `icon-sm`,
  an optional `shortcut` hint ("Launch ⌘↵") and a `loading` state. Built on the shared
  `Button`, which it never changes.
- `DeskMenu` / `DeskMenuTrigger` / `DeskMenuContent` / `DeskMenuItem` / `DeskMenuSeparator` /
  `DeskMenuGroup` — "do one of these" behind one trigger: a flat floating panel (it takes
  `shadow-desk-float`), rows on the row height, an optional second line, a `destructive` item.
  Radix owns the keyboard.
- `DeskTabs` (+ `deskTabId` / `deskTabPanelId`) — several bodies in one place: labels on a
  hairline, the current one in ink with a 2px underline, an optional mono count; a tablist
  operated by the arrow keys. The panels are the caller's.
- `RecordSection` / `RecordRow` / `RecordBlock` / `RecordDisclosure` — one record's facts as a
  dense key–value list under a mono eyebrow, with an `actions` slot (Edit) on the eyebrow's
  line.
- `DeskField` / `DeskLabel` / `DeskInput` / `DeskTextarea` — the tier's form controls. A
  field is the unit: its label, its control, and the hint or error under it, wired together
  (`aria-describedby`, `aria-invalid`, the error announced). Flat — a strong hairline on the
  surface, 6px corners, no shadow — on the row step (32px at the desk, 44px under a
  thumb), the value at the body step (16px on touch, so iOS never zooms a focused field).
  `DeskTextarea` can `autoResize` to its content. Never the marketing `Input` on a desk
  screen.
- `DeskSelect` / `DeskSelectTrigger` / `DeskSelectValue` / `DeskSelectContent` /
  `DeskSelectItem` (+ `Group`, `Label`, `Separator`) — the select, trigger and menu both: a
  `field` trigger that is the same box as a `DeskInput`, or a `plain` one for a choice made
  inside a row; the menu is a flat floating panel like `DeskMenu`, rows on the row step.

---

## Iconography

- **System: [Lucide](https://lucide.dev)** — 1.5–2px stroke, rounded caps/joins. It matches the brand's precise, unfussy line. *(This is a chosen substitute — no icon set was supplied in the brief. Swap if you have a preferred set.)*
- **Delivery:** in React apps import `lucide-react` directly (a dependency of `@jamie-nisbet/ui`). In static HTML / UMD surfaces (slides, docs, email) use the shared helper `assets/lib/icons.js` → `<Icon name="ArrowRight" size={18} />` (PascalCase Lucide names), or `<i data-lucide="check"></i>` + `lucide.createIcons()`.
- **Usage:** icons are functional, not decorative — they sit in buttons, nav, status rows, and feature lists at `15–21px`. Tinted `--text-3` at rest, `--primary` when they carry meaning (active nav, feature accents).
- **No emoji. No multicolour/3D icons.** Unicode arrows (`↗`) are fine inline in mono labels.
- **Logo** is bespoke (not an icon): see `assets/logo/`. The 2026 logo is a **framed tile in pure paper/ink**. The **icon form** is a typographic JN lockup — a J with a hooked descender and an N — inside a thin square frame. The **full form** is the same frame with the **"Jamie Nisbet." wordmark** on two lines (a geometric sans, not Hanken Grotesk — it is artwork, not type) and a circle in the top right. The reference set — full and icon, light and dark, at 2000px — lives in `assets/logo/reference/`; the delivered artwork also carries an "ESTD. 2021" line under the frame, which the web does not use.
  **Every rendering is the artwork.** The paths in `src/components/brand/logo-artwork.ts` were *traced* from the reference PNGs at full resolution (potrace) and checked back by rasterising the trace and diffing it pixel for pixel against the source — 1.0% of ink pixels differ on the full form and 0.6% on the icon, all edge antialiasing. That is the rule: the logo is never drawn by hand, never approximated, never "tidied"; a change to it is a new reference PNG and a new trace. *(The geometric approximation that stood in for it for a day in 2026-09 did not read as the logo at any size; the alpha-mask cut that replaced it has now been replaced in turn by the trace, which keeps the same fidelity and adds vector sharpness, `currentColor`, and a form Satori can draw.)*
  In React the forms are `LogoMark` (the letters alone, `currentColor` — a glyph beside text), `LogoMarkSolid` (the icon form on its paper/ink tile, flipped by `--logo-tile`/`--logo-ink`) and `LogoFull` (the full form: `currentColor` on a transparent tile by default, which on the paper or ink canvas is exactly the artwork's own reading; `tile` for the solid tile; `ink`/`paper` literals for a rasteriser with no stylesheet). **Where the full form goes:** anywhere there is room for the name to read — the marketing header (which is 88px tall for exactly that reason) and footer, the portfolio hero, the 404 pages, the Open Graph card, the admin's login and its sidebar head. **Where the icon goes:** everywhere else — the favicon, the installed PWA and apple icons, the phone title bar, the loading indicator (`LogoLoader`). Favicons and installed icons are the one place a PNG is still used, cut from the reference set at the size each is painted at (the admin's `public/icon*.png`, each site's `app/icon.png`); `assets/logo/logo-*.svg` are the same traces as standalone files for anything outside React. *(Locked 2026-09-01; letters replaced with the artwork 2026-09-02; the trace, the full form and the palette landed the same day.)*

---

## Index / manifest

This package (`@jamie-nisbet/ui`) ships the foundations, assets, and components below.
The full design exploration (UI kits, slides, proposal doc, specimen cards) lives in the
source Claude Design bundle and is not re-shipped here — lift patterns from it as needed.

**Foundations** — built on **Tailwind CSS v4 + shadcn/ui** (new-york, unified `radix-ui`).
- `styles.css` — the Tailwind v4 + shadcn theme entry; React apps link this one file. It maps the brand semantic aliases onto shadcn's color tokens.
- `tokens.css` — the variables-only layer for non-Tailwind surfaces (static HTML, email, slides).
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `radius.css`, `shadows.css`, `motion.css`, `fonts.css`, `base.css`.
- `desk.css` + `tokens/desk.css` — the **desk tier**, the admin's tier (see § Desk tier). Opt-in: linked *after* `styles.css` by the admin only, never by a marketing site.

**Assets** (`assets/`)
- `logo/` — `reference/` (the delivered artwork: `full-light`, `full-dark`, `icon-light`, `icon-dark` at 2000px — the source of record), and the traced SVGs `logo-full.svg`, `logo-full-dark.svg`, `logo-mark.svg`, `logo-mark-dark.svg` for surfaces outside React.
- `brand/` — `social-card.html` (1200×630 OG), `email-signature.html`.
- `lib/icons.js` — shared Lucide → `<Icon>` helper for UMD/static surfaces.

**Components** (TSX, idiomatic shadcn/ui themed with the brand tokens; import from the `@jamie-nisbet/ui` barrel)
- `src/components/ui/` — Button, Badge, Card, Input, Label, Textarea, Select, Switch, Alert, Dialog, Sheet, plus the motion/feedback set: Skeleton, Spinner, Toaster + `toast()`, PendingButton. Compositional where shadcn is (e.g. `Card` + `CardHeader` + `CardTitle`; `Sheet` + `SheetContent` + `SheetHeader`). Also the glanceable data-viz primitives — Stat, Delta, Sparkline, Meter (inline SVG, no chart library; see § Data & figures) — and QrCode, the one surface here that is deliberately dark-on-light in both themes, because a camera reads it and plenty of scanners will not invert.
- `src/components/desk/` — the **desk-tier** primitives: RailItem, Pane / PaneHeader / PaneToolbar / PaneBody, ListRow, StatusDot, PriorityTag, Kbd, DeskSegmentedControl, DataGrid and its parts, CommandPalette and its parts, DeskButton, DeskMenu and its parts, DeskTabs, RecordSection / RecordRow / RecordBlock / RecordDisclosure, DeskField / DeskLabel / DeskInput / DeskTextarea, DeskSelect and its parts. Exported from the same barrel, but inert unless the surface links `desk.css` (see § Desk tier).
- `src/components/brand/` — Eyebrow, IconButton, LogoMark / LogoMarkSolid / LogoFull and LogoLoader (brand-only; no shadcn equivalent), over the traced paths in `logo-artwork.ts`.
- `src/components/motion/` — Reveal / RevealGroup / RevealItem (the marketing tier's entrance) and LogoLockup (the logo's hover, press and theme crossfade), on `motion` (motion.dev).
- `src/lib/utils.ts` — the `cn()` class-merge helper. Types come from the TSX source.

**Consuming the package** — see `README.md`. **Skill** — `SKILL.md` makes this folder usable as an Agent Skill.
