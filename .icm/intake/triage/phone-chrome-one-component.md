# Stub: One phone title-bar chrome, and no nested desk-tier

- lane: chore
- found-by: release retire-app-tier · 2026-09-25
- complexity: low

## Problem

The phone title bar's trailing controls — the palette's search button and the account menu — are
built four times: `components/desk-screen.tsx`, `PhoneChrome` in `components/work-phone.tsx`,
`PhoneChrome` in `components/inbox-list.tsx`, and inline in Work's phone skeleton
(`app/(app)/loading.tsx`). Two use `PaletteTitleBarButton`, two a `DeskButton` ghost icon, so a
change to the bar has to be made in four places and the skeleton's button is not the one the
loaded screen draws. Separately, `<body>` now carries `desk-tier`, but several subtrees still
add it again (`components/nav.tsx` rail and tab bar, the Work desk and its skeleton,
`leads/[id]/error.tsx`, the lead profile), which re-sets the canvas and font for no reason and
reads as if the tier still had to be switched on locally.

## Proposed change

One exported `PhoneChrome` (palette button + `AccountMenu`, `md:hidden`) used by all four, and
remove the nested `desk-tier` classes under `<body>` — except on portalled floating panels
(`DeskMenuContent`, `DeskSelectContent`, the command palette), which keep their own.
