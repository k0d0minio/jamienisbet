# Handoff: inbox-count-without-full-client-read

For the next session — human or agent — what to do first and what stands in the way.
Rewritten, not appended, at every stage stop; a stage that STOPs mid-way writes it before it
stops, so nothing is carried in anyone's head.

## Next steps

1. PR open — smoke `/inbox` and any other screen (the badge is read on every page), then
   squash-merge PR #188 from GitHub.

## Blockers

- none

## Do not

- Do not add a `waiting` row to `Cracks`/`findCracks` — nothing needs the actual rows through
  this path; `loadInbox` already renders them from `waitingOnYou(clients, now)`. Keep
  `waitingWhere` in `countCracks` a count-only column.
