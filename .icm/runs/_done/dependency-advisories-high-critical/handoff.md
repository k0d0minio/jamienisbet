# Handoff: dependency-advisories-high-critical

For the next session — human or agent — what to do first and what stands in the way.
Rewritten, not appended, at every stage stop; a stage that STOPs mid-way writes it before it
stops, so nothing is carried in anyone's head.

## Next steps

1. Push this commit, then `.icm/scripts/ci-status.sh dependency-advisories-high-critical` on the
   draft head → GREEN.
2. Run `.icm/scripts/retrospective.sh dependency-advisories-high-critical`, then
   `.icm/scripts/usage-snapshot.sh dependency-advisories-high-critical chore end` and
   `.icm/scripts/close-out.sh dependency-advisories-high-critical`.
3. Push the close-out commit, flip the PR ready, settle the full gate, then STOP and hand PR #142
   to the operator: smoke, then squash-merge from GitHub.

## Blockers

- none

## Do not

- Tick any gate checkbox — lane PRs carry none; the merge button is the gate.
- Merge the PR — the operator does that from GitHub after their own smoke.
- Widen the PR to the 4 remaining moderate advisories — out of this stub's scope
  (high + critical only).
