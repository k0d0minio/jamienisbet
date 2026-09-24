# Build notes: ticket-view

- commits: dc8357c feat: ticket-view — summary line, action row, depends-on links, folded Prompt
- ci: GREEN on dc8357c (draft tier), GREEN on ca2d508 (full gate, previews built)

## What changed

- `websites/admin-dashboard/components/ticket-detail.tsx`: rewritten phone-first. New
  `TicketSummary` (status dot + label · priority · `n of m` · repo · client link or "house" ·
  blocked reason; absent segments dropped with their separator; no id). Action row: split button,
  Recommended hint wrapping under it when narrow, "Open on GitHub" (now always present, 44px
  target). "Sends" line and the client link removed from the body. Metadata table drops Blocked /
  Waiting on; `Depends on` renders each slug on the board as a link that selects it. The body is
  split around `## Prompt` (fence-aware) and the section is folded under a closed "Prompt"
  disclosure in place.
- `websites/admin-dashboard/components/board-views.tsx`: `TicketView` takes the batch and a
  select callback, and builds the slug → ticket-key map from the batch's open stubs.
- `websites/admin-dashboard/components/tickets-board.tsx`: the ticket pane's subtitle is
  `TicketSummary`; `TicketView` gets its batch and `navigate({ t })`.
- `websites/admin-dashboard/app/globals.css`: `.prose` gets `min-width: 0` and
  `overflow-wrap: break-word`, links `overflow-wrap: anywhere` (code spans, `pre` and tables
  already wrapped or scrolled in their own box).

## Acceptance criteria status

- [x] Order: title; summary line; action row; metadata table; body — no "Sends" line — the pane's
  title/subtitle, then `TicketDetail` in that order.
- [x] Summary line segments, id gone — `TicketSummary`, omitting priority / sequence when null.
- [x] Blocked reason on the summary line, no Blocked / Waiting on rows — `blockedReason()` +
  `BLOCKED_KEYS` filter.
- [x] Recommended beside / wrapping under; "Open on GitHub" new tab — `flex-wrap` row; to confirm
  on the preview at 375 px.
- [x] Run in flight / no prompt: explanation instead of the button, GitHub link kept.
- [x] Depends-on links select client-side via `useBoardParams().navigate` (pushState — no
  request, no skeleton); unknown slugs plain text. A modified click opens `?t=` in a new tab.
- [x] Prompt fold closed on open; absent when the body has no `## Prompt`.
- [ ] 375 px light/dark, long ticket: no page scroll — CSS in place, needs the operator's smoke on
  the preview (a stub with a wide table and a long code block, e.g. this epic's breakdown-heavy
  stubs).

## Notes for Release

- The Prompt fold is a plain `<details>` styled like `client-repo-link.tsx`'s fold, not
  `GroupedDisclosure`: the ticket already sits in a grouped slab, and a grouped row inside it
  would nest a slab in a slab.
- The metadata table still carries `Sequence` (the spec lists it among the remaining fields), so
  `n of m` shows on the summary line and in the table.
- `.prose` is shared with every rendered markdown in the app; the two added rules only affect
  words/URLs longer than their line.
- The PR body's acceptance-criteria ticks were not applied by Build: the session's permission
  layer denied the PR-body edit. The tick state is this file's list above; the operator ticks
  the seven met criteria on the PR (the 375 px one after the smoke).

## Release

- gate: Ready to merge ticked — merge authorised
- ci: GREEN on the head after the last push (ci-status.sh, full gate; re-read after the close-out push)
- reviews: code medium (/code-review — no finding in this branch's diff; one pre-existing finding in template-owned `.claude/hooks/vercel-env-hydrate.sh` → `env.sh pull`, parked) · security security-check.sh --branch --audit: OK · /security-review n/a — no auth, payments, PII or route policy touched · /production-readiness n/a — no DB, auth, payments or env vars · readiness env.sh audit --changed: OK
- parked: triage/template-change-env-pull-unlinked.md
- migrations: skip — none of this run's own
- learned: skip — no error.log
- docs: websites/admin-dashboard/README.md (Tickets → Master–detail: the ticket view's order) · announce: public
- Context budget: read `.icm/_shared/template-change.md` and the env hook / `env.sh pull` to write the parked template change request.
