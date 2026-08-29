---
name: design-dna
description: The per-turn design checklist for any UI work in this repo. Use this skill whenever you create, change, or review anything a user sees — components, screens, pages, layouts, styling, forms, dialogs/sheets, navigation, loading or error handling, emails, or copy shown in the UI — in any of the websites/* apps or packages/ui, even if the task doesn't mention "design". It is how a change ends up looking and feeling like this product instead of default shadcn.
---

# Design DNA — how UI ships in this repo

The brand is **Swiss-minimal, quiet, casual confidence**: one slate blue, cool-grey
neutrals, hairline 1px borders doing the structural work, generous whitespace, mono
figures, sentence case. Quiet does **not** mean flat — hierarchy comes from weight,
size, spacing, and real states, not from decoration. No gradients, no emoji, no neon,
no bounce.

That is the **marketing tier**, and it is the default. `websites/admin-dashboard` is the
one exception: it is an operated PWA on the sanctioned **app tier**, where four rules bend.
Read § Which tier am I on? below before you decide anything looks wrong.

Identity and token specifics live in one place — read them, don't restate them:

- [`packages/ui/BRAND.md`](../../../packages/ui/BRAND.md) — voice, visual foundations, iconography, **§ App tier**.
- [`packages/ui/tokens/`](../../../packages/ui/tokens/) — the values (colour, type, spacing, radius, shadows, motion), plus `app.css` for the app tier.
- [`packages/ui/SKILL.md`](../../../packages/ui/SKILL.md) — the package tour: assets, components, how to consume.

## Which tier am I on?

**Marketing tier** — `websites/portfolio`, `websites/payment-gateway`, `websites/sellers-site`,
and anything in `packages/ui` outside `src/components/app/`. Everything on this page applies
as written. Nothing below changes for you.

**App tier** — `websites/admin-dashboard` and `packages/ui/src/components/app/`. An installed,
one-handed PWA that should feel like an iOS-class app, not a website with a login. It opts in
by linking `@jamie-nisbet/ui/app.css` *after* `styles.css`, and only then. Four rules bend,
scoped to it (decided 2026-08-29, recorded in
[`.icm/intake/admin-native-redesign/breakdown.md`](../../../.icm/intake/admin-native-redesign/breakdown.md)
and [`packages/ui/BRAND.md`](../../../packages/ui/BRAND.md) § App tier):

1. **Materials are structural, not a licensed exception.** Translucency + backdrop blur is
   what floating chrome, title bars, sheets and popovers are made of — `Material` with
   `level="thin|regular|thick"`. Text on one takes `text-material-label` / `-2`, which run a
   stop stronger than the page's.
2. **Elevation exists.** `shadow-app-chrome` / `-sheet` / `-popover` / `-raised` mean "this
   floats above content". Resting content is still flat on a hairline.
3. **Springs are sanctioned.** `spring-sheet` / `spring-header` / `spring-press` /
   `spring-pop` — critically damped, so they settle and never overshoot. No bounce, still no
   spring for decoration, and reduced motion collapses them at the token level.
4. **UI text sets in the system font stack** (`font-app`) on the native scale
   (`text-app-large-title` → `text-app-caption-2`). Hanken Grotesk does not come here.
   **Mono figures do**: numbers, metadata and table data stay `font-mono` on every tier.

The app tier's structural unit is the inset grouped list — `GroupedList` / `GroupedSection` /
`GroupedRow` (`accessory` for a second control on a row), plus `GroupedBlock` for prose in a
slab and `GroupedDisclosure` for a fold. A screen's masthead is `LargeTitleHeader` (a list's
name) or `IdentityHeader` (a profile: `Monogram`, name, meta, the figure in mono), with
`ActionCircleRow` / `ActionCircle` for the actions under an identity — an action the record
can't support is disabled, never hidden — and `GlanceRow` / `GlanceFigure` for what a list
screen adds up to, in place of a subtitle sentence. A closed set of filters is a
`SegmentedControl`; an open-ended one stays a scrolling rail. A phone sheet that holds a form takes native
detents: `<SheetContent detents={["medium", "large"]}>`. Reach for those before a table or a
bare `Card`; the desktop tables are being retired, one codepath from phone to laptop.

Everything else holds on both tiers, unchanged: slate is the only tint (`--app-tint` *is*
`--primary`; no per-domain accents), semantic colour is state-only and muted, sentence case,
no emoji, semantic tokens only, the 44px touch floor, four designed states.

## Before writing any component

Check the `@jamie-nisbet/ui` barrel first (`packages/ui/src/components/`). If a
primitive exists, use it; if it *almost* exists, extend it in the package rather than
forking a local copy — the package is the single brand source and every app inherits
the fix. A new primitive that two screens could use belongs in `packages/ui`, not in an
app's `components/`.

## Tokens, not values

Every colour, radius, shadow, duration, and font comes from a semantic token
(`--surface`, `--text-1`, `--border`, `--primary`, …) or its shadcn utility
(`bg-card`, `text-muted-foreground`, …). On the app tier that means the app-tier
tokens and their utilities (`bg-app-group`, `text-app-label-2`, `border-app-separator`,
`rounded-app-group`, `text-app-body`, `shadow-app-chrome`) — the tier ships its own set
precisely so a raw value never becomes the answer. Never a raw hex, never a Tailwind palette
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

## Mobile is the primary surface

The admin is an installed, one-handed PWA; the marketing sites are read on phones.

- Interactive targets ≥ 44px on coarse pointers (the floor is lifted globally in the
  admin's `globals.css` — don't undo it, and don't add controls that dodge it).
- Primary actions live in the thumb zone; destructive ones do not.
- One-handed entry points are bottom sheets (`Sheet`), not centred dialogs.
- Nothing may be hover-only — every hover affordance needs a visible-on-touch form.
- Fixed chrome respects safe areas (`pb-safe`, `bottom-above-tabs`); horizontal rails
  scroll finger-first (`no-scrollbar`).
- Inputs declare their keyboard: `inputMode`, `autocomplete`, `enterKeyHint`.

## Motion

Quick and confident, from `tokens/motion.css` only: 120–260ms, ease-out, fades and
~2px translations. Press = colour deepens — never a shrink, never bounce or spring.
Anything animated respects `prefers-reduced-motion`. The one decorative loop allowed
is the "rolling deploy" spinner.

On the **app tier**, spring motion is sanctioned where iOS muscle memory expects it — sheet
detents, header collapse, row press — through the pattern utilities `spring-sheet`,
`spring-header`, `spring-press`, `spring-pop` from `tokens/app.css`. Name the pattern, never
the curve, and never invent one. They are critically damped: they settle without overshoot,
so "no bounce" still holds. Press is still a colour change, and reduced motion still stands
everything still.

## Type and copy

Sentence case everywhere, including buttons and headings. Figures, labels, eyebrows,
and table data go in mono (`--font-mono`) — numbers are the brand's rhetorical device,
so set them where they can carry weight, on the app tier as much as anywhere. UI text
is Hanken Grotesk on the marketing tier and the system stack (`font-app`) on the app tier. First person singular, concrete outcomes, no
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
- [ ] On the app tier: grouped-list primitives reused, materials and elevation from the tier's
      tokens, springs named by pattern — and nothing app-tier leaked into a marketing site
- [ ] Copy is sentence case, mono where it's a figure, free of emoji and hype
