# Stub: Count follow-ups without reading every client row

- lane: chore
- found-by: release shell-rail-palette · 2026-09-25
- complexity: medium
- priority: P2

## Problem

`countFollowUps` (`websites/admin-dashboard/lib/inbox.ts`) runs `listClients({ archived: false })`
— the whole table, cold prospect pool included — to produce one number for the Inbox badge, on
every shell render. On `/inbox` the page's own `loadDb` then runs `listClients` and `countCracks`
again in the same request.

## Proposed change

Count the stale-and-not-on-today's-queue leads in SQL beside the existing cracks
(`packages/services/src/queries/crack-finder.ts`), so the badge is one counting query; or share
the reads within a request (React `cache()`) so `/inbox` pays once. The rule itself must stay
the one `waitingOnYou` states, so the badge and the feed keep counting the same people.

## Acceptance criteria (rough)

- [ ] The badge costs one counting query, not a full client read.
- [ ] `/inbox` makes each Neon read once per request.
- [ ] The badge and the feed's "Waiting on you" + queue + wakes still agree.

## Prompt

Run `/pipeline chore inbox-count-without-full-client-read`. Context: shell-rail-palette's Release
review, finding 7.
