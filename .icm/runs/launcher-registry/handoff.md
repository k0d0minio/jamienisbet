# Handoff: launcher-registry

For the next session — human or agent — what to do first and what stands in the way.
Rewritten, not appended, at every stage stop; a stage that STOPs mid-way writes it before it
stops, so nothing is carried in anyone's head.

## Next steps

1. Operator: smoke the admin-dashboard preview
   (https://jamie-nisbet-git-claude-jolly-lamport-s8y3tb-kodominio.vercel.app/tickets) — Start in
   Claude Code on a row and a batch, Open in terminal on an opened ticket, each maintenance
   launcher, recut, estate check; every link should look exactly as on production.
2. Tick **Ready to merge** on PR #140, then `release launcher-registry`.

## Blockers

- The Ready to merge gate (operator).

## Do not

- Tick the gate on the operator's behalf.
- Bump dependencies here — the `--branch` dependency-audit finding is the pre-existing
  `.icm/intake/triage/dependency-advisories-high-critical.md`, recorded in `03_build/output/error.log`.
- Start stub 2 (`model-effort-preselect`) until this PR has merged.
