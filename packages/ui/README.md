# @jamie-nisbet/ui

> **ICM role:** Layer 3 — reference (the factory). The shared design system: tokens,
> brand assets, and reusable React components. Configure once; every website in
> [`../../websites/`](../../websites/) consumes it.
> **Purpose:** One source of truth for visual identity in code, so the whole web estate
> looks unmistakably *Jamie Nisbet*.

This package is the code embodiment of the brand defined in
[`_config/brand/visual/`](../../_config/brand/visual/). The brand docs are the human
explainer and the confirmed values; this package ships those values as real CSS custom
properties and React primitives. **They are kept in sync — change one, mirror the other.**

The aesthetic is **Swiss-minimal**: one disciplined slate-blue (`#3A5A78`), cool-grey
neutrals, Hanken Grotesk + IBM Plex Mono, hairline borders over heavy shadows, generous
whitespace, and a full light **+ dark** theme. The longer brand guide (voice, visual
foundations, iconography) lives in [`BRAND.md`](BRAND.md).

## What's here
- **`styles.css`** — the single global entry point. It is an `@import` manifest only;
  consumers link this one file. Everything it transitively imports (the `tokens/` files
  and the webfont `@font-face`/`@import`) is the shipped foundation.
- **`tokens/`** — CSS custom properties, one file per concern (`colors.css`,
  `typography.css`, `spacing.css`, `radius.css`, `shadows.css`, `motion.css`, `fonts.css`,
  `base.css`). Light is default; dark flips via `[data-theme="dark"]`. **Always design
  against the semantic aliases** (`--surface`, `--text-1`, `--border`, `--primary`), not
  the raw ramps.
- **`components/`** — reusable React primitives, grouped by concern. Each is a named
  `export function <Name>` with a sibling `.d.ts` (props contract) and `.prompt.md`
  (usage). Self-contained: they import React only and style via the CSS variables, so they
  work the moment `styles.css` is linked. All are marked `'use client'` for the Next.js App
  Router.
- **`assets/`** — `logo/` (wordmark + JN monogram marks), `brand/` (social card + email
  signature HTML), `lib/icons.js` (Lucide → React `<Icon>` helper for UMD/static surfaces).
- **`index.js` / `index.d.ts`** — the barrel. Import components from the package root.
- **`SKILL.md`** — makes this folder usable as a downloadable Agent Skill.

## Components
| Group | Components |
|---|---|
| `core/` | Button, IconButton, Badge, Card, Avatar, Eyebrow |
| `forms/` | Input, Textarea, Select, Checkbox, Switch |
| `navigation/` | Tabs |
| `feedback/` | Alert, Dialog |

## Usage (Next.js App Router website)
Link the package as a workspace dependency, then:

```tsx
// app/layout.tsx — link the tokens + fonts once at the root
import '@jamie-nisbet/ui/styles.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light">{/* flip to "dark" to theme */}
      <body>{children}</body>
    </html>
  );
}
```

```tsx
// any client component
import { Button, Card, Input } from '@jamie-nisbet/ui';

export function Brief() {
  return (
    <Card title="Start a project" eyebrow="New brief">
      <Input label="Email" placeholder="you@team.com" />
      <Button variant="primary">Send brief</Button>
    </Card>
  );
}
```

### Icons
The brand icon system is [Lucide](https://lucide.dev) (1.5–2px stroke). In production React
apps install `lucide-react` and use it directly. For static HTML / UMD surfaces (slides,
email, social cards) use `assets/lib/icons.js` → `<Icon name="ArrowRight" size={18} />`, or
`<i data-lucide="check"></i>` + `lucide.createIcons()`.

## Rules
- **One source of truth.** This package mirrors [`_config/brand/visual/`](../../_config/brand/visual/).
  Never hard-code a hex/size a token already names; if the brand changes, update the brand
  docs **and** these tokens together.
- **No per-site overrides.** Websites theme via `data-theme` and compose these primitives;
  they don't fork the tokens or re-implement a `Button`.
- **Fonts** currently load from Google Fonts CDN (see `tokens/fonts.css`). To self-host,
  drop woff2 files in `assets/fonts/` and swap the `@import` for local `@font-face` rules.
