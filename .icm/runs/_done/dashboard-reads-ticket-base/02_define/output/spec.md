# Spec: The Tickets board reads each repo's ticket base branch, not its default branch

- slug: dashboard-reads-ticket-base
- personas: operator
- touches: websites/admin-dashboard/lib/tickets.ts, websites/admin-dashboard/components, websites/admin-dashboard/README.md
- complexity: standard

## Problem

On a repo that declares a UAT branch (`.icm/project.json` → `uat.branch`, e.g. berceo, agorasim),
a run's close-out moves its stub to `_done/` inside a PR that merges into `uat`; `main` only sees
the move at promotion. The board reads each repo's default branch (`git/trees/HEAD`), so a
finished stub reads as open for the whole batch, can be picked into `today.md`, and can be run
twice. icm-board decision **D38** makes the ticket base branch — `uat.branch` when declared, else
`main` — the one home of a client repo's ticket state, reached only through a `type:tickets` ticket
PR. The board is the operator's single view of the estate's backlog (icm-board D13), so it must
read that branch, and the maintenance prompts it hands out must stop telling client-repo sessions
to commit straight to `main`.

## Proposed change

- **Resolve a ticket ref per repo.** Read `.icm/project.json` from the repo's default branch, on
  the discovery clock (cached like the intake and router probes). The ticket ref is `uat.branch`
  when it is a non-empty string, else the default branch (`HEAD`, as today). A missing,
  unreadable or malformed `project.json` resolves to the default branch with no note — that is
  every non-UAT repo.
- **Read everything ticket-shaped at that ref:** the recursive tree read (`git/trees/<ref>`, which
  drives both intake stubs and `.icm/runs/` in-flight rows), and every GitHub link the board builds
  for a ticket, a batch folder, or a run folder (`blob/<ref>/…`, `tree/<ref>/…`). Blob reads stay
  by SHA from that tree.
- **Declared but unreadable UAT branch → fall back and say so.** If the tree read at the declared
  branch fails (404 — deleted or renamed), read the default branch as today and name the repo in
  the board's existing unreadable-repo banner: declares UAT branch `<branch>`, not found —
  showing the default branch. Never silent.
- **Show the ref on UAT repos.** A repo whose tickets were read from a branch other than its
  default carries a small mono badge with the branch name on its group header, so the reader knows
  which branch they are seeing. Repos read at their default branch show no badge.
- **Maintenance prompts follow D38.** The three authored prompts (triage the backlog, sweep
  finished work, recut this batch) replace "Ticket-only changes commit straight to main." with a
  line that lands the change as a ticket PR into the repo's ticket base branch, naming the
  resolved branch and pointing at the `pr-conventions` skill for the shape — for every repo except
  icm-board, which keeps "commit straight to main" (D38 (7), its exemption). The board-level
  estate check (runs on icm-board) is unchanged.
- `today.md` is still read from icm-board's default branch — unchanged.
- The admin-dashboard README's Tickets section says the board reads each repo's ticket base
  branch, not `main`.

## Acceptance criteria

- [ ] On a repo whose `project.json` declares `uat.branch: "uat"` (berceo), the board shows the `uat` branch's intake and runs: a stub moved to `_done/` on `uat` but still open on `main` is not on the board
- [ ] A repo with no `project.json`, no `uat` block, or `uat.branch: ""` reads exactly as today (tree at the default branch, same links, no badge, no banner line)
- [ ] Every "Open on GitHub" link for a ticket, batch folder and run folder on a UAT repo points at `<ref>` (the branch the board read), not `HEAD`
- [ ] A repo whose declared UAT branch does not exist on GitHub still shows its default branch's tickets, and the board's banner names the repo and the missing branch
- [ ] A UAT repo's group header shows a badge naming the branch it was read from; non-UAT repos show none
- [ ] No triage, sweep or recut prompt for a repo other than icm-board contains "commit straight to main"; each names the repo's ticket base branch and the `pr-conventions` ticket PR. icm-board's prompts still say "commit straight to main"
- [ ] The `project.json` read is cached on the discovery clock (one request per repo per hour at most), not per board load
- [ ] `websites/admin-dashboard/README.md` → Tickets describes reading the ticket base branch
- [ ] CI green

## Out of scope

- This repo's own `AGENTS.md` (standing rules) and `.icm/intake/README.md` still say "Ticket-only commits go straight to `main`"; D38 retires that for every repo but icm-board. Reconciling those words is separate work, parked as `triage/ticket-rule-wording-d38`.
- Writing tickets from the board — it stays read-only; the ticket PR is made by the session the prompt starts.
- `today.md` location and the estate-check prompt.
- A Vercel ignore step for `.icm/`-only diffs (D38's optional cost recipe).

## Open questions

- none
