# Build notes: lead-profile-columns

- commits: feat: lead-profile-columns — the lead profile in two columns (one commit, all passes)
- ci: draft GREEN on a7d5035 (the admin's Vercel build passed on it); full gate: see status.md

## What changed

- `packages/ui/src/components/desk/record.tsx` (new): `RecordSection` / `RecordRow` / `RecordBlock` / `RecordDisclosure` — the desk's key–value record, prop-compatible with the app tier's grouped list so each card swapped its element and kept its logic (D-26).
- `packages/ui/src/components/desk/desk-menu.tsx` (new): `DeskMenu` and parts — the action menu the head needs for archive / opt out / delete, and the status menu (D-26).
- `packages/ui/src/components/desk/desk-tabs.tsx` (new): `DeskTabs` — the right column's Activity / Draft / Forms / Notes (D-26).
- `components/lead-profile.tsx` (new): the frame — head, two columns from `lg` (each scrolling on its own), stacked below; the `?tab=` state; the touch-log and opt-out open state the action bar drives; j / k / L / T with the "is this key taken" guard (fields, open dialog / menu / listbox, modifiers).
- `lib/lead-order.ts` + `components/lead-order.tsx` (new): the list records its rendered ids in session storage; the profile reads them through `useSyncExternalStore` (no state set in an effect) for `N of M` and the neighbours (D-24).
- `app/(app)/leads/page.tsx`: one import and one `<LeadOrderRecorder ids={visible…} />` — nothing else, so `leads-table-board` merges over it by re-mounting the same line.
- `app/(app)/leads/[id]/page.tsx`: composes head / record / panels; computes `lateLabel` and the came-in date on the server.
- `components/lead-action-row.tsx`: rewritten as the desk action bar + the destructive menu; `mark-touched-button.tsx` / `work-started-button.tsx` became `DeskButton`s; `client-actions.tsx` exposes `useClientActions` (the list keeps its two icons).
- `components/lead-status-menu.tsx` (was `lead-status-row.tsx`): the status as a menu on the word in the head.
- `components/lead-suppress.tsx`: split into `LeadOptOuts` (the closed channels, on the record, only when one has closed) and `LeadOptOutSheet` (opened from the menu).
- `components/lead-next-action.tsx`: the next-step block — eyebrow, line, `due … · edit`; whole block danger-tinted with "N days late" once overdue.
- `components/lead-touches.tsx` + `touch-row.tsx`: the timeline (date · → / ← · channel · outcome · note, draft folded) and the derived `CameInRow`; the sheet is opened from the bar (profile context), the in-section trigger row is gone.
- Contact / facts / enrich / deal / deal folder / intake / notes / forms (+ send, share, delete, snapshot controls): surfaces on `Record*` and `DeskButton`; the D24 mismatch line moved from the Deal folder section to the head.
- `form-links.tsx`: the stale line now reads "Connect a repo to snapshot these answers into its deal folder." (and its comment).
- `loading.tsx` / `error.tsx`: the new frame's shape on the desk tier. `AppProfileScreen` deleted from `app-screen.tsx` (no users left). `lib/lead-segments.ts` + `components/lead-segments.tsx` deleted; `lib/lead-tabs.ts` maps `person` / `work` / unknown to Activity.
- Docs: admin README (Lead row, the profile section, the file map), `packages/ui/BRAND.md` § Desk tier → What ships, `packages/ui/SKILL.md`.

## Acceptance criteria status

Every criterion is met in code (self-checked by reading the diff); none has been exercised in a browser from this session — the preview smoke is the proof.

- [x] Two columns at ≥1024px, head across the top, independent scroll, no segments — `lead-profile.tsx` (`lg:flex-row`, each column `lg:overflow-y-auto`, `lg:h-dvh` with `lg:-mb-8` handing back the shell's padding).
- [x] Every edit and action still works — each component kept its action and sheet; only surfaces changed. Delete now lands on `/leads` (D-27).
- [x] Next step first on both layouts, mono date, red with "N days late" — `lead-next-action.tsx` + `lateLabel` on the server.
- [x] Archive / Opt out / Delete only in the menu — `lead-action-row.tsx`; the Danger zone and the opt-out trigger row are gone from the body.
- [x] Log a touch opens the sheet (context); Write a draft switches to Draft and scrolls the tabs into view.
- [x] `?tab=` kept via `replaceState(null, …)`; `leadTabFrom` sends `person` / `work` / nothing to Activity.
- [x] Timeline newest first, capped at 25 with the note, ends in the came-in row from `created_at` + `source`; no schema change.
- [x] j / k in the list's order, `N of M`, nothing at the ends — `leadPosition` returns null neighbours at the ends.
- [x] From elsewhere no j / k and no position — the id is not in the stored order (or there is none).
- [x] Keys ignored while typing, with a sheet / menu / palette open, or with a modifier — `keyIsTaken`.
- [x] Below 1024px one column in the spec's order; rows and controls take the coarse-pointer 44px step from the desk tokens.
- [x] The Forms line reads as specified.
- [x] `page.tsx` imports none of `AppProfileScreen`, `GroupedList` / `GroupedSection` / `GroupedRow`, `ActionCircle`, `LeadSegments`; loading and error match. (Sheet interiors still use the app tier's form fields — D-28.)

## Notes for Release

- Look closely at `DeskMenu modal={false}` in the action bar: an item there opens a Sheet (the opt-out), and two modal Radix layers handing focus to each other is the known way to leave `pointer-events: none` on `<body>`. Smoke: open the menu → Opt out… → close the sheet → the page must still be clickable.
- The `L` / `T` shortcuts click the element carrying `data-lead-shortcut`; if a future bar has two, the first wins.
- `DealBadges` in the head still renders the shared (marketing `Badge`) pills — it is the leads list's component too, and `leads-table-board` owns that restyle.
- Local lint was run after installing dependencies (`pnpm install --frozen-lockfile`); typecheck and build were not run locally (the factory's job) — the new `packages/ui` files are not covered by any ESLint config, so the ready-head quality job and the Vercel build are their first check.
