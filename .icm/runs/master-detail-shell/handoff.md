# Handoff: master-detail-shell

For the next session — human or agent — what to do first and what stands in the way.
Rewritten, not appended, at every stage stop; a stage that STOPs mid-way writes it before it
stops, so nothing is carried in anyone's head.

## Next steps

1. Operator reads `02_define/output/spec.md`, ticks **Spec approved** on PR #158, then runs
   `/pipeline build master-detail-shell`.
2. Build executes `plan.md` pass by pass (selection model first, then the shell).

## Blockers

- blocked on operator: tick **Spec approved** in the body of
  https://github.com/k0d0minio/jamienisbet/pull/158

## Do not

- Do not start Build before the Spec approved tick; never tick it yourself.
- Do not touch `lib/tickets.ts` or launcher URL shapes.
- Do not open a second PR for this run or re-run `new-run.sh`.
