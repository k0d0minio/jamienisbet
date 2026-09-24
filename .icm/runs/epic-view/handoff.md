# Handoff: epic-view

For the next session — human or agent — what to do first and what stands in the way.
Rewritten, not appended, at every stage stop; a stage that STOPs mid-way writes it before it
stops, so nothing is carried in anyone's head.

## Next steps

1. Operator reads `02_define/output/spec.md` (or the Spec block of
   https://github.com/k0d0minio/jamienisbet/pull/160); a change goes through
   `revise epic-view "<what>"`.
2. Once **Spec approved** is ticked on PR #160: `/pipeline build epic-view`, following `plan.md`.

## Blockers

- blocked on operator: tick **Spec approved** in the body of
  https://github.com/k0d0minio/jamienisbet/pull/160

## Do not

- Do not tick either gate checkbox.
- Do not touch `ticket-view` / `repo-and-estate-views` / `keyboard-nav` work — separate stubs,
  separate runs; the ticket pane stays today's `TicketDetail`.
- Do not change launcher URL shapes, prompts, the URL keys other than retiring `pane`, or the
  cache rules in `lib/tickets.ts`'s header.
- Do not run build/lint/typecheck locally — CI is the source of truth.
