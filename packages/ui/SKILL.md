---
name: jamie-nisbet-design
description: Use this skill to generate well-branded interfaces and assets for Jamie Nisbet (freelance AI-infrastructure consultant & software engineer), either for production or throwaway prototypes/mocks/decks. Contains the brand's design guidelines, colours, type, fonts, logo assets, icon system, and reusable React components.
user-invocable: true
---

Read the `BRAND.md` file within this skill first — it holds the brand context, content fundamentals, visual foundations, and iconography rules. Then explore the other available files. (`README.md` covers how to consume the package from a website.)

## What's here
- `styles.css` — the **Tailwind v4 + shadcn/ui** theme entry; React apps link this one file. `tokens.css` + `tokens/` — the variables-only token system (colour, type, spacing, radius, shadow, motion, fonts) for non-Tailwind surfaces. Light + dark via `[data-theme="dark"]`. Design against the semantic aliases (`--surface`, `--text-1`, `--border`, `--primary`) / the shadcn utilities (`bg-card`, `text-muted-foreground`).
- `app.css` + `tokens/app.css` — the **app tier**: an opt-in second surface language for *operated* screens (the admin PWA), linked after `styles.css` and by nothing a marketing site imports. Translucent materials, real elevation, critically-damped springs, the native type scale on the system font stack, larger corners. Rules in `BRAND.md` → App tier.
- `assets/logo/` — logo marks (JN monogram + slate-tile variant). `assets/brand/` — social card + email signature. `assets/lib/icons.js` — Lucide `<Icon>` helper for UMD/static surfaces.
- `src/components/app/` — the app-tier primitives: `GroupedList`/`GroupedSection`/`GroupedRow` (the inset grouped list), `LargeTitleHeader`, `Material`. Same barrel, but inert unless the surface links `app.css`.
- `src/components/` — idiomatic shadcn/ui primitives (TSX, Button/Card/Input/Badge/Dialog/…) themed with the brand tokens, the glanceable data-viz primitives (Stat / Delta / Sparkline / Meter — inline SVG, no chart library), plus brand-only Eyebrow / IconButton / logo marks. Import from the package barrel (`@jamie-nisbet/ui`).

## How to work
- **Voice:** quiet, casual confidence. First person ("I…"), sentence case, no emoji, no hype. Mono for labels/figures. Let numbers carry weight. (Full rules in `BRAND.md` → Content fundamentals.)
- **Visuals:** one slate-blue (`--blue-600 #3A5A78`), cool-grey neutrals, hairline borders, generous whitespace, blueprint-grid texture only, soft/low shadows, quick no-bounce motion. (Full rules in `BRAND.md` → Visual foundations.)
- **Icons:** Lucide, 1.5–2px stroke. React → `<Icon name="ArrowRight"/>`; static HTML → `<i data-lucide="…">` + `lucide.createIcons()`.

If creating **visual artifacts** (slides, mocks, throwaway prototypes, social cards): copy the assets you need out of this skill and produce static HTML files that link `styles.css`, so the user can view them directly.

If working on **production code**: copy assets and read the rules here to become an expert in designing with this brand. Reuse the component primitives rather than re-implementing them.

If the user invokes this skill without other guidance, ask them what they want to build or design, ask a few focused questions (surface, audience, light/dark, how many variations), then act as an expert designer who outputs HTML artifacts *or* production code, depending on the need.
