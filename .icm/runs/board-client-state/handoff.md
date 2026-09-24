# Handoff: board-client-state

For the next session — human or agent — what to do first and what stands in the way.
Rewritten, not appended, at every stage stop; a stage that STOPs mid-way writes it before it
stops, so nothing is carried in anyone's head.

## Next steps

1. Operator reads `02_define/output/spec.md`; changes go through `revise board-client-state "<what>"`.
2. Once **Spec approved** is ticked on https://github.com/k0d0minio/jamienisbet/pull/157, run
   `/pipeline build board-client-state` and execute `plan.md` pass by pass.

## Blockers

- blocked on operator: tick **Spec approved** in the body of https://github.com/k0d0minio/jamienisbet/pull/157

## Do not

- Do not tick either gate checkbox.
- Do not wire `?t=` to any UI or restructure the layout — that is stub 2 (`master-detail-shell`).
- Do not change cache clocks or add `force-dynamic` anywhere near the board.
- Do not build/lint/typecheck locally — CI is the source of truth.
