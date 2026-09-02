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

**Type.** *(Marketing tier — the app tier sets UI text in the system stack; see § App tier.)* **Hanken Grotesk** (neutral grotesque) for everything structural; **IBM Plex Mono** as the engineer's signature — eyebrows, metadata, figures, code, and table data. Hierarchy comes from **weight + size + tight tracking** (`-0.02` to `-0.03em` on display sizes), not decoration. Body is 16px at 1.5–1.65 leading. Weights 300–800; headings sit at 600.

**Spacing & layout.** 4px base grid, used *generously* — whitespace is the brand. Content max-widths: prose ~640px, marketing ~1080px — the `--layout-sm/md/lg/xl` set, reached as `max-w-[var(--layout-md)]`. Sections breathe (`--section-y` = 96px). Modal surfaces state their own width: `--dialog-w` (512px) and `--sheet-w` (544px, iPadOS's form-sheet width).

> A brand token must never take a name from a Tailwind utility namespace it does not mean. The layout widths were called `--container-*` until 2026-08-29, which is exactly where Tailwind v4 reads its `max-w-* / w-* / min-w-*` scale — so `max-w-lg` silently became 1080px, `max-w-sm` 640px, and every dialog and sheet in the estate opened near-full-width on a laptop. Overriding a scale with the *same* meaning is fine and deliberate (`--radius-*`, `--shadow-*`, `--text-*` all do it); overriding one with a different meaning is a bug you can only see at a width you didn't test.

**Backgrounds & texture.** Mostly flat `--surface` / `--bg`. The single permitted texture is the **blueprint grid** (`.dst-grid-bg`, 32–48px, ~5% opacity) behind heroes, section breaks, and dark covers — structural, never over body text. **No gradients** as decoration (the only gradient is the sticky-header backdrop blur). Faint grain is acceptable; loud imagery is not. Imagery, when present, is cool-toned and restrained — but the brand is comfortable being **type-and-data-led with no photography at all**.

**Corners & borders.** *(App tier rounds harder — see § App tier.)* Tight, precise radii: controls `5px`, cards `12px`, large panels `16–24px`, pills full. **Hairline 1px borders** (`--border`) do most of the structural work; they're the primary way surfaces are separated.

**Elevation.** *(The app tier adds a real floating scale — see § App tier.)* Shadows are **soft and low** and used sparingly — a card resting state is usually *just a border*. Shadow appears mainly on hover (cards lift `translateY(-2px)` + `--shadow-md`) and on overlays/dialogs (`--shadow-xl`).

**Motion.** Quick and confident: 120–260ms, ease-out (`cubic-bezier(0.2,0,0,1)`). **No bounce, no spring** — *critically damped springs are sanctioned on the app tier only; see § App tier.* Transitions are fades and small translations. Hover = subtle background/border shift or a small lift; **press = colour deepens** (`--primary-active`), never a cartoonish shrink. The marketing tier has **one entrance**: a fade and an 8px rise as a section scrolls into view, played once (`Reveal` / `RevealGroup` / `RevealItem`, on [motion.dev](https://motion.dev)); the hero plays it on load, its lines 80ms apart. The logo, when it is a link, quietens on hover and press and crossfades when the theme flips (`LogoLockup`) — that is the whole of its choreography. Two decorative loops are allowed: the JN icon drawing itself in and breathing (`LogoLoader` — every route's loading state, pull-to-refresh, the board's refresh) and the "rolling deploy" ring on a pending button (`Spinner`); loops — those two and the skeleton shimmer — run on `--duration-spin`/`--duration-shimmer`-class timings, far slower than any transition. Everything respects `prefers-reduced-motion` (loops stand still; reveals render still and visible; transitions snap).

**Cards.** Surface fill, 1px `--border`, 12px radius, generous padding (`--space-5`). Interactive cards add a hover lift. No coloured left-border accents, no drop-shadow-by-default.

**Data & figures.** Numbers are the brand's rhetorical device, so they get a form of their own rather than a chart library. The stat tile is the canonical carrier: mono figure, sentence-case label, optional delta beside it. Trend reads as `↗ +12%` — a unicode arrow and a signed mono value, tinted with a **muted** semantic colour and only ever by a polarity the caller declares (a rise is not always good news). A series is drawn as a **hairline ~1.5px sparkline** — a shape, not a chart: no axes, no gridlines, no tooltips, and an area wash at most 10% of the same hue. Part-of-whole is a thin bar with a hairline track and a flat fill. **No gradients, no second axis, no neon.** Every one of these ships in `packages/ui` as `Stat` / `Delta` / `Sparkline` / `Meter`.

**Why three of those have no consumer.** Only `Meter` is on a screen today (the tickets board's batch arcs). `Stat`, `Delta` and `Sparkline` are **kept deliberately without one**: they are the executable form of the paragraph above, and deleting them would leave this page describing a numeric language the package cannot render — the rule and the implementation have to fail together or not at all. They are the **marketing tier's** numeric surface, waiting on the first page with figures to show (a case study's results, a proof strip on the portfolio), and they are designed as one composition — `Stat` takes a `Delta` and a `Sparkline` as slots, so the set is kept or dropped whole. `GlanceRow` is **not** their successor: it is app-tier chrome, sized for three figures across a phone, and § App tier says so. Reach for `Stat` when a number is the point of the surface; reach for `GlanceRow` when it is the summary above a list. _(Audited 2026-08-29 — `.icm/intake/triage/_done/prune-unused-ui-primitives.md`.)_

**Transparency & blur.** *(Marketing tier only — on the app tier, materials are structural; see § App tier.)* Reserved: the sticky site header (`backdrop-filter: blur(10px)` over a translucent `--bg`) and the dialog overlay. Not used decoratively.

---

## App tier (operated surfaces only)

Everything above is the **marketing tier** — the flat, Swiss, read-it-once brand of the
portfolio, the pay page, and the sellers site. It is unchanged and it is the default.

The **app tier** is a second, sanctioned surface language for the things Jamie *operates*
rather than publishes: today the admin dashboard, an installed one-handed PWA that should
feel like an iOS-class app, not a website with a login. It takes Apple's current design
language as its reference — the HIG pillars (clarity, deference, depth; large titles;
grouped inset lists) plus the Liquid Glass layer (floating translucent chrome, hierarchy
through depth, content always leading).

It is a tier, not a fork. It lives in this package, ships its own tokens, and is **opt-in**:
`tokens/app.css` is reached only through `@jamie-nisbet/ui/app.css`, which an app surface
imports *after* `styles.css`. Nothing a marketing site imports loads it, and the app-tier
components are inert without it.

*(Decided 2026-08-29 — see [`.icm/intake/admin-native-redesign/breakdown.md`](../../.icm/intake/admin-native-redesign/breakdown.md).
These are amendments with a scope, not drift. A change outside that scope is drift.)*

**What the app tier amends — on app surfaces only:**

- **Materials are structural.** Translucency and backdrop blur are how depth reads here, not
  a single licensed exception for a sticky header. Three levels — `thin` / `regular` /
  `thick` — are what floating chrome, title bars, sheets, and popovers are made of, each
  with an opaque fallback where `backdrop-filter` is missing. Text on a material takes the
  vibrancy-safe steps (`--material-label`, `--material-label-2`), which run a stop stronger
  than the page's, because a scrolling page underneath eats contrast a flat surface keeps.
  **Structural, not free**: a material is a backdrop-filter over whatever scrolls under it,
  which is the most expensive thing this tier asks of a GPU. It degrades to
  translucency-without-blur on the same opaque twins — under
  `prefers-reduced-transparency`, and under `[data-materials="opaque"]`, which a shell
  stamps on the root from a capability check before first paint. One degraded look, three
  ways in. And a material that has nothing behind it to blur — a panel on a flat canvas —
  is decoration, which is the one thing this amendment does not license.
- **Elevation exists.** Floating chrome and sheets sit *visibly* above content:
  `--elevation-chrome`, `--elevation-sheet`, `--elevation-popover`, `--elevation-raised`.
  Resting content is still flat and a hairline still does the structural work — a shadow
  here means one thing only, "this floats".
- **Springs are sanctioned.** Motion is spring-based where iOS muscle memory expects it:
  sheet detents, header collapse, row press. The curves are **critically damped** — they
  settle, they never pass their target — so the no-bounce rule survives intact; what
  changes is the shape of the deceleration, not the presence of overshoot. Still no spring
  for decoration. Call sites name the *pattern* (`spring-sheet`, `spring-header`,
  `spring-press`, `spring-pop`), never the curve. Everything respects
  `prefers-reduced-motion` — the durations collapse at the token level, so even JS-timed
  motion stands still.
- **UI text sets in the system font stack.** `--app-font` (`system-ui, -apple-system, …`)
  so the app reads as part of the OS — SF on Apple devices. Hanken Grotesk stays the
  marketing face and does not come here. The scale goes native: large title 34/41 bold,
  titles 28/22/20, headline and body 17, callout 16, subhead 15, footnote 13, caption 12/11,
  with heavier weight contrast and tighter display tracking than the marketing scale.
  **Mono figures remain non-negotiable** — numbers, metadata, and table data stay in
  `--font-mono` (IBM Plex Mono) on every tier.
- **Corners round harder.** `--app-radius-group` 16px, `--app-radius-card` 20px,
  `--app-radius-chrome` 22px, `--app-radius-sheet` 24px — continuous-feeling slabs rather
  than the marketing tier's precise 5/12px boxes.
- **Appearance follows the system.** No in-app toggle: the shell mirrors
  `prefers-color-scheme` onto `[data-theme]`, so there is one theming mechanism, not two.
  Both modes are designed in full — materials and vibrancy differ per mode, not just fill.
- **Fields are 44px by construction, not by media query.** The tier ships its own form
  controls, and the touch floor is in their class list rather than in a
  `@media (pointer: coarse)` rescue. That is not only a phone rule: a control that is
  finger-sized only behind a query still reads at 36px on every laptop, in every
  screenshot, and in every sheet on an iPad. The tier's body size does a second job here —
  17px is over the 16px threshold at which iOS zooms the page on focus, so an app-tier
  field never needs the marketing control's `text-base md:text-sm` dance to avoid it.
- **Focus draws inside the control.** The brand's ring is an outset `box-shadow`, and this
  tier is built out of surfaces that clip — a grouped list and a tab bar pill both own their
  corners with `overflow-hidden`, so a ring outside a row is a ring the group throws away.
  Under `app-tier`, `:focus-visible` also takes an outline at a negative offset, which
  nothing can clip. It is not a call-site decision: whether you can see what has focus is
  not something a screen gets to opt out of.

**What does not change, on any tier:** there is one tint — ink, paper in dark (`--app-tint` *is*
`--primary`, and there are no per-domain accents); semantic colour is muted and reserved for
state; sentence case, no emoji, quiet specific copy; **semantic tokens only** — the app tier
ships its own, and raw values are as banned at an app-tier call site as anywhere else; the
44px touch floor; and four designed states per view.

**What ships** (all requiring `@jamie-nisbet/ui/app.css`):

- `tokens/app.css` — materials, elevation, springs, the native type scale, shape, and the
  `--app-*` surface aliases. Light and dark both complete, flipping on `[data-theme="dark"]`.
- `app.css` — the Tailwind entry: maps those tokens onto utilities (`bg-app-group`,
  `text-app-body`, `rounded-app-group`, `shadow-app-chrome`, `border-app-separator`), plus
  the `material-*`, `spring-*`, and `app-tier` utilities. `app-tier` is the switch applied
  once at the top of a surface's tree; it also carries the tier's focus treatment.
- `Material` — the translucent surface wrapper (`level` / `elevation` / `edge`).
- `GroupedList` / `GroupedSection` / `GroupedRow` — the inset grouped list, the tier's main
  structural unit; it replaces the table on an operating screen. A row can carry an
  `accessory` (a copy button, a delete) outside its own element, and a `variant`:
  `tint` for the affirmative action a sheet leads with, `destructive` for the one that
  can't be taken back. Colour only — neither changes the geometry.
- `GroupedBlock` / `GroupedDisclosure` — the two things inside a slab that are not a row:
  prose and controls, and a native `<details>` fold for reference you read once.
- `CollapsingHeader` — the scroll-linked hand-off on its own: a masthead in flow, a
  compact material bar that takes over when it clears. Both headers below are it.
- `LargeTitleHeader` — a list screen's masthead: the name set large, a quiet line under it.
- `IdentityHeader` — a profile screen's masthead, the Contacts idiom: disc, name, what they
  are, and the one figure in mono beside them.
- `Monogram` — the identity disc: initials in mono on a neutral fill, no photographs.
- `ActionCircle` / `ActionCircleRow` — the row of tinted discs under an identity. An action
  the record can't support is **disabled, not hidden**, so the row's shape is learnable.
- `GlanceRow` / `GlanceFigure` — what a screen adds up to, under its large title: two or
  three mono figures with a word under each, in place of a subtitle sentence. Chrome, not
  `Stat`: no delta, no sparkline, sized so three fit across a phone. A figure the screen
  has none of is omitted rather than shown as a zero.
- `SegmentedControl` / `SegmentedItem` — a closed set of mutually exclusive choices on a
  sunken track, the chosen one raised out of it. Counts set in mono. For a *closed* set
  only — an open-ended or growing set (one per repo, one per tag) stays a scrolling rail.
  Semantics come from the call site: links take `aria-current`, buttons under a
  `role="radiogroup"` take `aria-checked`.
- `AppField` / `AppLabel` / `AppInput` / `AppTextarea` — the tier's form controls. A field
  is a recess (`--app-field`, with `--app-field-border` round it) on the 12px control
  radius at 17px body, 44px tall on every pointer. `AppField` is the unit rather than the
  control: it owns the label, the hint, the error, and the `id` / `aria-describedby` /
  `aria-invalid` wiring between them, so a call site writes the label once and never
  invents an id. Errors carry a glyph as well as the destructive colour — meaning never
  rests on colour alone.
- `AppSelect` and its parts (`AppSelectTrigger` / `Content` / `Item` / `Value` / `Group` /
  `Label` / `Separator`) — the tier's select, whole rather than trigger-deep: the menu is a
  material with the popover's elevation and **44px rows**, which is the half of a select a
  thumb actually lands on. Two triggers: `field` is the same box as an `AppInput`; `plain`
  is the pull-down menu button — the value in the tint with a chevron, no box — for a
  choice made from inside a list row.
- `Sheet` **detents** — `<SheetContent detents={["medium", "large"]}>` gives a phone sheet
  the native resting heights: drag the handle between them, drag it off the bottom to
  dismiss, tap it to step. Omit the prop and the sheet is what it always was.

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
- `app.css` + `tokens/app.css` — the **app tier** (see § App tier). Opt-in: linked *after* `styles.css` by operated surfaces only, never by a marketing site.

**Assets** (`assets/`)
- `logo/` — `reference/` (the delivered artwork: `full-light`, `full-dark`, `icon-light`, `icon-dark` at 2000px — the source of record), and the traced SVGs `logo-full.svg`, `logo-full-dark.svg`, `logo-mark.svg`, `logo-mark-dark.svg` for surfaces outside React.
- `brand/` — `social-card.html` (1200×630 OG), `email-signature.html`.
- `lib/icons.js` — shared Lucide → `<Icon>` helper for UMD/static surfaces.

**Components** (TSX, idiomatic shadcn/ui themed with the brand tokens; import from the `@jamie-nisbet/ui` barrel)
- `src/components/ui/` — Button, Badge, Card, Input, Label, Textarea, Select, Switch, Alert, Dialog, Sheet, plus the motion/feedback set: Skeleton, Spinner, Toaster + `toast()`, PendingButton. Compositional where shadcn is (e.g. `Card` + `CardHeader` + `CardTitle`; `Sheet` + `SheetContent` + `SheetHeader`). Also the glanceable data-viz primitives — Stat, Delta, Sparkline, Meter (inline SVG, no chart library; see § Data & figures) — and QrCode, the one surface here that is deliberately dark-on-light in both themes, because a camera reads it and plenty of scanners will not invert.
- `src/components/app/` — the **app-tier** primitives: GroupedList / GroupedSection / GroupedRow / GroupedBlock / GroupedDisclosure, CollapsingHeader, LargeTitleHeader, IdentityHeader, Monogram, ActionCircle / ActionCircleRow, GlanceRow / GlanceFigure, SegmentedControl / SegmentedItem, Material, AppField / AppLabel / AppInput / AppTextarea, AppSelect and its parts. Exported from the same barrel, but inert unless the surface links `app.css` (see § App tier).
- `src/components/brand/` — Eyebrow, IconButton, LogoMark / LogoMarkSolid / LogoFull and LogoLoader (brand-only; no shadcn equivalent), over the traced paths in `logo-artwork.ts`.
- `src/components/motion/` — Reveal / RevealGroup / RevealItem (the marketing tier's entrance) and LogoLockup (the logo's hover, press and theme crossfade), on `motion` (motion.dev).
- `src/lib/utils.ts` — the `cn()` class-merge helper. Types come from the TSX source.

**Consuming the package** — see `README.md`. **Skill** — `SKILL.md` makes this folder usable as an Agent Skill.
