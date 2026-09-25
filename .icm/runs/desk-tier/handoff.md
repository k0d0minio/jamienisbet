# Handoff: desk-tier

For the next session — human or agent — what to do first and what stands in the way.
Rewritten, not appended, at every stage stop.

## Next steps

1. Operator reads the spec (`.icm/runs/desk-tier/02_define/output/spec.md`) and ticks
   **Spec approved** on https://github.com/k0d0minio/jamienisbet/pull/169.
2. Then `/pipeline build desk-tier` — execute `plan.md` pass by pass.

## Blockers

- blocked on operator: tick **Spec approved** in the body of https://github.com/k0d0minio/jamienisbet/pull/169

## Do not

- Do not start Build before the Spec approved tick; never tick it.
- Do not link `desk.css` from the admin or touch anything under `websites/` — later stubs do.
- Do not edit the shared `Button`, the app tier, or any existing token file.
- Do not add a specimen page — the operator declined one.
