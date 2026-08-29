# @jamie-nisbet/ui

> **ICM role:** Layer 3 — reference (the factory). The shared design system: brand tokens,
> assets, and reusable React components. Configure once; every website in
> [`../../websites/`](../../websites/) consumes it.
> **Purpose:** One source of truth for visual identity in code, so the whole web estate
> looks unmistakably *Jamie Nisbet*.

This package is the single source of truth for the brand. [`BRAND.md`](BRAND.md) is the human
explainer and the confirmed values; this package ships those values as real CSS custom
properties and React primitives. **They are kept in sync — change one, mirror the other.**

It is built on **Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com)** (new-york style, the
unified `radix-ui` package). The components are idiomatic shadcn primitives themed with the
brand tokens; the aesthetic is **Swiss-minimal**: one disciplined slate-blue (`#3A5A78`),
cool-grey neutrals, Hanken Grotesk + IBM Plex Mono, hairline borders over heavy shadows,
generous whitespace, and a full light **+ dark** theme. The longer brand guide lives in
[`BRAND.md`](BRAND.md).

## What's here
- **`styles.css`** — the **Tailwind v4 app entry**. Apps link this once. It loads Tailwind,
  the brand token variables, and maps the brand semantic aliases onto shadcn's color tokens
  (`@theme inline`) so utilities like `bg-primary` / `text-muted-foreground` render in the
  brand palette and flip with `[data-theme="dark"]`.
- **`app.css`** — the **app tier** entry, opt-in. An *operated* surface (the admin PWA)
  links it right after `styles.css` and gains translucent materials, real elevation, spring
  motion, the native type scale on the system font stack, and larger continuous corners. No
  marketing site links it, and nothing in `styles.css` reaches it. Values live in
  `tokens/app.css`. See [`BRAND.md`](BRAND.md) § App tier and [App tier](#app-tier) below.
- **`tokens.css`** — the **variables-only** layer (no Tailwind). Link this from non-React /
  non-Tailwind surfaces (static HTML, email, slides). `styles.css` is built on top of it.
- **`tokens/`** — CSS custom properties, one file per concern (`colors`, `typography`,
  `spacing`, `radius`, `shadows`, `motion`, `fonts`, `base`). Light is default; dark flips via
  `[data-theme="dark"]`. **Always design against the semantic aliases** (`--surface`,
  `--text-1`, `--border`, `--primary`), not the raw ramps. These declare their variables
  *unlayered*, so they override Tailwind's defaults automatically.
- **`src/components/ui/`** — the shadcn primitives (TSX), plus the glanceable data-viz
  primitives (`Stat`, `Delta`, `Sparkline`, `Meter` — inline SVG, no chart library).
  **`src/components/brand/`** — the brand-only primitives (Eyebrow, IconButton, the JN
  logo marks).
- **`src/lib/utils.ts`** — the `cn()` class-merge helper. **`src/index.ts`** — the barrel.
- **`assets/`** — `logo/` (JN monogram SVGs), `brand/` (social card + email signature HTML),
  `lib/icons.js` (Lucide UMD helper for static HTML).
- **`emails/`** — branded HTML source for Resend's dashboard **Templates** feature (contact/
  referral notifications, invoice reminder, outreach, follow-up). See [`emails/README.md`](emails/README.md).
- **`components.json`** — shadcn config, so `npx shadcn@latest add …` drops new components
  straight into `src/components/ui/`.

## Components
Idiomatic shadcn APIs (compositional, standard variant names), themed with the brand tokens.

| Group | Components |
|---|---|
| Core | `Button`, `Badge`, `Card` (+ `CardHeader`/`CardTitle`/`CardDescription`/`CardAction`/`CardContent`/`CardFooter`) |
| Forms | `Input`, `Label`, `Textarea`, `Select` (+ parts), `Switch` |
| Overlays | `Dialog` (+ parts), `Sheet` (+ parts) — the phone-first bottom sheet, keyboard-aware, optional native detents |
| Feedback | `Alert` (+ `AlertTitle`/`AlertDescription`; variants `default`/`info`/`success`/`warning`/`destructive`) |
| Motion & feedback | `Skeleton` (shapes `line`/`row`/`card`/`stat`/`block`), `Spinner`, `Toaster` + `toast()`, `PendingButton` |
| Data | `Stat`, `Delta`, `Sparkline`, `Meter` — see [Data-viz primitives](#data-viz-primitives) |
| Brand-only | `Eyebrow`, `IconButton`, `LogoMark`, `LogoMarkSolid` |
| App tier | `GroupedList` (+ `GroupedSection`/`GroupedRow`/`GroupedBlock`/`GroupedDisclosure`), `CollapsingHeader`, `LargeTitleHeader`, `IdentityHeader`, `Monogram`, `ActionCircle` (+ `ActionCircleRow`), `Material` — see [App tier](#app-tier) |

Brand tunings over stock shadcn: control radius `5px` (`rounded-sm`), card radius `12px`
(`rounded-lg`), cards rest on a hairline border (no resting shadow), `Badge` is a mono
`text-2xs` chip with muted `success`/`warning` tints, `Alert` uses soft tinted variants.
Every interactive variant press-deepens on `:active` (the primary button lands on
`--primary-active`) — press is a colour change, never a shrink — and `transition-*`
utilities default to the brand clock from `tokens/motion.css` (120–260ms, ease-out).

### Keyboard-aware sheets

`Sheet` lifts itself above the on-screen keyboard and scrolls the focused field into
view (`useKeyboardInset`, exported for anything else pinned to the bottom edge). Apps
that want the layout viewport to shrink instead should set
`interactiveWidget: "resizes-content"` in their Next `viewport` export — the two don't
fight, because the measurement reads zero once the layout viewport has already shrunk.

### Data-viz primitives
Four dependency-free primitives for the numbers on an operating screen — **inline SVG, no
chart library**, every colour from a semantic token so they read in light and dark alike.
They render from plain props: fetching, formatting, and what counts as good news are all
the caller's call.

| Component | What it is | Key props |
|---|---|---|
| `Stat` | The stat tile — mono figure, sentence-case label, optional delta, sparkline and caption. The canonical way a number appears. | `label`, `value`, `unit`, `valueLabel`, `delta`, `trend`, `caption`, `size` (`sm`/`md`/`lg`), `bordered` |
| `Delta` | Trend arrow + signed value (`↗ +12%`). Muted semantic colouring. | `value`, `polarity` (`up-good`/`up-bad`/`none`), `unit`, `precision`, `format`, `comparison`, `size` |
| `Sparkline` | A hairline line/area for a series — a shape, not a chart. No axes, no tooltips. | `data`, `width`, `height`, `strokeWidth`, `area`, `marker`, `fluid`, `tone`, `min`/`max`, `label`, `decorative` |
| `Meter` | A thin bar for part-of-whole. Hairline track, flat brand fill, no gradients. | `value`, `max`, `label`, `valueLabel`, `tone`, `size` |

```tsx
import { Stat, Delta, Sparkline, Meter } from "@jamie-nisbet/ui"

export function MonthAtAGlance() {
  return (
    <div className="grid gap-6 sm:grid-cols-3">
      <Stat
        bordered
        label="Collected this month"
        value="€12,480"
        valueLabel="12,480 euro"
        delta={<Delta value={12} unit="%" comparison="vs last month" />}
        trend={<Sparkline data={[4, 6, 5, 9, 8, 12, 11, 14]} area marker decorative />}
      />
      <Stat
        bordered
        label="Average days to pay"
        value="18"
        // Up is not always good — the caller declares which way is.
        delta={<Delta value={8} polarity="up-bad" unit="%" comparison="vs last month" />}
      />
      <Stat
        bordered
        label="Outstanding"
        value="€3,120"
        trend={<Meter value={12480} max={15600} valueLabel="80% collected" size="sm" />}
      />
    </div>
  )
}
```

Notes:
- **Polarity is explicit.** `Delta` never assumes a rise is good; `up-bad` flips the tint and
  `none` stays muted. A zero always renders flat (`→`) and neutral.
- **Figures are mono, labels are sentence case.** The figure carries the weight; the label
  reads as prose, not a heading.
- **Accessibility.** `Delta` speaks its direction ("Up 12% vs last month") with the arrow
  hidden; `Sparkline` is `role="img"` with a generated summary ("Trend: 8 points, low 4,
  high 14, latest 14.") unless you pass `label`, or `decorative` when nearby text already
  says it; `Meter` is a `role="meter"` with `aria-valuetext`; `Stat` takes `valueLabel` to
  give a compacted figure a spoken form.
- **Empty and out-of-range are handled.** An empty `Sparkline` series draws a hairline
  baseline rather than collapsing; a flat series sits on the mid-line; `Meter` clamps to
  `0…max` and treats `max <= 0` as empty.
- **Fixed by default, `fluid` on request.** A `Sparkline` renders at its `width`/`height`;
  pass `fluid` to stretch it to the container (the stroke stays hairline and the end marker
  stays round).
- **Formatting is yours.** `Stat` takes a pre-formatted `value`; `Delta`'s default figure is
  `en-GB` (fixed, so server and client agree) — pass `format` for currency or a locale.

## Usage (Next.js App Router website)
The package ships **TSX source** (no build step), so consuming apps transpile it and let
Tailwind scan it for class names.

```ts
// next.config.ts — transpile the package's source
const nextConfig = { transpilePackages: ["@jamie-nisbet/ui"] }
export default nextConfig
```

```css
/* app/globals.css — link the theme and tell Tailwind to scan the package.
   (styles.css already pulls in Tailwind, the tokens, and the shadcn theme.)
   Adjust the @source path to where pnpm links the package in your app. */
@import "@jamie-nisbet/ui/styles.css";
@source "../../node_modules/@jamie-nisbet/ui/src";
```

```tsx
// app/layout.tsx — light is default; flip the attribute to theme dark
import "./globals.css"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <body>{children}</body>
    </html>
  )
}
```

```tsx
// any component
import { Button, Card, CardHeader, CardTitle, CardContent, Eyebrow } from "@jamie-nisbet/ui"

export function Brief() {
  return (
    <Card>
      <CardHeader>
        <Eyebrow>New brief</Eyebrow>
        <CardTitle>Start a project</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Send brief</Button>
      </CardContent>
    </Card>
  )
}
```

### App tier

`websites/admin-dashboard` is not a website with a login — it is an installed, one-handed
PWA, and it ships on a second sanctioned tier of this package. The tier is **opt-in**: link
it after the theme, and nothing else in the estate changes.

```css
/* app/globals.css — the app tier, on top of the theme. Order matters:
   app.css assumes Tailwind and the brand tokens are already loaded. */
@import "@jamie-nisbet/ui/styles.css";
@import "@jamie-nisbet/ui/app.css";
@source "../../../packages/ui/src";
```

Then put `app-tier` on the shell's root element — one class that switches the subtree to the
system font stack at the native body size, on the grouped-content canvas.

What it adds, all through utilities so a call site never touches a raw value:

| | Utilities | Tokens |
|---|---|---|
| **Materials** | `material-thin` / `material-regular` / `material-thick`, `text-material-label`(`-2`/`-3`), `border-material-hairline` | `--material-*` |
| **Elevation** | `shadow-app-raised` / `-chrome` / `-sheet` / `-popover` | `--elevation-*` |
| **Motion** | `spring-sheet` / `spring-header` / `spring-press` / `spring-pop` | `--spring-*`, `--duration-*` |
| **Type** | `font-app`, `text-app-large-title` → `text-app-caption-2` | `--app-font`, `--app-text-*`, `--app-leading-*`, `--app-tracking-*` |
| **Shape** | `rounded-app-row` / `-control` / `-group` / `-card` / `-chrome` / `-sheet` | `--app-radius-*` |
| **Surfaces** | `bg-app-canvas` / `bg-app-group` / `bg-app-press`, `text-app-label`(`-2`/`-3`), `text-app-tint`, `border-app-separator` | `--app-*` |
| **Layout** | `px-app-gutter`, `gap-app-section`, `min-h-app-touch`, `min-h-app-bar` | `--app-gutter`, `--app-group-gap`, `--app-touch-min`, `--app-bar-height` |

Springs are **critically damped** — they settle, they never overshoot — so the brand's
no-bounce rule survives; only the shape of the deceleration changes. Durations collapse to
nothing under `prefers-reduced-motion` at the token level, on top of the brand's global
reduced-motion reset. Both colour modes are complete and flip on `[data-theme="dark"]` like
everything else, so the app follows the OS appearance through one mechanism.

```tsx
import {
  ActionCircle, ActionCircleRow, GroupedList, GroupedSection, GroupedRow,
  IdentityHeader, Material,
} from "@jamie-nisbet/ui"
import { Mail, Phone, Receipt } from "lucide-react"

export function LeadProfile() {
  return (
    <>
      <IdentityHeader
        name="Ana Ribeiro"
        meta="Keel · client"
        figure="€3,120"
        figureLabel="Value"
      >
        <ActionCircleRow>
          <ActionCircle icon={<Phone />} label="Call" href="tel:+351910000000" />
          <ActionCircle icon={<Mail />} label="Email" disabled />
        </ActionCircleRow>
      </IdentityHeader>

      <GroupedList>
        <GroupedSection header="Contact">
          <GroupedRow icon={<Mail />} label="Email" value="ana@keel.pt" href="mailto:ana@keel.pt" />
          <GroupedRow icon={<Phone />} label="Phone" value="—" />
        </GroupedSection>

        <GroupedSection header="Money" footer="Drafts are never sent from here.">
          <GroupedRow
            icon={<Receipt />}
            label="Outstanding"
            value={<span className="font-mono">€3,120</span>}
            href="/money"
          />
        </GroupedSection>
      </GroupedList>

      {/* The tab bar the tier is built for: a material that floats over content. */}
      <Material asChild level="thick" elevation="chrome" edge="top">
        <nav className="fixed inset-x-0 bottom-0">…</nav>
      </Material>
    </>
  )
}
```

- **`GroupedRow` is one of four elements**, decided by its props: an `<a>` with `href`, a
  `<button>` with `onClick`, whatever you hand it with `asChild` (a Next `<Link>`, usually),
  and otherwise a read-only `<div>`. Interactive rows press-deepen, sit on the 44px floor,
  and take the disclosure chevron unless `chevron={false}`.
- **A row can carry an `accessory`** — a copy button beside an address, a delete beside a
  todo. It renders *outside* the row's own element (a button inside a button is not a
  thing), and the row gives up its chevron for it.
- **Neither header listens to scroll.** The masthead is in ordinary flow and simply scrolls
  away; a sentinel and an `IntersectionObserver` fade the material and the compact title in
  at the moment it clears the bar. `onCollapsedChange` reports the hand-off to anything else
  that should follow it. `LargeTitleHeader` and `IdentityHeader` are two mastheads over the
  one mechanism (`CollapsingHeader`).
- **Sheets can take detents.** `<SheetContent detents={["medium", "large"]}>` makes the
  phone sheet rest at native heights: drag the handle between them, drag it off the bottom
  to dismiss, or tap it to step. It is a phone behaviour — from `sm` up the sheet is the
  centred dialog it always was.
- **A figure is still mono.** Pass `<span className="font-mono">€3,120</span>` into a row's
  `value` — the tier changes the UI face, never the brand's signature for numbers.

### Dark mode
Theming is driven by the `[data-theme="dark"]` attribute (not the `.dark` class). Set
`data-theme` on `<html>` — e.g. with a small client toggle or `next-themes`
(`attribute="data-theme"`). The brand semantic aliases flip, and every shadcn color token
flips with them.

### Motion & feedback
All animation rides `tokens/motion.css` (durations, easings, and the two loop speeds
`--duration-spin`/`--duration-shimmer`) and honours `prefers-reduced-motion`.

- **`Skeleton`** — brand-quiet loading placeholder: the sunken surface with a slow
  highlight sweep (static under reduced motion). `shape` picks a layout — `line` (a text
  line), `row` (a list row), `card`, `stat` (a mono figure) — or the default free-form
  `block` you size with `className`. Skeletons are `aria-hidden`; mark the region they
  stand in for with `aria-busy`.
- **`Spinner`** — the "rolling deploy": a ring of six segments turning steadily, the one
  decorative loop the brand allows. Draws in `currentColor` at icon size, so it drops
  into buttons as-is. Standalone it announces "Loading"; inside a labelled control pass
  `aria-hidden`.
- **`Toaster` + `toast()`** — quiet confirmations for actions that resolve off-screen.
  Mount `<Toaster />` once in the root layout, then `toast("Saved")`,
  `toast.success("Invoice sent")`, `toast.error("Couldn't save", { description: "…" })`.
  Bottom-centre on phones (safe-area aware — set `--toaster-offset` to the height of any
  fixed chrome, e.g. `3.5rem` for the admin's tab bar), bottom-right from `sm` up.
  Auto-dismisses after 4s, three visible at most, tap to dismiss early — no stacking
  circus.
- **`PendingButton`** — a `Button` that acknowledges the press: spinner in, label
  swapped for `pendingText`, disabled, `aria-busy`. Inside a `<form action={…}>` it
  reads `useFormStatus()` by itself; for `useTransition` flows pass
  `pending={isPending}`.

```tsx
// a server-action form — pending state comes free
<form action={sendBrief}>
  <PendingButton pendingText="Sending…">Send brief</PendingButton>
</form>

// a useTransition flow
const [isPending, startTransition] = useTransition()
<PendingButton
  pending={isPending}
  pendingText="Saving…"
  variant="outline"
  onClick={() => startTransition(() => markTouched(id))}
>
  Mark touched
</PendingButton>
```

### Icons
The brand icon system is [Lucide](https://lucide.dev). In React apps import `lucide-react`
directly (it's a dependency of this package). For static HTML / UMD surfaces (slides, email,
social cards) use `assets/lib/icons.js` → `<Icon name="ArrowRight" size={18} />`, or
`<i data-lucide="check"></i>` + `lucide.createIcons()`.

### Adding more components
```bash
# from packages/ui — components.json is already configured (new-york, lucide, slate base)
npx shadcn@latest add <name>
```
New components land in `src/components/ui/`. Re-tune their radii to the brand control/card
values and export them from `src/index.ts`.

## Rules
- **One source of truth.** This package (with [`BRAND.md`](BRAND.md) as the human guide) is it.
  Never hard-code a value a token already names; if the brand changes, update `BRAND.md`
  **and** these tokens together. Token *values* live in `tokens/*.css`.
- **No per-site overrides.** Websites theme via `data-theme` and compose these primitives;
  they don't fork the tokens or re-implement a `Button`.
- **Fonts** load from Google Fonts CDN (see `tokens/fonts.css`; `styles.css` hoists the same
  `@import` to the top). To self-host, drop woff2 files in `assets/fonts/` and swap the
  `@import` for local `@font-face` rules. Apps may alternatively load the fonts via `next/font`.
