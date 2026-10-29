# Stub: cn() stops declaring the desk tier's class names to tailwind-merge

- lane: chore
- found-by: portfolio-only/one-app-at-root · 2026-10-25
- complexity: low
- priority: P2

## Problem

`lib/utils.ts` extends tailwind-merge with the desk tier's `text-desk-*` sizes and colours. No surface in this repo links the desk tier since the admin dashboard left, so the configuration is dead code.

## Proposed change

`cn()` becomes the plain `twMerge(clsx(...))` helper. `tokens/desk.css` stays.

## Acceptance criteria

- [ ] `lib/utils.ts` holds no `desk-*` name and no `extendTailwindMerge` call.
- [ ] `ci` is green and the preview shows no visual change.
