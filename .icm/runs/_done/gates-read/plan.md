# Plan: gates-read

Build's execution plan in passes — each pass one layer of the change, in the order it lands, so
a session that resumes mid-build sees where it is. Written by the advisor pass (Define, or
Build's first act on `sonnet` after reading the spec), executed pass by pass, and rewritten when
reality disagrees with it — never left describing a plan that was abandoned.

## Passes

1. **Share the board's GitHub plumbing** — `lib/tickets.ts`: export what the gates read reuses
   without moving it — the queued, `force-cache`d fetch (allowing a POST body and a caller's own
   tag), `githubFailure`, the roster (`loadRoster`, still hourly-cached) and the per-repo tree
   read or its parsed runs/scopes. No behaviour change to Work — done when: Work renders
   exactly as before and the new exports typecheck.
2. **The read and the rules** — `lib/gates.ts` (new, server-only): the chunked GraphQL query
   (§2), the second query for run `status.md` at head OIDs, the scope and main-run detection from
   the tree, the signal arithmetic mirroring `ci-status.sh`, the gate-anchor parse, the six-kind
   precedence, the ages, the links, the launches (`lib/launchers`), a 10 s bound, and a
   `GatesRead` result that is either rows (+ per-repo errors, "as of") or a one-line failure.
   Keep the classifier pure (PR data in → row out) so it can be reasoned about on fixtures —
   done when: a hand-fed PR set yields the expected kinds, order and ages.
3. **Rows and badge** — `lib/inbox-row.ts` (a client-safe gate-row type beside `InboxRow`),
   `lib/inbox.ts` (badge = follow-ups + gates; follow-ups alone when gates failed),
   `app/(app)/layout.tsx` (the streamed badge promise), `app/(app)/actions.ts` (refresh action
   busting the gates tag and the board's position tag) — done when: the badge reads the sum and
   never blocks the shell.
4. **The Inbox UI** — `app/(app)/inbox/page.tsx` (stream the gates promise beside the Neon
   read; drop the "no GitHub" comment), `loading.tsx`, `components/inbox-list.tsx` (a second
   group with its own fold key, selection across groups that follows the first row until moved,
   `⌘↵`, the header's "as of" and refresh), `components/inbox-row.tsx` and
   `components/inbox-detail.tsx` (gate row and pane per the kind table, phone in-place expansion
   with 44px buttons) — done when: desk and 390px phone match the mockup in both themes.
5. **Docs** — `websites/admin-dashboard/README.md` Inbox section and the token scopes note —
   done when: the six rules, the badge sum and the request budget are described.

## Risks

- **Next's data cache and POST.** `force-cache` must be explicit for the GraphQL POST to be
  cached; a missing opt-in re-reads GitHub every render — signal: GraphQL rate-limit headers
  falling on a warm Inbox.
- **Badge on every shell render.** The badge now touches GitHub; it must stream and hit the
  cache, never be awaited — signal: slow first paint on Work or Leads.
- **GraphQL partial errors.** One inaccessible repo returns `errors` with `data` for the rest;
  treating any error as total failure hides the whole group — signal: the group vanishing when a
  single client repo's access lapses.
- **Vercel deployments.** Preview URLs come from GitHub deployments Vercel creates; a project
  that doesn't create them leaves no preview — the primary falls back to Open PR, by design.
- **Streaming into a client list.** Selection and keys span a group that arrives late; the
  selection must not jump once the operator has moved it.
