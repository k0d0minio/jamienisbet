---
name: design-dna
description: The per-turn design checklist for any UI work in this repo. Use this skill whenever you create, change, or review anything a user sees — components, screens, pages, layouts, styling, forms, dialogs/sheets, navigation, loading or error handling, emails, or copy shown in the UI — in any of the websites/* apps or packages/ui, even if the task doesn't mention "design". It is how a change ends up looking and feeling like this product instead of default shadcn.
---

# Design DNA — how UI ships in this repo

The brand is **Swiss-minimal, quiet, casual confidence** — and monochrome: the logo's paper
and ink are the canvas and the tint (ink in light, paper in dark), warm-grey neutrals between
them and no second hue, hairline 1px borders doing the structural work, generous whitespace,
mono figures, sentence case. Quiet does **not** mean flat — hierarchy comes from weight,
size, spacing, and real states, not from decoration. No gradients, no emoji, no neon,
no bounce.

That is the **marketing tier**, and it is the default. `websites/admin-dashboard` is the
one exception: it is a work tool on the sanctioned **desk tier**. There are two tiers and
no third. Read § Which tier am I on? below before you decide anything looks wrong.

Identity and token specifics live in one place — read them, don't restate them:

- [`packages/ui/BRAND.md`](../../../packages/ui/BRAND.md) — voice, visual foundations, iconography, **§ Desk tier**.
- [`packages/ui/tokens/`](../../../packages/ui/tokens/) — the values (colour, type, spacing, radius, shadows, motion), plus `desk.css` for the desk tier.
- [`packages/ui/SKILL.md`](../../../packages/ui/SKILL.md) — the package tour: assets, components, how to consume.

## Which tier am I on?

**Marketing tier** — `websites/portfolio`, `websites/sellers-site`,
and anything in `packages/ui` outside `src/components/desk/`.
Everything on this page applies as written. Nothing below changes for you.

**Desk tier** — every screen in `websites/admin-dashboard`, and `packages/ui/src/components/desk/`.
A dense, flat work tool designed at the desk and compressed for the phone — not a phone app
stretched wide. It opts in by linking `@jamie-nisbet/ui/desk.css` *after* `styles.css`, and
puts `desk-tier` once, on `<body>`. Its visual reference is the canvas's
"Desk — the design system" sheet. Three rules bend, scoped to it (decided 2026-09-25,
recorded in
[`.icm/runs/admin-cockpit-redesign/01_scope/output/scope.md`](../../../.icm/runs/admin-cockpit-redesign/01_scope/output/scope.md)
and [`packages/ui/BRAND.md`](../../../packages/ui/BRAND.md) § Desk tier):

1. **D-1 — desk first, compressed for the phone.** Panes side by side at the desk; the reader
   pushes over the list on the phone. The touch step lives **in the tokens** — one
   `@media (pointer: coarse)` block takes rows and controls to 44px and each type step up
   one — so never write a pointer or width query in a component to size it.
2. **D-3 — flat, dense, monochrome.** No materials, blur, springs, grouped slabs or
   large-title collapse. 32px rows (`h-desk-row`), 30px controls (`h-desk-control`), 4 / 6 /
   8px corners, hairlines between panes. Selected = `bg-desk-sunken` + weight, never a
   coloured side border or a card in a card. State is a `StatusDot`; priority a
   `PriorityTag`. One shadow, `shadow-desk-float`, and only on what floats (palette, menu,
   sheet). Motion is instant or a ≤120ms colour change.
3. **D-4 — Hanken Grotesk UI text** on the dense scale (`text-desk-title` 22 → `text-desk-ui`
   13 → `text-desk-micro` 11; `font-desk`), **IBM Plex Mono for metadata** — slugs, repos,
   figures, dates, keys (`font-mono text-desk-meta`, `text-desk-figure tabular-nums`).

Its primitives: `RailItem` (the 56px rail, count in the accessible name), `Pane` /
`PaneHeader` / `PaneToolbar` / `PaneBody`, `ListRow`, `StatusDot`, `PriorityTag`, `Kbd`,
`DeskSegmentedControl`, `DataGrid` and its parts (a real table), `CommandPalette` and its
parts (the ⌘K shell), `DeskButton` (`primary` / `secondary` / `ghost`, `shortcut` for
"Launch ⌘↵"), `DeskMenu`, `DeskTabs`, `RecordSection` / `RecordRow` (a record's facts), and
the form controls `DeskField` / `DeskInput` / `DeskTextarea` / `DeskSelect`. Reach for these before anything else on a desk screen; never the marketing
`Button`, `Card` or `Input` inside one.

Everything else holds on every tier, unchanged: there is one tint, ink (paper in dark; no
per-domain accents), semantic colour is state-only and muted, sentence case, no emoji,
semantic tokens only, the 44px touch floor, four designed states.

## Before writing any component

Check the `@jamie-nisbet/ui` barrel first (`packages/ui/src/components/`). If a
primitive exists, use it; if it *almost* exists, extend it in the package rather than
forking a local copy — the package is the single brand source and every app inherits
the fix. A new primitive that two screens could use belongs in `packages/ui`, not in an
app's `components/`.

## Tokens, not values

Every colour, radius, shadow, duration, and font comes from a semantic token
(`--surface`, `--text-1`, `--border`, `--primary`, …) or its shadcn utility
(`bg-card`, `text-muted-foreground`, …). On the desk tier that means the desk tokens
and their utilities (`bg-desk-sunken`, `text-desk-fg-3`, `border-desk-line`,
`rounded-desk-control`, `text-desk-ui`, `h-desk-row`, `shadow-desk-float`) — every desk
colour is an alias of a semantic one. Each tier ships its own set precisely so a raw value never becomes the
answer. Never a raw hex, never a Tailwind palette
colour (`bg-slate-100`), never a hardcoded `box-shadow` or duration. The reason is
dark mode: the whole theme flips on `[data-theme="dark"]`, and any literal value is a
bug you can only see in the theme you didn't test. Check both themes before calling a
view done.

## Every view ships four states

A screen is not done when the happy path renders:

1. **Content** — the real thing.
2. **Empty** — designed, not blank: say what would appear here and, where sensible,
   offer the action that creates it. A quiet day should look calm, not broken.
3. **Loading** — a layout-true skeleton (not a lone spinner) for reads that leave the
   machine; pending affordance on the button for writes.
4. **Error** — plain words, recoverable, no stack traces. Missing configuration
   (Stripe/GitHub keys) degrades the feature with a "not configured" note and never
   breaks the rest of the screen — this repo's established pattern.

## Phone and desk are both real surfaces

The admin is used for real work on a laptop and on an iPhone (D-2); the marketing sites are
read on phones.

- Interactive targets ≥ 44px under a thumb. On the desk tier that comes from the tokens:
  size every row and control with a `desk-*` spacing step (`h-desk-row`,
  `size-desk-control`) and the coarse-pointer step lifts it — a hand-picked `h-8` never
  will. What is still lifted globally in the admin's `globals.css` is the marketing `Button`:
  don't undo that, and don't add controls that dodge any floor.
- Primary actions live in the thumb zone; destructive ones do not.
- One-handed entry points are bottom sheets (`Sheet`), not centred dialogs.
- Nothing may be hover-only — every hover affordance needs a visible-on-touch form.
- Fixed chrome respects safe areas (`pb-safe`, `bottom-above-tabs`); horizontal rails
  scroll finger-first (`no-scrollbar`).
- Inputs declare their keyboard: `inputMode`, `autocomplete`, `enterKeyHint`.

## Motion

Quick and confident, from `tokens/motion.css` only: 120–260ms, ease-out, fades and
small translations. Press = colour deepens — never a shrink, never bounce or spring.
Anything animated respects `prefers-reduced-motion`. The marketing tier's one entrance is
`Reveal` (a fade and an 8px rise, once, into view; `Section` already is one — don't add a
second on top of it, and don't invent another). The logo's only choreography is
`LogoLockup`. Loading is the JN icon (`LogoLoader`) on routes and refreshes, and the
"rolling deploy" `Spinner` on a pending button; nothing else loops.

The **desk tier** is stiller still: state changes are instant or a plain ≤120ms colour
transition — no springs, no slides; a sheet or dialog simply appears. Press is a colour
change on every tier, and reduced motion stands everything
still.

## Type and copy

Sentence case everywhere, including buttons and headings. Figures, labels, eyebrows,
and table data go in mono (`--font-mono`) — numbers are the brand's rhetorical device,
so set them where they can carry weight, on every tier. UI text is Hanken Grotesk on both
tiers. First person singular, concrete outcomes, no
exclamation marks, no emoji. CTAs are quiet and specific ("Send brief", not "Get
started now!").

## Before opening the PR

Run this list against the diff:

- [ ] Reused or extended `@jamie-nisbet/ui` rather than forking styles locally
- [ ] Zero raw colours/shadows/durations — semantic tokens only
- [ ] Renders correctly in light **and** dark
- [ ] Empty, loading, and error states designed, not defaulted
- [ ] Works one-handed on a phone: targets, thumb zone, sheets, no hover-only
- [ ] Motion within brand rules and reduced-motion safe
- [ ] On the desk tier: desk primitives reused (`ListRow`, `Pane`, `DataGrid`,
      `DeskButton`), every size a `desk-*` step (no hand-picked heights, no pointer or width
      query in a component), state as a `StatusDot`, a shadow only on what floats, and no
      marketing `Button`, `Card` or `Input` on a desk screen
- [ ] Nothing desk-tier leaked into a marketing site
- [ ] Copy is sentence case, mono where it's a figure, free of emoji and hype
