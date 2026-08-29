# Stub: App tier foundations in packages/ui

- feature-slug: app-tier-foundations
- sequence: 1 of 8
- depends-on: none
- priority: P1
- size: L
- sources: see breakdown.md § Sources

## What this is

The redesign's DNA, in the one place brand DNA is allowed to live. `packages/ui` grows a
sanctioned **app tier** — tokens and primitives that only app-like surfaces (today: the
admin) consume. Marketing sites import nothing new and change in no way.

Deliverables:

**Tokens** (a new `tokens/app.css`, imported by an opt-in entry — e.g. an
`app.css` beside `styles.css` — never by the default marketing path):

- *Materials* — translucent surface levels (thin/regular/thick) with backdrop blur and
  their per-mode values; vibrancy-safe text colours for text sitting on materials.
- *Elevation* — a small shadow scale for floating chrome, sheets, and popovers. Resting
  content stays flat; elevation means "floats above".
- *Motion* — spring parameters (critically damped, subtle) alongside the existing
  durations; named per pattern (sheet, header collapse, row press) rather than free-form.
- *Type* — the native scale: large-title (~34px/bold), title, headline, body 17px,
  subhead 15, footnote 13, caption; `--font-app` = the system font stack
  (`system-ui, -apple-system, …`). Figures keep `--font-mono` (IBM Plex Mono).
- *Shape* — larger continuous-feeling radii for grouped cards and sheets (16–24px class).
- Both light and dark defined from day one; the app follows `prefers-color-scheme`.

**Primitives** (in `src/components/`, exported from the barrel, app-tier only):

- `GroupedList` / `GroupedSection` (header + footer text) / `GroupedRow` (leading icon,
  label, value slot, chevron, destructive variant) — the iOS inset-grouped list.
- `LargeTitleHeader` — scroll-linked collapsing title with a compact bar state.
- A material surface wrapper (the thing tab bars, headers, and sheets are made of).

**Docs** — write the app-tier section into `packages/ui/BRAND.md` and amend
`.claude/skills/design-dna/SKILL.md` per breakdown.md § Brand-rule amendments, so future
sessions inherit the rules instead of fighting them.

Out of scope: touching any `websites/*` app. That starts at sequence 2.

## Prompt

Read `.icm/intake/admin-native-redesign/breakdown.md` and then
`.icm/intake/admin-native-redesign/app-tier-foundations.md` (this stub) in the
`jamienisbet` repo — they carry the decisions and the full deliverable list. Also read
`packages/ui/BRAND.md`, `packages/ui/tokens/`, and the `design-dna` skill first to build
on what exists rather than beside it.

Build the app tier in `packages/ui` as specified: the `tokens/app.css` layer (materials,
elevation, springs, native type scale on the system font stack, shape), the grouped-list
and large-title primitives, and a material surface wrapper — all opt-in, nothing loaded
by the marketing sites' existing import path, both colour modes complete. Then update
`packages/ui/BRAND.md` and `.claude/skills/design-dna/SKILL.md` with the scoped
amendments exactly as breakdown.md records them.

Semantic tokens only at every call site; slate remains the only tint; everything respects
`prefers-reduced-motion`. Work on a `claude/` branch, push, and let CI be the judge —
never run build/lint/typecheck locally. When done, `git mv` this stub to
`.icm/intake/admin-native-redesign/_done/`.
