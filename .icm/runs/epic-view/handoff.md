# Handoff: epic-view

For the next session — human or agent — what to do first and what stands in the way.
Rewritten, not appended, at every stage stop; a stage that STOPs mid-way writes it before it
stops, so nothing is carried in anyone's head.

## Next steps

1. Operator smokes the admin-dashboard preview
   (https://jamie-nisbet-git-claude-lucid-thompson-fj7g96-kodominio.vercel.app/tickets) on a phone
   and a desktop, light and dark: an epic with a breakdown (e.g. `jamienisbet` →
   Tickets master detail), an epic without one, a Triage batch, In flight; Copy next and its
   chevron; a stub tapped in the pane; a cold `?b=<repo>/<batch>&pane=1` link losing `pane`.
2. Once **Ready to merge** is ticked on https://github.com/k0d0minio/jamienisbet/pull/160:
   `/pipeline release epic-view`. Release updates `websites/admin-dashboard/README.md` → the
   Tickets "Master–detail" paragraph (summary row and `&pane=1` are gone) — see Notes for Release.

## Blockers

- blocked on operator: smoke the preview, then tick **Ready to merge** in the body of
  https://github.com/k0d0minio/jamienisbet/pull/160

## Do not

- Do not tick either gate checkbox.
- Do not touch `ticket-view` / `repo-and-estate-views` / `keyboard-nav` — separate stubs, runs.
- Do not edit `.icm/scripts/run-pack.sh` — the parked
  `triage/template-change-sync-rules-multiline.md` goes to icm-board.
- Do not run build/lint/typecheck locally — CI is the source of truth.
