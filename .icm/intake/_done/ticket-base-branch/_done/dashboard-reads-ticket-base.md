# Stub: The Tickets board reads each repo's ticket base branch, not its default branch

- feature-slug: dashboard-reads-ticket-base
- epic: ticket-base-branch
- priority: P1
- size: S
- depends-on: none
- sequence: 1 of 1
- blocked: waits for icm-board's D38 (`ticket-base-branch/ticket-base-contract`) — the wording of
  the prompts comes from it
- sources: icm-board `.icm/intake/ticket-base-branch/breakdown.md` · investigation 2026-09-23 —
  `websites/admin-dashboard/lib/tickets.ts:705` (`git/trees/HEAD`), `:690-697` (blobs from that
  tree), `:675, :850, :1168` (`blob/HEAD` links), `:1411, :1421, :1433` (prompts: "Ticket-only
  changes commit straight to main"); no dashboard code mentions `uat`

## Problem

A finished stub on berceo or agorasim reads as open on the board until its UAT batch is promoted,
because the board reads `HEAD` (the default branch, `main`) and the `_done/` move lives on `uat`.
It can then be picked into `today.md` and run twice. The prompts the board hands out also tell
sessions to push tickets to `main`, which D38 retires for client repos.

## Proposed change

- Per repo, read `.icm/project.json` from the default branch (it is where `/setup` declares `uat`);
  the ticket ref is `uat.branch` when non-empty, else the default branch. Use it for the tree read
  (`git/trees/<ref>?recursive=1`), the intake probe, and the "Open on GitHub" links. Cache
  `project.json` like the intake probe.
- Show the ref on UAT repos (e.g. a small `uat` badge on the repo row), so a reader knows which
  branch they are seeing.
- Rewrite the three maintenance prompts to D38's ticket PR (branch `claude/tickets-…`, label
  `type:tickets`, into the ticket base branch), except where the repo is icm-board.
- `today.md` is still read from icm-board's default branch — unchanged.

## Acceptance criteria (rough)

- [ ] berceo's board shows `uat`'s intake; a stub `_done` on `uat` but open on `main` is gone
- [ ] A repo with no `uat` block (or an empty one) reads exactly as today
- [ ] "Open on GitHub" links point at the ref the board read
- [ ] No prompt tells a client-repo session to commit straight to `main`
- [ ] CI green

## Prompt

In jamienisbet, change the admin dashboard's Tickets board so it reads each tracked repo's
**ticket base branch** — `.icm/project.json` → `uat.branch` when declared (read that file from the
repo's default branch), otherwise the default branch — instead of `HEAD`. Read
`.icm/intake/ticket-base-branch/dashboard-reads-ticket-base.md` and its `breakdown.md` for the
evidence and the file/line list (`websites/admin-dashboard/lib/tickets.ts`), and icm-board's D38
entry in `.icm/project.md` for the ticket PR wording the maintenance prompts must use. Repos with
no UAT branch must behave exactly as today. Never run build/lint/test locally; ship a PR and read
CI.
