# Plan: shell-rail-palette

Build's execution plan in passes — each pass one layer of the change, in the order it lands, so
a session that resumes mid-build sees where it is. Written by the advisor pass (Define, or
Build's first act on `sonnet` after reading the spec), executed pass by pass, and rewritten when
reality disagrees with it — never left describing a plan that was abandoned.

## Passes

1. **Routes** — move `app/(app)/page.tsx` + `loading.tsx` (the feed) to `app/(app)/inbox/`; move
   the Tickets page + `loading.tsx` + `actions.ts` to `app/(app)/` as Work (title "Work"), carrying
   the `/?filter=` / `/?archived=1` → `/leads` redirects onto it; `app/(app)/tickets/page.tsx`
   becomes a permanent redirect to `/` keeping the query (or a `next.config.ts` redirect — either,
   as long as the query survives); repoint every `/tickets` link and path revalidation — done
   when: `/` is the board, `/inbox` the feed, `/tickets?t=a/b` lands on `/?t=a/b`.
2. **Desk tier linked + content width** — `globals.css` imports `@jamie-nisbet/ui/desk.css` after
   `styles.css`; the `(app)` layout drops `md:pl-60` / `max-w-5xl`; the reading width moves into
   the non-Work screens (via `AppScreen` or a wrapper) so only Work widens — done when: Leads,
   profile, Inbox, Money look as before at 1440px and Work fills the width.
3. **Rail + tab bar** — rewrite `components/nav.tsx`: `Rail` (from `md`, 56px, `desk-tier` root,
   JN mark, Work/Inbox/Leads `RailItem`s, palette button + sign out at the foot) and a flat
   `TabBar` below `md`; update the `--admin-tab-*` geometry and the Toaster offset; the phone
   title bar gains the search button (`app-screen.tsx`, `app-menu.tsx` comment) — done when: the
   chrome matches the canvas in light and dark at 390, 768 and 1440 wide.
4. **Inbox badge** — a Neon-only follow-up count in `lib/` (stale open leads not on today's
   queue + `countCracks().due` + `countCracks().woken`, the feed's de-dup rule reused, not
   copied), read in the `(app)` layout inside `<Suspense>` and handed to the rail and tab bar —
   done when: the badge equals the three follow-up totals, hides at 0 and on a failed read, and
   no screen's first paint waits on it.
5. **Palette** — `components/command-palette.tsx` on the desk `CommandPalette`; a server action
   (`loadPaletteIndex`) that calls `readBoard()` + `listClients({ archived: false })` and returns
   the slim index; the ⌘K / Ctrl+K listener, the rail and title-bar triggers via one shared open
   state (a small context in the shell); filtering, ranking, 8-per-group cap, ↑/↓/Enter/Esc; the
   launch actions open in a new tab — done when: every palette criterion in the spec passes by hand
   on the preview.
6. **README** — screens table, Mobile & PWA navigation paragraph, Layout tree — done when: the
   README describes the shipped shell and nothing it replaced.

## Risks

- **The board's cache.** Calling `readBoard()` from a server action must not set
  `force-no-store` or add `dynamic = "force-dynamic"` anywhere; a sign is the estate re-fetched on
  every palette open (GitHub rate-limit errors on the board). Read the header of `lib/tickets.ts`
  before touching it.
- **Two tiers in one tree.** `desk-tier` on the chrome must not leak into the screens (font,
  base size, focus ring); keep it on the rail/tab bar/palette roots, not on `<body>`, where
  `app-tier` stays until `retire-app-tier`.
- **Keyboard collisions.** The board's key handler (`use-board-keys.ts`) must ignore keys while
  the palette is open, and ⌘K must not be swallowed by it; `?` and j/k stay the board's.
- **Route move churn.** `revalidatePath("/tickets")`-style calls, the feed's `?t=` links, the
  service worker's offline navigation and `loading.tsx` placement — grep for `/tickets` and `"/"`
  after the move.
- **Overlap.** Later screen stubs merge over `nav.tsx`, `(app)/layout.tsx` and `app-screen.tsx`;
  keep the rail/tab bar API small (a list of items + a badge prop) so their merges stay trivial.
