# @jamie-nisbet/ui

> **ICM role:** Layer 3 — reference (the factory). The shared design system: brand tokens,
> assets, and reusable React components. Configure once; every website in
> [`../../websites/`](../../websites/) consumes it.
> **Purpose:** One source of truth for visual identity in code, so the whole web estate
> looks unmistakably *Jamie Nisbet*.

This package is the code embodiment of the brand defined in
[`_config/brand/visual/`](../../_config/brand/visual/). The brand docs are the human
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
- **`src/components/ui/`** — the shadcn primitives (TSX). **`src/components/brand/`** — the
  brand-only primitives (Eyebrow, IconButton, the JN logo marks).
- **`src/lib/utils.ts`** — the `cn()` class-merge helper. **`src/index.ts`** — the barrel.
- **`assets/`** — `logo/` (JN monogram SVGs), `brand/` (social card + email signature HTML),
  `lib/icons.js` (Lucide UMD helper for static HTML).
- **`components.json`** — shadcn config, so `npx shadcn@latest add …` drops new components
  straight into `src/components/ui/`.

## Components
Idiomatic shadcn APIs (compositional, standard variant names), themed with the brand tokens.

| Group | Components |
|---|---|
| Core | `Button`, `Badge`, `Card` (+ `CardHeader`/`CardTitle`/`CardDescription`/`CardAction`/`CardContent`/`CardFooter`), `Avatar` (+ `AvatarImage`/`AvatarFallback`) |
| Forms | `Input`, `Label`, `Textarea`, `Select` (+ parts), `Checkbox`, `Switch` |
| Navigation | `Tabs` (+ `TabsList`/`TabsTrigger`/`TabsContent`) |
| Feedback | `Alert` (+ `AlertTitle`/`AlertDescription`; variants `default`/`info`/`success`/`warning`/`destructive`), `Dialog` (+ parts) |
| Brand-only | `Eyebrow`, `IconButton`, `LogoMark`, `LogoMarkSolid` |

Brand tunings over stock shadcn: control radius `5px` (`rounded-sm`), card radius `12px`
(`rounded-lg`), cards rest on a hairline border (no resting shadow), `Badge` is a mono
`text-2xs` chip with muted `success`/`warning` tints, `Alert` uses soft tinted variants.

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
- **One source of truth.** This package mirrors [`_config/brand/visual/`](../../_config/brand/visual/).
  Never hard-code a value a token already names; if the brand changes, update the brand docs
  **and** these tokens together. Token *values* live in `tokens/*.css` and
  [`_config/brand/visual/tokens.json`](../../_config/brand/visual/tokens.json).
- **No per-site overrides.** Websites theme via `data-theme` and compose these primitives;
  they don't fork the tokens or re-implement a `Button`.
- **Fonts** load from Google Fonts CDN (see `tokens/fonts.css`; `styles.css` hoists the same
  `@import` to the top). To self-host, drop woff2 files in `assets/fonts/` and swap the
  `@import` for local `@font-face` rules. Apps may alternatively load the fonts via `next/font`.
