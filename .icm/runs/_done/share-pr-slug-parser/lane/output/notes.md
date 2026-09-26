# Chore: share-pr-slug-parser

- invariant: Work's board (`lib/tickets.ts`) and the Inbox's gates (`lib/gates.ts`) still classify
  every pipeline PR exactly as before for every real PR (the `PIPELINE RUN` marker, kebab-case
  slugs) — only the parsing and the lane-label set are now one implementation, not two.
- change: `lib/tickets.ts`: exported `LANE_LABELS` (added `type:handover`, already the vocabulary
  `_shared/github.md` documents and `LANES` at line 708 of this same file already carried) and
  `runSlugOf` (the stricter of the two prior parsers — requires the `PIPELINE RUN` marker,
  kebab-case slug charset). `prSlug` is now a thin wrapper: `runSlugOf` plus the `claude/<slug>`
  branch fallback. `lib/gates.ts`: dropped its own `LANE_LABELS` and `runSlugOf` (the looser
  parser — no marker check, allowed uppercase/underscore no real slug uses) and imports both from
  `lib/tickets.ts`, which it already depends on for the roster/tree/blob/cache primitives.
- rollback: revert the commit — forward-only repo, no schema involved.
- learned: none
