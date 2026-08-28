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
| Core | `Button`, `Badge`, `Card` (+ `CardHeader`/`CardTitle`/`CardDescription`/`CardAction`/`CardContent`/`CardFooter`), `Avatar` (+ `AvatarImage`/`AvatarFallback`) |
| Forms | `Input`, `Label`, `Textarea`, `Select` (+ parts), `Checkbox`, `Switch`, `PendingButton` |
| Navigation | `Tabs` (+ `TabsList`/`TabsTrigger`/`TabsContent`) |
| Overlays | `Dialog` (+ parts), `Sheet` (+ parts) — the phone-first bottom sheet, keyboard-aware |
| Feedback | `Alert` (+ `AlertTitle`/`AlertDescription`; variants `default`/`info`/`success`/`warning`/`destructive`), `Skeleton` (+ `SkeletonText`/`SkeletonRow`/`SkeletonFigure`), `Spinner`, `Toaster` + `toast()` |
| Data | `Stat`, `Delta`, `Sparkline`, `Meter` — see [Data-viz primitives](#data-viz-primitives) |
| Brand-only | `Eyebrow`, `IconButton`, `LogoMark`, `LogoMarkSolid` |

Brand tunings over stock shadcn: control radius `5px` (`rounded-sm`), card radius `12px`
(`rounded-lg`), cards rest on a hairline border (no resting shadow), `Badge` is a mono
`text-2xs` chip with muted `success`/`warning` tints, `Alert` uses soft tinted variants.

### Motion & feedback

Four primitives cover the gap between "the action fired" and "the page came back", all
driven by `tokens/motion.css` and all silent under `prefers-reduced-motion`:

- **`Spinner`** — the "rolling deploy" loop, the one decorative animation BRAND.md
  licenses. Inherits `currentColor` and `size-4`, so it drops into a button label as-is.
  Pass `label=""` beside text that already says what's happening.
- **`Skeleton`** and its shapes (`SkeletonText`, `SkeletonRow`, `SkeletonFigure`) — for
  reads that leave the machine. A skeleton stands in for what's coming, at its size and
  in its place; a lone spinner on an empty page is not one. Pair with `loading.tsx`.
- **`toast(message, { tone })`** (plus `toast.success` / `toast.error`) with a single
  **`<Toaster />`** mounted at the app root. For outcomes you can't see from where you're
  standing — a row archived out of the list, a link copied, an optimistic edit the server
  refused. Bottom-centre on a phone, bottom-right from `sm` up; pass `className` to clear
  a fixed tab bar. No provider needed: `toast()` broadcasts on a document event.
- **`PendingButton`** — a submit that shows it's working. Inside `<form action={…}>` it
  reads `useFormStatus` on its own; drive it from `useTransition` by passing `pending`.
  `pendingLabel` swaps the words while it runs.

`Sheet` also lifts itself above the on-screen keyboard and scrolls the focused field into
view (`useKeyboardInset`, exported for anything else pinned to the bottom edge). Apps
that want the layout viewport to shrink instead should set
`interactiveWidget: "resizes-content"` in their Next `viewport` export — the two don't
fight.

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

### Dark mode
Theming is driven by the `[data-theme="dark"]` attribute (not the `.dark` class). Set
`data-theme` on `<html>` — e.g. with a small client toggle or `next-themes`
(`attribute="data-theme"`). The brand semantic aliases flip, and every shadcn color token
flips with them.

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
