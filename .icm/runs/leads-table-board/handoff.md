# Handoff: leads-table-board

For the next session — human or agent — what to do first and what stands in the way.
Rewritten, not appended, at every stage stop; a stage that STOPs mid-way writes it before it
stops, so nothing is carried in anyone's head.

## Next steps

1. The operator reads `02_define/output/spec.md` and ticks **Spec approved** on https://github.com/k0d0minio/jamienisbet/pull/173 (or asks for a change with `revise leads-table-board "<what>"`).
2. Then `build leads-table-board` — Build follows `plan.md` pass by pass.

## Blockers

- blocked on operator: tick **Spec approved** on https://github.com/k0d0minio/jamienisbet/pull/173.

## Do not

- Do not start Build before the Spec approved box is ticked; never tick it.
- Do not touch the lead profile (`app/(app)/leads/[id]/**`) — `lead-profile-columns` owns it.
- Do not change `lib/deals.ts`'s fetch caching or add `force-dynamic` to the route.
