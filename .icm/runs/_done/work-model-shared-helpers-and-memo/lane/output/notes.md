# Chore: work-model-shared-helpers-and-memo

- invariant: no user-facing behaviour changes; Work's desk and phone screens read, filter and
  order tickets exactly as before — only where each computation is defined, and when it re-runs,
  differs.
- change: `websites/admin-dashboard/lib/board-constants.ts` (new): the `RUNS_SLUG` pseudo-batch
  slug and the `PRIORITY_RANK`/`rank` priority ordering, each previously copied by hand in
  `lib/tickets.ts` and `components/work-model.ts` (and a third time in `components/board-model.ts`
  for `RUNS_SLUG`), now defined once here — a plain module with no `server-only` tag, so both the
  server-only data layer and the client-bundled board/work models can import the same value.
  `components/board-model.ts`'s `batchSlugOf` is now exported and reused by `work-model.ts`
  instead of a second copy. `components/use-board-keys.ts`'s own `DESKTOP_QUERY` is dropped in
  favour of importing `DESK_QUERY` from `components/use-desk.ts`. `lib/tickets.ts`'s
  `fetchTodayKeys` now builds its `<repo>/<id>` ticket keys directly (matching `ticketKey()`)
  instead of a `"repo id"` string later fixed up with `.replace(" ", "/")` in `readEstate`.
  `components/work-model.ts`'s `resolveWork` and `paneRows` both took `locateAll(sections)`
  internally on every call; both now take the map as an optional trailing argument (defaulting to
  the same internal call, so every other caller — `work-phone.tsx` — is unaffected) and
  `components/work-desk.tsx` builds it once per render and hands it to both, instead of walking
  every ticket on the board twice. This repo runs the React Compiler (Next 16); the fix leans on
  its own memoization across renders rather than hand-written `useMemo`/`useCallback` — a manual
  attempt at the latter tripped `react-hooks/preserve-manual-memoization` in `lint.sh`.
- rollback: revert — no data or schema touched (`database.isolation: none`).
- learned: none.
