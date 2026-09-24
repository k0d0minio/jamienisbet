# Handoff: keyboard-nav

For the next session — human or agent — what to do first and what stands in the way.
Rewritten, not appended, at every stage stop; a stage that STOPs mid-way writes it before it
stops, so nothing is carried in anyone's head.

## Next steps

1. The operator smokes the admin preview on a desktop, keyboard only
   (https://jamie-nisbet-git-claude-exciting-mendel-k1rcl6-kodominio.vercel.app/tickets) —
   every criterion in the PR body, plus VoiceOver on the listbox (the one criterion left
   unticked: its semantics are built, the announcement is unverified).
2. Once **Ready to merge** is ticked on https://github.com/k0d0minio/jamienisbet/pull/166, run
   `/pipeline release keyboard-nav`.

## Blockers

- blocked on operator: smoke the preview and tick **Ready to merge** in the body of PR #166.

## Do not

- Do not tick Ready to merge; do not merge before Release.
- Do not open a second PR — this run's branch is `claude/exciting-mendel-k1rcl6`.
- Read `03_build/output/notes.md` → Notes for Release before reviewing: three behaviours the
  spec left implicit were settled there.
