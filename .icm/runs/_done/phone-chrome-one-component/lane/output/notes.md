# Chore: phone-chrome-one-component

- invariant: no user-facing behaviour change — the phone title bar still shows the palette's
  search button then the account menu (both self-hiding from `md`), and the desk canvas/type
  still switch on once from `<body>`; only the implementation is consolidated.
- change: `websites/admin-dashboard/components/phone-chrome.tsx` (new): one exported
  `PhoneChrome` composing `PaletteTitleBarButton` + `AccountMenu`. Adopted by
  `components/desk-screen.tsx`, `components/work-phone.tsx` (two call sites, local def
  removed), `components/inbox-list.tsx` (one call site, local def removed),
  `app/(app)/loading.tsx`'s phone skeleton, and `components/lead-profile.tsx` (a fifth
  occurrence the stub didn't name, using the same pattern minus a `gap-1` — now normalized).
  Also removed the redundant `desk-tier` class from every subtree under `<body>` that repeated
  it (`nav.tsx`'s rail and tab bar, `work-phone.tsx`, `work-desk.tsx` and their
  `-NotConfigured` variants, `inbox-list.tsx`, `lead-profile.tsx`, and the Work/Inbox/Leads
  loading and error skeletons) — the class is set once on `<body>` in `app/layout.tsx` and its
  properties (font, colour, canvas background) cascade from there; nothing else in the tree
  sits behind an opaque background that would hide the inherited canvas. The three portalled
  floating panels (`DeskMenuContent`, `DeskSelectContent`, and — found missing while auditing
  the list — the command palette dialog in `packages/ui/src/components/desk/command-palette.tsx`)
  keep (or, for the palette, now gain) their own `desk-tier`, since a Radix portal isn't
  guaranteed the host page put the class on `<body>`.
- rollback: forward-only repo (`migrations.reversible: false` doesn't apply — no schema
  touched); a revert restores the four/five duplicate implementations and the redundant
  classes, which is safe on its own (no other code depends on the new file or the removed
  classes).
- learned: none.
