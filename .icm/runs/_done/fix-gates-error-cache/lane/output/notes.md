# Bug: fix-gates-error-cache

- observed: the Inbox's Gates and PRs group reads "Couldn't read GitHub" (or names a repo
  unreadable) for the next 60s after a transient GitHub GraphQL error — a rate limit or a
  per-repo error — even once GitHub has recovered, until the operator taps the refresh control.
- cause: `githubGraphql` (`websites/admin-dashboard/lib/tickets.ts`) reads with `force-cache`.
  GraphQL answers HTTP 200 even when the body carries `errors` (a `RATE_LIMITED` type, or a
  per-repo error alongside otherwise-good data), so Next's fetch cache — which only looks at the
  HTTP status — stores the failed answer for the rest of `GATES_CACHE_TAG`'s minute the same as a
  clean one. Nothing busts the tag until the operator's manual `refreshGates()` click.
- fix: `components/inbox-list.tsx` — the Inbox already has that action wired (`refreshGates`,
  `board-actions.ts`); it just never ran on its own. Added an effect that watches `gateRead` and,
  on a `failed` read or an `ok` one still naming an unreadable repo in `notes`, waits 15s and
  calls `refreshGates()` + `router.refresh()` itself — well inside the 60s window, and repeating
  (a fresh `gateRead` object on every retry re-arms it) until the group reads clean.
- changelog: not user-visible (a background self-heal on an internal cockpit read; nothing a
  screenshot or a release note would describe).
- learned: none — the shape of the bug (a 200 hiding a GraphQL error) was already the learned
  rule from gates-read (2026-09-25); this is that same fact applied to caching's *lifetime*, not a
  new constraint.
