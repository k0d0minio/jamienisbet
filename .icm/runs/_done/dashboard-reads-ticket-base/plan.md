# Plan: dashboard-reads-ticket-base

Build's execution plan in passes — each pass one layer of the change, in the order it lands, so
a session that resumes mid-build sees where it is. Written by the advisor pass (Define, or
Build's first act on `sonnet` after reading the spec), executed pass by pass, and rewritten when
reality disagrees with it — never left describing a plan that was abandoned.

## Passes

1. **Resolve the ticket ref** — `lib/tickets.ts`: a `probeTicketRef(fullName)` reading
   `.icm/project.json` via `contents/` on `DISCOVERY_REVALIDATE_SECONDS` (raw JSON, parse
   defensively; non-empty string `uat.branch` → that branch, anything else → `null` = default);
   `TicketRepo` gains `ticketRef: string | null`, set in `loadRoster()` beside `probeRouter` (same
   `Promise.all`). icm-board is skipped (exempt, no UAT) — done when: berceo resolves `uat`, a repo
   with `uat.branch: ""` or no file resolves `null`.
2. **Read and link at that ref** — `fetchRepoTickets` reads `git/trees/<ref ?? "HEAD">` (branch
   URL-encoded; slashes allowed); on a 404 at a declared ref, retry once at `HEAD` and return the
   tickets plus a banner entry (declares UAT branch `<b>`, not found — showing the default branch)
   and clear `ticketRef` so links and badge follow what was actually read. `blobUrl` (`:675`), the
   run `htmlUrl` (`:850`) and the folder link (`:1168`) use one `repoRef(repo)` helper instead of
   `HEAD` — done when: no `/HEAD/` literal remains in a ticket-facing URL and the non-UAT path is
   byte-identical.
3. **The badge** — the repo group header (find it from `listBoard()`'s consumer under
   `components/`) shows a small mono badge with `ticketRef` when non-null, styled from
   `packages/ui` (load `design-dna`; no new tokens) — done when: a UAT repo shows it, others don't.
4. **Prompts to D38** — `repoMaintenanceLaunchers` and `recutLaunches` (`:1411`, `:1421`,
   `:1433`): one helper returns the closing sentence — icm-board → "Ticket-only changes commit
   straight to main."; every other repo → "Land ticket-only changes as a ticket PR into `<ref ??
   default branch>` — the shape and the merge rule are in the pr-conventions skill ("The ticket
   PR")." Estate check untouched — done when: grep finds "straight to main" only on the
   icm-board path.
5. **README** — `websites/admin-dashboard/README.md` → Tickets: "reads those folders from each
   repo's ticket base branch (`uat.branch` where `.icm/project.json` declares one, else `main`)",
   the badge, the fallback banner, the prompts' ticket PR — done when: no sentence says the board
   reads `main`.

## Risks

- The default branch's name is not known without a repo read — keep `HEAD` for the default path
  rather than adding a request; the prompt names "the default branch" when `ticketRef` is null.
- A branch name with `/` in `git/trees/<ref>`: encode each segment, not the slash — a 404 there
  would masquerade as "branch not found"; the fallback banner is the signal.
- The `project.json` read adds one request per roster repo per hour — within the discovery
  budget; a 403/429 must resolve to `null`, never break the roster.
