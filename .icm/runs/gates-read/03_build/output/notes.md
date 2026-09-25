# Build notes: gates-read

- commits: da4bc3f feat: gates-read — Gates and PRs at the head of the Inbox
- ci: pending — see status.md; `lint.sh` → OK (0 errors in 12 changed files), `security-check.sh` → OK

## What changed

- `lib/tickets.ts`: exports the board's GitHub plumbing for the gates read without moving it —
  `githubGraphql` (a POST through the same queue, `force-cache`, 60 s, caller's tags),
  `readRepoTree` (the board's own tree request, so the same cache entry), `readBlob`,
  `readRoster` (`cache(loadRoster)`, now also what `readEstate` uses), `GATES_CACHE_TAG`,
  `isBoardConfigured`. Work's behaviour is unchanged.
- `lib/gates.ts` (new): the chunked GraphQL PR query (10 repos a query, 30 PRs a repo, head
  check runs + statuses + deployments), the `status.md`-at-head query keyed by commit id, the
  `ci-status.sh` signal arithmetic, the gate-anchor and slug parses, the six-kind precedence,
  ages, links, launches (through `lib/launchers`), scopes and blocked runs from `main`'s tree,
  the 10 s bound, `loadGates` (request-cached, never rejects) and `countGates`.
- `lib/inbox-row.ts`: client-safe `GateRow`, `GateLink`, `GateFact`, `GateLaunch`, `GatesRead`.
- `lib/inbox.ts` + `app/(app)/layout.tsx` + `components/nav.tsx`: the badge is `countInbox` —
  gate rows plus follow-up rows, either half alone when the other can't be read.
- `app/(app)/board-actions.ts`: `refreshGates` expires the gates tag and the board's position
  tag (`updateTag`, per the learned rule on stale-while-revalidate).
- `app/(app)/inbox/page.tsx`: starts `loadGates()` unawaited beside `loadInbox()` and hands the
  promise to the client; `loading.tsx` gains the one-line gates placeholder.
- `components/inbox-list.tsx`: two groups with their own folds, one selection across both that
  follows the first row until the operator moves it, `⌘↵` for a gate's launch, `e`/`s` inert on
  gate rows, header "N waiting on you · as of HH:MM" and a refresh control, the muted
  unconfigured/failed line, "Nothing needs you" only after GitHub has answered.
- `components/inbox-row.tsx` / `inbox-detail.tsx`: `GateRowItem`, `GateDetail`, `GateActions`,
  the launch button (disabled with its reason when the target can't carry it).
- `websites/admin-dashboard/README.md`: the Inbox section describes both groups, the six rules,
  the pane table, the badge sum, the request budget and the token's read scopes.

## Acceptance criteria status

- [x] Gates and PRs group above Follow-ups, count, remembered fold, kind order, oldest first — `inbox-list.tsx` `GatesGroup`, `gates.ts` sort by `SINCE`.
- [x] Spec approved row appears on an unticked box and leaves within 60 s or on refresh — `kindOf`, 60 s `githubGraphql`, `refreshGates`.
- [x] Ready to merge only when every signal passed or skipped, none pending — `kindOf` `green`.
- [x] Lane PR · merge on a type label or lane marker, green — `isLanePr`.
- [x] Red CI by `ci-status.sh`'s arithmetic, drafts never — `signalsOf`, `kindOf`.
- [x] Blocked run from `status.md` at the PR head or on main, ahead of any other kind — `readRunStatuses`, `mainRows`, precedence.
- [x] Scope to review: `scope.md` on main, open stubs, empty `_done/` — `mainRows`.
- [x] One row per PR by precedence — `kindOf` returns one kind.
- [x] Row shape and destructive colour for Red CI and Blocked run — `GateRowItem`.
- [x] Pane: what to do, signals with states, the kind's actions; Open PR primary without a preview — `GateDetail`, `prRow`.
- [x] Launches: spine verb (`build`/`release`), authored fix prompt otherwise, `/pipeline new` on a scope, none elsewhere — `prRow`, `mainRows`.
- [x] Keys across both groups, `↵`, `⌘↵`, `e`/`s` inert on gates, foot hint — `inbox-list.tsx`.
- [x] Phone: 44px rows (desk-row token), in-place open, two 44px buttons, the rest as text buttons — `GateRowItem`, `GateActions` phone layout.
- [x] Badge and header equal gates + follow-ups; follow-ups alone on a failed gates read — `countInbox`, header `waiting`.
- [x] Unset token / failure / 10 s → one muted line, follow-ups unaffected; per-repo failures in the foot — `readGates`, `loadGates`, `GatesGroup`.
- [x] Warm render makes no GitHub request; cold makes one GraphQL per ≤10 repos plus at most one for `status.md` (per chunk of repos with PR runs), reusing the board's roster and tree — by construction; unverified at runtime (see Notes for Release).
- [x] "as of" and a refresh control — header.
- [x] Desk tier, light and dark, loading placeholder — desk tokens only; `loading.tsx`.
- [x] README — Inbox section.
- [ ] CI lint, typecheck, build and the admin preview — settled after the ready flip.

## Notes for Release

- **Nothing here has run against live GitHub yet.** The GraphQL field names were written from
  the schema, not exercised; the first real signal is the preview's `/inbox`. If the group shows
  "Couldn't read GitHub — GitHub answered with an error — …", the message names the field.
- **Cache size.** Next's data cache skips entries over 2 MB. A chunk of 10 repos × 30 PRs with
  long spec bodies could approach that on a busy estate; if the Inbox is ever seen re-reading
  GitHub on every render, lower `REPOS_PER_QUERY` in `lib/gates.ts`.
- **Deviation from the spec's `touches:`:** the refresh action lives in
  `app/(app)/board-actions.ts` beside the board's own refresh, not in `app/(app)/actions.ts` —
  the cache tags and `updateTag` calls are all there already.
- On the phone the launch is a text button in the "rest" line (no ⌘↵ hint); at the desk it is a
  secondary button with the hint and the recommendation beside it.
- Previews come from GitHub deployments Vercel creates per project; a head with none makes Open
  PR the primary, by design.
