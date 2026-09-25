# Handoff: work-phone

For the next session — human or agent — what to do first and what stands in the way.
Rewritten, not appended, at every stage stop; a stage that STOPs mid-way writes it before it
stops, so nothing is carried in anyone's head.

## Next steps

1. Once **Spec approved** is ticked on https://github.com/k0d0minio/jamienisbet/pull/179, run
   `/pipeline build work-phone` and execute `plan.md` pass by pass.
2. To change the spec before approval: `revise work-phone "<what>"`.

## Blockers

- blocked on operator: tick **Spec approved** in the body of
  https://github.com/k0d0minio/jamienisbet/pull/179.

## Do not

- Do not tick either gate box.
- Do not change the desk layout (spec Out of scope) or delete the app tier from `packages/ui`
  (`retire-app-tier` owns it).
- Do not open a second PR or re-run `new-run.sh` for this run.
- Do not subscribe to PR activity (`_shared/github.md` → PR events).
