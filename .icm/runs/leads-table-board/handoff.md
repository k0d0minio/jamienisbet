# Handoff: leads-table-board

For the next session — human or agent — what to do first and what stands in the way.
Rewritten, not appended, at every stage stop; a stage that STOPs mid-way writes it before it
stops, so nothing is carried in anyone's head.

## Next steps

1. The operator smokes the admin preview on the branch alias — https://jamie-nisbet-git-claude-charming-archimedes-2b59uc-kodominio.vercel.app/leads — at desk width (table, sort, board, keyboard, filters, crack views, archive) and on an iPhone (rows, swipes), in light and dark.
2. The operator ticks **Ready to merge** on https://github.com/k0d0minio/jamienisbet/pull/173.
3. Then `release leads-table-board`.

## Blockers

- blocked on operator: smoke the preview and tick **Ready to merge** on https://github.com/k0d0minio/jamienisbet/pull/173.

## Do not

- Do not tick either gate box, and do not re-render the PR body (it rewrites the gates — FAILURE.md).
- Do not touch the lead profile (`app/(app)/leads/[id]/**`), `deal-stage-chip.tsx` or `deal-badges.tsx` — `lead-profile-columns` owns them.
- Do not change `lib/deals.ts`'s fetch caching or add `force-dynamic` to the route.
