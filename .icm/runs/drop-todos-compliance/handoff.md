# Handoff: drop-todos-compliance

For the next session — human or agent — what to do first and what stands in the way.
Rewritten, not appended, at every stage stop; a stage that STOPs mid-way writes it before it
stops, so nothing is carried in anyone's head.

## Next steps

1. Operator reads `02_define/output/spec.md` and ticks **Spec approved** on
   https://github.com/k0d0minio/jamienisbet/pull/168 — then `build drop-todos-compliance`.
2. Build follows `plan.md` pass by pass; load the `database-migration` capability skill for pass 3.

## Blockers

- blocked on operator: tick **Spec approved** in the body of https://github.com/k0d0minio/jamienisbet/pull/168

## Do not

- Do not export rows, add a backup step, or run `db:migrate` against any database — decided in Define.
- Do not hand-write the migration or use `check-migrations.sh --new`; `db:generate` only.
- Do not touch any other feed section, the Leads list or Money — later stubs own them.
- Do not tick either gate checkbox.
