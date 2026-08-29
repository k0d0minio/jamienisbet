# Stub: Six primitives in the design system have no consumer

- feature-slug: prune-unused-ui-primitives
- sequence: found during native-polish-sweep (8 of 8)
- depends-on: —
- priority: P3
- size: S

## What this is

`packages/ui` exports six components that nothing in the estate imports:
`Avatar`, `Tabs`, `Sparkline`, `Delta`, `Stat` and `Checkbox`. All six are in
the barrel, so all six are typechecked, linted and carried by every app that
consumes the package as source.

They are two different problems, and the difference decides what to do:

- **Never used at all.** `Avatar`, `Tabs`, `Sparkline` and `Delta` have no
  commit in the repo's history that put them on a screen — they came in with
  the shadcn install or with the data-viz set and were never reached for.
- **Orphaned by the native redesign.** `Stat` was on the Money and leads
  screens until they were rebuilt on the app tier, where `GlanceRow` /
  `GlanceFigure` replaced it deliberately (chrome, not a stat card).
  `Checkbox` ticked todos until the Needs you feed replaced it with a
  `GroupedRow` carrying `role="checkbox"`. The polish sweep already deleted
  the dead coarse-pointer rule the checkbox left behind in the admin's
  `globals.css`; the component itself it left alone.

Deliberately *not* done inside the polish sweep: that pass was scoped to what
the redesign orphaned in the admin, and deleting from the shared brand package
is a different decision with a different blast radius — a primitive is cheap
to keep and expensive to re-derive, and `Stat` in particular is documented in
`BRAND.md` as a marketing-tier component that a future case-study page could
want.

So the work is the decision, not the deletion: for each of the six, either
delete it (component, barrel line, and its BRAND.md entry) or write down what
it is being kept for.

## Prompt

Read this stub in the `jamienisbet` repo. `packages/ui` exports `Avatar`,
`Tabs`, `Sparkline`, `Delta`, `Stat` and `Checkbox`, and nothing in
`websites/` or `packages/` imports any of them. Decide each one: delete it —
the component, its line in `packages/ui/src/index.ts`, and its entry in
`BRAND.md` — or keep it with a written reason in `BRAND.md` saying what it is
for. Check the history before deciding: `Stat` and `Checkbox` were orphaned by
the admin's native redesign, the other four were never used at all.

Confirm nothing else reaches them (including `packages/ui`'s own components
and the `emails/` templates) before removing anything, and follow the
`design-dna` skill for anything that stays. Work on a `claude/` branch, push,
read CI, and `git mv` this stub to `.icm/intake/triage/_done/` when done.
