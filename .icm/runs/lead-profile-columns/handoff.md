# Handoff: lead-profile-columns

For the next session — human or agent — what to do first and what stands in the way.
Rewritten, not appended, at every stage stop; a stage that STOPs mid-way writes it before it
stops, so nothing is carried in anyone's head.

## Next steps

1. Operator: smoke the admin preview
   (https://jamie-nisbet-git-claude-tender-pasteur-nkhnw0-kodominio.vercel.app) against the
   13 criteria on https://github.com/k0d0minio/jamienisbet/pull/172 — at ≥1024px and on the
   iPhone. Paths worth a deliberate check are listed in `03_build/output/notes.md` → Notes for
   Release (the menu → opt-out sheet → page still clickable; j / k from a filtered list).
2. Tick **Ready to merge** in the PR body, then run `/pipeline release lead-profile-columns`.
3. Anything wrong in the smoke: `revise lead-profile-columns "<what>"` if the spec was wrong, or
   say what broke and re-run `build lead-profile-columns` to fix it on this branch.

## Blockers

- blocked on operator: smoke the preview and tick **Ready to merge** on
  https://github.com/k0d0minio/jamienisbet/pull/172

## Do not

- Do not tick either gate box.
- Do not rebuild the leads list here — `leads-table-board` owns `leads/page.tsx`; this run added
  only the `LeadOrderRecorder` line to it.
- Do not add a status-history table (D-23) or carry the list view in the URL (D-24).
- Do not subscribe to PR activity on this PR (`_shared/github.md` → PR events).
