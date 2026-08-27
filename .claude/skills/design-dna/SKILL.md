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

Identity and token specifics live in one place — read them, don't restate them:

- [`packages/ui/BRAND.md`](../../../packages/ui/BRAND.md) — voice, visual foundations, iconography.
- [`packages/ui/tokens/`](../../../packages/ui/tokens/) — the values (colour, type, spacing, radius, shadows, motion).
- [`packages/ui/SKILL.md`](../../../packages/ui/SKILL.md) — the package tour: assets, components, how to consume.

## Before writing any component

Check the `@jamie-nisbet/ui` barrel first (`packages/ui/src/components/`). If a
primitive exists, use it; if it *almost* exists, extend it in the package rather than
forking a local copy — the package is the single brand source and every app inherits
the fix. A new primitive that two screens could use belongs in `packages/ui`, not in an
app's `components/`.

## Tokens, not values

Every colour, radius, shadow, duration, and font comes from a semantic token
(`--surface`, `--text-1`, `--border`, `--primary`, …) or its shadcn utility
(`bg-card`, `text-muted-foreground`, …). Never a raw hex, never a Tailwind palette
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

## Type and copy

Sentence case everywhere, including buttons and headings. Figures, labels, eyebrows,
and table data go in mono (`--font-mono`) — numbers are the brand's rhetorical device,
so set them where they can carry weight. First person singular, concrete outcomes, no
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
- [ ] Copy is sentence case, mono where it's a figure, free of emoji and hype
