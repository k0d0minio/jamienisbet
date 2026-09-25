# Handoff: drop-todos-compliance

For the next session — human or agent — what to do first and what stands in the way.
Rewritten, not appended, at every stage stop; a stage that STOPs mid-way writes it before it
stops, so nothing is carried in anyone's head.

## Next steps

1. Merged and archived; nothing to pick up. If production misbehaves after the merge, recover by
   fix-forward through `/pipeline hotfix` — migration 0026 is forward-only.

## Blockers

- none

## Do not

- Do not revert this PR — the old admin code reads tables 0026 dropped.
