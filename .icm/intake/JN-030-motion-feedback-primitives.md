# JN-030 · Motion & feedback primitives in @jamie-nisbet/ui

| | |
|---|---|
| Status | ready |
| Type | feature |
| Priority | P1 |
| Size | M |

## Problem

The design system ships motion *tokens* (`tokens/motion.css`) but almost nothing that
uses them. There is no skeleton, no toast, no spinner, no transition helpers — so every
server action in the admin (mark touched, status change, raise invoice) resolves with a
full-page reload feel and zero acknowledgement. The app is fast but *feels* inert; that
inertness is most of the "dull".

## Build

New components in `packages/ui/src/components/ui/`, all themed from existing tokens,
all respecting `prefers-reduced-motion`:

- **`skeleton.tsx`** — brand-quiet placeholder (surface-sunken shimmer, hairline radius
  scale). Shapes for text line, row, card, stat figure.
- **`spinner.tsx`** — the "rolling deploy" loop BRAND.md already licenses as the one
  decorative animation. Small, mono-adjacent, used inside buttons during pending actions.
- **`toast.tsx`** — quiet confirmation surface (bottom-center above the tab bar on
  phones, corner on desktop). Sentence-case copy, auto-dismiss, no stacking circus.
  Prefer a thin wrapper over `sonner` themed with tokens, or hand-roll — whichever is
  smaller.
- **Pending-action affordance** — a shared pattern (hook or `<PendingButton>`) wrapping
  `useFormStatus`/`useTransition` so any submit shows the spinner + disabled state for
  free.
- **Press states audit** — buttons/rows deepen colour on `:active` per BRAND.md
  ("press = colour deepens, never shrink"); verify and fix across button variants,
  chips, tab bar, swipe rows.

Document each in the package README the way existing components are. No new colour
tokens; no bounce/spring easings.

## Acceptance

- [ ] Skeleton, spinner, toast, pending-button exported from the `@jamie-nisbet/ui` barrel
- [ ] All animation uses `tokens/motion.css` durations/easings and honours `prefers-reduced-motion`
- [ ] Press states deepen colour across interactive components
- [ ] CI green

## Prompt

Add motion & feedback primitives to the @jamie-nisbet/ui design system. Read
.icm/intake/JN-030-motion-feedback-primitives.md for full context, packages/ui/BRAND.md
§ Motion for the rules, and packages/ui/tokens/motion.css for the tokens. Build
skeleton, spinner ("rolling deploy"), toast, and a pending-action button pattern in
packages/ui/src/components/ui/, exported from the barrel and documented in the package
README. Open a PR on a claude/ branch; do not run local checks — CI is the source of
truth.
