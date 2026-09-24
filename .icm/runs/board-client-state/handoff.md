# Handoff: board-client-state

For the next session — human or agent — what to do first and what stands in the way.
Rewritten, not appended, at every stage stop; a stage that STOPs mid-way writes it before it
stops, so nothing is carried in anyone's head.

## Next steps

1. Operator re-reads the revised freshness section of `02_define/output/spec.md` (D-3 in
   `decisions.md`) and re-ticks **Spec approved** on https://github.com/k0d0minio/jamienisbet/pull/157.
2. Then `/pipeline build board-client-state` — no code has been written yet; start at
   `plan.md` pass 1.

## Blockers

- blocked on operator: re-tick **Spec approved** in the body of https://github.com/k0d0minio/jamienisbet/pull/157

## Do not

- Do not tick either gate checkbox.
- Do not wire `?t=` to any UI or restructure the layout — that is stub 2 (`master-detail-shell`).
- Do not change the cache clocks or add `force-dynamic`; the only `lib/tickets.ts` change
  besides exposing the read time is the position reads' second tag (D-3).
- Do not build/lint/typecheck locally — CI is the source of truth.
