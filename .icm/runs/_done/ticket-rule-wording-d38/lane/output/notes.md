# Chore: ticket-rule-wording-d38

- invariant: no code or behaviour changes; only the ticket-commit rule's wording differs — it now
  states D38 (ticket PR into the ticket base branch) instead of "straight to `main`".
- change: `AGENTS.md` → Standing rules: ticket-only changes land as a ticket PR into the ticket
  base branch (`main` here), pointing at `pr-conventions` → The ticket PR.
- change: `.icm/intake/README.md` → header note and Standing rules: the board reads each repo's
  ticket base branch; an unmerged stub does not exist; ticket PR per `pr-conventions`.
- change: `.icm/CONTEXT.md` → "The board reads `main`" carried the same stale rule; the file is
  project-owned (not in `.icm/MANIFEST`), so it is corrected in the same pass.
- rollback: revert the squash commit — docs only.
- learned: none
