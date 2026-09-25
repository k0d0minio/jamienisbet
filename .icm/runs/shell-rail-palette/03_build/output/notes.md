# Build notes: shell-rail-palette

- commits: feat (routes, desk tier, rail, tab bar, badge, palette) · docs (README) · chore (run files)
- ci: GREEN on 280272b (full gate: Vercel – jamie-nisbet, Vercel – portfolio; Quality (advisory) success)

## What changed

- `app/(app)/page.tsx` + `loading.tsx`: the Tickets board moved to `/` as **Work** (`AppScreen wide`); it now also carries the old `/?filter=` / `/?archived=1` → `/leads` redirects the feed used to hold.
- `app/(app)/inbox/page.tsx` + `loading.tsx`: the Needs you feed moved to `/inbox`, as it was; `connection()` replaces the awaited searchParams as what keeps it request-time; ticket links → `/?t=`, "open Tickets" → "open Work". Screen title is "Inbox" (D-26).
- `app/(app)/board-actions.ts`: the board's refresh actions, moved from `tickets/actions.ts` (the route folder is gone).
- `next.config.ts`: `/tickets` → `/` permanent redirect; Next passes the query through.
- `app/(app)/actions.ts`, `money/actions.ts`, `client-actions.tsx`, `not-found.tsx`: every revalidation / link that meant the feed at `/` now says `/inbox` — revalidating `/` would expire Work's cached GitHub reads for a lead write.
- `app/globals.css`: links `@jamie-nisbet/ui/desk.css`; the tab geometry is a flat bar (`--admin-tab-gap: 0`, `bottom-tabs` gone); `vt-app-sidebar` → `vt-app-rail`.
- `components/nav.tsx`: `Rail` (from `md`, `desk-tier`, `RailItem`s, palette + sign out at the foot) and a flat `TabBar`; the Inbox badge streams in through `use()` under `Suspense`.
- `lib/inbox.ts` (new): `waitingOnYou` (the feed's de-dup rule, now shared) and `countFollowUps` (uncapped stale + due + woken; never rejects).
- `app/(app)/layout.tsx`: `PaletteProvider`, `Rail`, `TabBar`, the badge promise, no width cap.
- `components/app-screen.tsx`: the reading column (`max-w-5xl`) moved here from the shell; `wide` opts out (Work); the phone title bar gains the palette's search button.
- `components/command-palette.tsx` (new) + `app/(app)/palette-actions.ts` (new): the palette — shortcut (⌘K / Ctrl+K by platform), index read on each open, filtering, highlight, launches.
- `README.md`: screens table, a new "The shell" section, navigation, layout tree.

## Acceptance criteria status

- [x] Rail 56px from 768px, content spans the rest; tab bar below — `md:block` / `md:hidden`, `md:pl-desk-rail`.
- [x] Work, Inbox, Leads in order, `aria-current="page"`, no Money — `links` in nav.tsx.
- [x] Inbox badge = uncapped stale + due + woken, de-duplicated, hidden at 0, in the accessible name — `countFollowUps`; `RailItem`'s name; the tab's `aria-label`.
- [x] Rail foot: palette button + sign out (the existing `logout` action → `/login`).
- [x] ⌘K / Ctrl+K on every shell screen, in fields too; phone title-bar button — document listener in `PaletteProvider`; `PaletteTitleBarButton` in both AppScreen forms.
- [x] Filtering, ↑/↓, Enter navigates and closes, Esc closes with focus returned (Radix FocusScope).
- [x] Launch next = the epic's next stub's primary launch (what Copy next builds); Estate check = `board.estateCheck`; web targets open a new tab; no Money row.
- [x] Server action over `readBoard()` + `listClients({ archived: false })`; per-source notes. (The board's fetches set `cache: "force-cache"` explicitly, which Next honours inside actions, whose default is `default-no-store`.)
- [x] `/` is the board titled Work; old leads bookmarks still redirect.
- [x] `/inbox` is the feed, ticket rows → `/?t=`.
- [x] `/tickets[?…]` → `/[?…]` — next.config redirect.
- [x] Refresh re-reads on `/` — unchanged `refreshBoard` (tag bust) + `router.refresh()`.
- [x] Only Work widens — `AppScreen`'s reading column.
- [ ] Light/dark, safe areas, 44px touch, toasts/add button clear the bar — built from semantic desk tokens and the tab geometry; needs the operator's smoke on the preview (phone + desk, both themes).
- [x] README updated.
- [x] CI lint/typecheck/build + admin preview — GREEN on the post-flip head.

## Notes for Release

- Two small calls Build made (decisions.md D-26, D-27): the moved feed's title reads "Inbox" to match the rail; a deleted lead now returns to `/inbox` (it returned to the feed at `/` before).
- The layout re-reads the badge on every navigation that re-renders it (router.refresh, pull-to-refresh, a server action); a plain client navigation between screens keeps the last count — the spec did not ask for a live badge.
- Look closely at `components/command-palette.tsx` → `PaletteProvider`: the palette remounts per opening (keyed by a session counter) so every open is a fresh query and a fresh read.
- Context budget: read the design canvas artboards (rail/tab bar geometry) and Next's `patch-fetch.js` / `action-handler.js` to prove the action keeps the board's cache.

## Release

- gate: Ready to merge ticked — merge authorised
- ci: GREEN on the head after the review fixes (ci-status.sh); re-read after the last push
- reviews: code high — 9 findings: 6 fixed in-ticket (`fix: shell-rail-palette — review findings`: palette highlight by id, pushState on Work, key-less autofill keydowns, the rail's notch inset, one new-tab rule via `launchLinkProps`, the Inbox h1), 2 parked, 1 does not reproduce (the palette action on `/money`: Next 16's action handler sets `fetchCache: default-no-store` before the page's segment config is read, and the board's fetches set `cache: "force-cache"` explicitly, so they stay cached) · security `security-check.sh --branch --audit`: OK · /security-review n/a (no auth, payments, PII or route policy touched — the new server action and the `/tickets` redirect sit behind proxy.ts's existing gate) · /production-readiness n/a (no schema, auth, payments or env vars; the DB is read only through existing services queries) · readiness `env.sh audit --changed`: OK
- parked: inbox-badge-live-on-navigation.md, inbox-count-without-full-client-read.md
- migrations: skip — none of this run's own (check-migrations.sh after merging main: SKIP)
- learned: skip — no error.log; FAILURE.md adds 2 on close-out
- docs: websites/admin-dashboard/README.md (updated in Build) · announce: public
