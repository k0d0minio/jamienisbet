# Handoff: inbox-rebuild

For the next session — human or agent — what to do first and what stands in the way.
Rewritten, not appended, at every stage stop; a stage that STOPs mid-way writes it before it
stops, so nothing is carried in anyone's head.

## Next steps

1. Operator reads the spec (`02_define/output/spec.md`, or the PR's Spec block on
   https://github.com/k0d0minio/jamienisbet/pull/174); changes go through
   `revise inbox-rebuild "<what>"`.
2. Once **Spec approved** is ticked: `/pipeline build inbox-rebuild`, executing `plan.md` pass by pass.

## Blockers

- blocked on operator: tick **Spec approved** in the body of https://github.com/k0d0minio/jamienisbet/pull/174

## Do not

- Do not tick either gate box, and do not start Build before the tick.
- Do not add the Gates and PRs group or any GitHub read to `/inbox` — that is `gates-read`.
- Do not generate AI drafts from the Inbox (D-33) or change the caps (D-30).
