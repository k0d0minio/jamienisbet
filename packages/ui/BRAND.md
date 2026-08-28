# Jamie Nisbet — Design System

The brand and UI system for **Jamie Nisbet**, a freelance consultant and software engineer specialising in **AI infrastructure and bespoke solutions** for businesses of all sizes.

The brand voice is *quiet, casual confidence* — professional without being corporate. The visual language is **Swiss-minimal**: generous whitespace, a single disciplined slate-blue, hairline borders over heavy shadows, and a monospace accent that signals the engineer behind the work.

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

**Colour.** One brand hue: **slate blue**, base `--blue-600 #3A5A78` — the restrained, professional answer to a louder Majorelle. Neutrals are *cool* grey (never pure black; text tops out at `--neutral-900`). Semantic colours (success/warning/danger) are **muted, never neon**. Always design against the semantic aliases (`--surface`, `--text-1`, `--border`, `--primary`), which flip correctly between the **light and dark** themes via `[data-theme="dark"]`.

**Type.** **Hanken Grotesk** (neutral grotesque) for everything structural; **IBM Plex Mono** as the engineer's signature — eyebrows, metadata, figures, code, and table data. Hierarchy comes from **weight + size + tight tracking** (`-0.02` to `-0.03em` on display sizes), not decoration. Body is 16px at 1.5–1.65 leading. Weights 300–800; headings sit at 600.

**Spacing & layout.** 4px base grid, used *generously* — whitespace is the brand. Content max-widths: prose ~640px, marketing ~1080px. Sections breathe (`--section-y` = 96px).

**Backgrounds & texture.** Mostly flat `--surface` / `--bg`. The single permitted texture is the **blueprint grid** (`.dst-grid-bg`, 32–48px, ~5% opacity) behind heroes, section breaks, and dark covers — structural, never over body text. **No gradients** as decoration (the only gradient is the sticky-header backdrop blur). Faint grain is acceptable; loud imagery is not. Imagery, when present, is cool-toned and restrained — but the brand is comfortable being **type-and-data-led with no photography at all**.

**Corners & borders.** Tight, precise radii: controls `5px`, cards `12px`, large panels `16–24px`, pills full. **Hairline 1px borders** (`--border`) do most of the structural work; they're the primary way surfaces are separated.

**Elevation.** Shadows are **soft and low** and used sparingly — a card resting state is usually *just a border*. Shadow appears mainly on hover (cards lift `translateY(-2px)` + `--shadow-md`) and on overlays/dialogs (`--shadow-xl`).

**Motion.** Quick and confident: 120–260ms, ease-out (`cubic-bezier(0.2,0,0,1)`). **No bounce, no spring.** Transitions are fades and small (2px) translations. Hover = subtle background/border shift or a small lift; **press = colour deepens** (`--primary-active`), never a cartoonish shrink. A single decorative loop is allowed (the "rolling deploy" spinner); loops — the spinner and the skeleton shimmer — run on `--duration-spin`/`--duration-shimmer`, far slower than any transition. Respects `prefers-reduced-motion` (loops stand still; transitions snap).

**Cards.** Surface fill, 1px `--border`, 12px radius, generous padding (`--space-5`). Interactive cards add a hover lift. No coloured left-border accents, no drop-shadow-by-default.

**Data & figures.** Numbers are the brand's rhetorical device, so they get a form of their own rather than a chart library. The stat tile is the canonical carrier: mono figure, sentence-case label, optional delta beside it. Trend reads as `↗ +12%` — a unicode arrow and a signed mono value, tinted with a **muted** semantic colour and only ever by a polarity the caller declares (a rise is not always good news). A series is drawn as a **hairline ~1.5px sparkline** — a shape, not a chart: no axes, no gridlines, no tooltips, and an area wash at most 10% of the same hue. Part-of-whole is a thin bar with a hairline track and a flat fill. **No gradients, no second axis, no neon.** Every one of these ships in `packages/ui` as `Stat` / `Delta` / `Sparkline` / `Meter`.

**Transparency & blur.** Reserved: the sticky site header (`backdrop-filter: blur(10px)` over a translucent `--bg`) and the dialog overlay. Not used decoratively.

---

## Iconography

- **System: [Lucide](https://lucide.dev)** — 1.5–2px stroke, rounded caps/joins. It matches the brand's precise, unfussy line. *(This is a chosen substitute — no icon set was supplied in the brief. Swap if you have a preferred set.)*
- **Delivery:** in React apps import `lucide-react` directly (a dependency of `@jamie-nisbet/ui`). In static HTML / UMD surfaces (slides, docs, email) use the shared helper `assets/lib/icons.js` → `<Icon name="ArrowRight" size={18} />` (PascalCase Lucide names), or `<i data-lucide="check"></i>` + `lucide.createIcons()`.
- **Usage:** icons are functional, not decorative — they sit in buttons, nav, status rows, and feature lists at `15–21px`. Tinted `--text-3` at rest, `--primary` when they carry meaning (active nav, feature accents).
- **No emoji. No multicolour/3D icons.** Unicode arrows (`↗`) are fine inline in mono labels.
- **Logo** is bespoke (not an icon): see `assets/logo/`. The brand leads with the **Hanken Grotesk wordmark** ("Jamie Nisbet"); the compact mark is a **typographic JN monogram** (J first) in the same family — `mark-monogram.svg` (currentColor) and `mark-monogram-solid.svg` (white JN on a slate tile) for app/sidebar/favicon use. *(Locked 2026-06-15: the earlier abstract node/stack marks were dropped at the user's request.)*

---

## Index / manifest

This package (`@jamie-nisbet/ui`) ships the foundations, assets, and components below.
The full design exploration (UI kits, slides, proposal doc, specimen cards) lives in the
source Claude Design bundle and is not re-shipped here — lift patterns from it as needed.

**Foundations** — built on **Tailwind CSS v4 + shadcn/ui** (new-york, unified `radix-ui`).
- `styles.css` — the Tailwind v4 + shadcn theme entry; React apps link this one file. It maps the brand semantic aliases onto shadcn's color tokens.
- `tokens.css` — the variables-only layer for non-Tailwind surfaces (static HTML, email, slides).
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `radius.css`, `shadows.css`, `motion.css`, `fonts.css`, `base.css`.

**Assets** (`assets/`)
- `logo/` — `mark-monogram.svg` (currentColor JN), `mark-monogram-solid.svg` (white JN on slate tile).
- `brand/` — `social-card.html` (1200×630 OG), `email-signature.html`.
- `lib/icons.js` — shared Lucide → `<Icon>` helper for UMD/static surfaces.

**Components** (TSX, idiomatic shadcn/ui themed with the brand tokens; import from the `@jamie-nisbet/ui` barrel)
- `src/components/ui/` — Button, Badge, Card, Avatar, Input, Label, Textarea, Select, Checkbox, Switch, Tabs, Alert, Dialog, Sheet, plus the motion/feedback set: Skeleton, Spinner, Toaster + `toast()`, PendingButton. Compositional where shadcn is (e.g. `Card` + `CardHeader` + `CardTitle`; `Tabs` + `TabsList` + `TabsTrigger`). Also the glanceable data-viz primitives — Stat, Delta, Sparkline, Meter (inline SVG, no chart library; see § Data & figures).
- `src/components/brand/` — Eyebrow, IconButton, LogoMark / LogoMarkSolid (brand-only; no shadcn equivalent).
- `src/lib/utils.ts` — the `cn()` class-merge helper. Types come from the TSX source.

**Consuming the package** — see `README.md`. **Skill** — `SKILL.md` makes this folder usable as an Agent Skill.
