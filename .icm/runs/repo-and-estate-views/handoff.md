# Handoff: repo-and-estate-views

For the next session — human or agent — what to do first and what stands in the way.
Rewritten, not appended, at every stage stop; a stage that STOPs mid-way writes it before it
stops, so nothing is carried in anyone's head.

## Next steps

1. Operator: read `02_define/output/spec.md` (or the PR's Spec block); change it with
   `revise repo-and-estate-views "<what>"`.
2. Operator: tick **Spec approved** on https://github.com/k0d0minio/jamienisbet/pull/162.
3. Then `/pipeline build repo-and-estate-views` — execute `plan.md` pass by pass. (A Build run
   on 2026-09-24 STOPped at its gate check because the box was unticked; nothing was built.)

## Blockers

- blocked on operator: tick **Spec approved** on https://github.com/k0d0minio/jamienisbet/pull/162

## Do not

- Do not start Build before the Spec approved box is ticked; never tick it.
- Do not change `lib/tickets.ts` or launcher/maintenance prompt shapes.
- Do not touch the `ticket-view`, `epic-view` or `keyboard-nav` stubs — other runs own them.
