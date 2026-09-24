# Tasks: board-client-state

The queue, with a definition of done per item. Ticked by the stage that finishes the item —
a human checkbox, never a script's. The definition of done is seeded from the spec's
acceptance criteria when the run is opened; the queue is Build's own, one line per commit-sized
step, so a resuming session can pick up the first unticked line.

## Definition of done

- [ ] Tapping a repo chip on `/tickets` filters the board instantly with no server request for
- [ ] Browser back/forward after chip taps step through the previous filters, with the board
- [ ] Opening `/tickets?repo=<slug>` directly (and from a Needs you "Today's tickets" row)
- [ ] The masthead figures and chip counts reflect the active filter exactly as they do today.
- [ ] The server response for `/tickets` carries ticket bodies as raw markdown, not rendered
- [ ] Every launcher on the board — ticket Copy split button, Copy next, Recut, repo
- [ ] An "as of HH:MM" stamp (Europe/Lisbon) sits beside the refresh control and shows the
- [ ] The refresh button still busts the cache and re-reads; the board stays on screen during
- [ ] Returning to the tab after ≥5 minutes hidden re-reads the board in the background without
- [ ] If a silent or manual refresh removes a ticket whose sheet/peek is open, that view closes
- [ ] `lib/tickets.ts` still opts every GitHub read into `force-cache`, keeps its concurrency
- [ ] The first visit to `/tickets` still shows `loading.tsx` while the board is read.
- [ ] The board looks the same as before on phone and desktop (Vercel preview check).
- [ ] CI green: Typecheck + lint and Build admin-dashboard.

## Queue

- [ ] <task — small enough for one commit; name the file or area>
