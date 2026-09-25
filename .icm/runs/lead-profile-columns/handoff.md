# Handoff: lead-profile-columns

For the next session — human or agent — what to do first and what stands in the way.
Rewritten, not appended, at every stage stop; a stage that STOPs mid-way writes it before it
stops, so nothing is carried in anyone's head.

## Next steps

1. Once **Spec approved** is ticked on https://github.com/k0d0minio/jamienisbet/pull/172, run
   `/pipeline build lead-profile-columns` and execute `plan.md` pass by pass.
2. To change the spec first: `revise lead-profile-columns "<what>"`.

## Blockers

- blocked on operator: read the spec and tick **Spec approved** in the body of
  https://github.com/k0d0minio/jamienisbet/pull/172

## Do not

- Do not tick either gate box; do not start Build before the tick.
- Do not rebuild the leads list (`leads-table-board` owns it) — only mount the order recorder.
- Do not add a status-history table or migration (out of scope, decided in Define).
- Do not subscribe to PR activity on this PR (`_shared/github.md` → PR events).
