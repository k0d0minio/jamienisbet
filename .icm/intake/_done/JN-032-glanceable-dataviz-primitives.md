# JN-032 · Glanceable data-viz primitives in @jamie-nisbet/ui

| | |
|---|---|
| Status | today |
| Type | feature |
| Priority | P1 |
| Size | M |

## Problem

Every number in the admin is a bare figure in a table or header. The brand explicitly
treats numbers as a rhetorical device (mono, weighty), but there is nothing between "a
mono `<span>`" and nothing — no trend, no shape, no at-a-glance read. Money is four
tables; the Leads header is three totals you have to parse.

## Build

Small, dependency-free (inline SVG, no chart library) primitives in
`packages/ui/src/components/ui/`, brand-styled and dark-safe:

- **`stat.tsx`** — the stat tile: mono figure, sentence-case label, optional delta.
  This is the canonical way a number appears on an operating screen.
- **`delta.tsx`** — trend arrow + signed value (`↗ +12%` idiom from the brand), muted
  semantic colouring (up ≠ always good — caller decides polarity).
- **`sparkline.tsx`** — a hairline SVG line/area for a series (payments over weeks,
  leads over weeks). Stroke `--primary`, ~1.5px, no axes, no tooltips — it's a shape,
  not a chart.
- **`meter.tsx`** — a thin horizontal bar for part-of-whole (e.g. outstanding vs
  collected). Hairline track, brand fill, no gradients.

Rules: all colour from semantic tokens; figures in `--font-mono`; components render
from plain props (no data-fetching); each documented in the package README. Consult the
`dataviz` skill's guidance when building — accessibility (aria labels for figures,
series described in text) included.

Consumers land in later tickets (JN-033 Leads cockpit, JN-034 Money) — this ticket is
the primitives only, so it stays reviewable.

## Acceptance

- [ ] `Stat`, `Delta`, `Sparkline`, `Meter` exported from the barrel, documented
- [ ] Zero new dependencies; inline SVG only
- [ ] Legible in both themes; sensible `aria` for screen readers
- [ ] CI green

## Prompt

Add glanceable data-viz primitives to the @jamie-nisbet/ui design system: a stat tile,
delta (trend arrow + signed value), sparkline, and meter — inline SVG, no chart library.
Read .icm/intake/JN-032-glanceable-dataviz-primitives.md for full context and
packages/ui/BRAND.md for the visual rules (mono figures, hairline strokes, semantic
tokens, no gradients, muted semantic colours). Components take plain props, live in
packages/ui/src/components/ui/, export from the barrel, documented in the package
README. Open a PR on a claude/ branch; do not run local checks — CI is the source of
truth.
