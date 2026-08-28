# JN-030 · Motion & feedback primitives in @jamie-nisbet/ui

| | |
|---|---|
| Status | today |
| Type | feature |
| Priority | P1 |
| Size | M |

## Problem

The design system shipped motion *tokens* (`tokens/motion.css`) but almost nothing that
used them: no skeleton, no toast, no spinner — so every server action in the admin (mark
touched, status change, raise invoice) resolved with a full-page reload feel and zero
acknowledgement. The app was fast but *felt* inert; that inertness was most of the
"dull".

Those four components now exist (see Build). The half of the problem still standing is
the press state: a control that doesn't answer the finger under it reads as dead even
when the action behind it is instant.

## Build

> **Mostly shipped by JN-035.** That ticket depended on these and found them
> unbuilt, so its PR built the four components rather than stopping: `skeleton.tsx`,
> `spinner.tsx`, `toast.tsx` and `pending-button.tsx` are in
> `packages/ui/src/components/ui/`, exported from the barrel, documented in the
> package README, and driven by new `--duration-spin` / `--duration-pulse` tokens
> in `tokens/motion.css`. What is left is the audit.

- **Press states audit** — buttons/rows deepen colour on `:active` per BRAND.md
  ("press = colour deepens, never shrink"); verify and fix across button variants,
  chips, tab bar, swipe rows.

No new colour tokens; no bounce/spring easings.

## Acceptance

- [ ] Skeleton, spinner, toast, pending-button exported from the `@jamie-nisbet/ui` barrel
- [ ] All animation uses `tokens/motion.css` durations/easings and honours `prefers-reduced-motion`
- [ ] Press states deepen colour across interactive components
- [ ] CI green

## Prompt

Audit press states across @jamie-nisbet/ui. Read
.icm/intake/JN-030-motion-feedback-primitives.md for full context and
packages/ui/BRAND.md § Motion for the rules. The motion & feedback primitives this
ticket originally called for already exist (built by JN-035) — what is left is the
press-state pass: every interactive surface should deepen colour on `:active`, never
shrink and never bounce. Check button variants, the chips in
websites/admin-dashboard/components/chip.tsx, the tab bar in that app's nav, and the
swipe rows, and fix what doesn't. Open a PR on a claude/ branch; do not run local
checks — CI is the source of truth.
