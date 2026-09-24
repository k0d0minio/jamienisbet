# Handoff: ticket-view

For the next session — human or agent — what to do first and what stands in the way.
Rewritten, not appended, at every stage stop; a stage that STOPs mid-way writes it before it
stops, so nothing is carried in anyone's head.

## Next steps

1. Operator reads `02_define/output/spec.md`; to change it: `revise ticket-view "<what>"`.
2. Operator ticks **Spec approved** on https://github.com/k0d0minio/jamienisbet/pull/161, then
   runs `/pipeline build ticket-view` — Build follows `plan.md`.

## Blockers

- blocked on operator: tick **Spec approved** in the body of PR #161.

## Do not

- Do not tick any gate box; do not start Build before the tick.
- Do not touch the epic / repo / overview views or keyboard nav — later stubs of this epic.
- Do not subscribe to PR activity (`_shared/github.md` → PR events).
