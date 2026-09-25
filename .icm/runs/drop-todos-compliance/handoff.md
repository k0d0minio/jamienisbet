# Handoff: drop-todos-compliance

For the next session — human or agent — what to do first and what stands in the way.
Rewritten, not appended, at every stage stop; a stage that STOPs mid-way writes it before it
stops, so nothing is carried in anyone's head.

## Next steps

1. Operator smokes the admin preview (https://jamie-nisbet-git-claude-tender-bell-b89xas-kodominio.vercel.app):
   `/` has no Overdue section, no compliance row, no `+` on the title bar, and the "N things
   waiting" count is right; a `/leads/<id>` Work segment has Notes and Forms, no Todos card.
2. Operator ticks **Ready to merge** on https://github.com/k0d0minio/jamienisbet/pull/168,
   then `release drop-todos-compliance`.
3. Release: read `Apply migrations to production` on `main` after the merge (the one criterion
   still open), then smoke `/` and one `/leads/<id>` in production once the new deployment is live
   (03_build/output/notes.md → Notes for Release).

## Blockers

- blocked on operator: smoke the preview and tick **Ready to merge** on https://github.com/k0d0minio/jamienisbet/pull/168

## Do not

- Do not revert this PR after the merge — 0026 is forward-only; recover by fix-forward (`hotfix`).
- Do not run `db:migrate` against any database; `main` applies it.
- Do not tick either gate checkbox.
