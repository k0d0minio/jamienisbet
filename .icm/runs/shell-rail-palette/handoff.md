# Handoff: shell-rail-palette

For the next session — human or agent — what to do first and what stands in the way.
Rewritten, not appended, at every stage stop; a stage that STOPs mid-way writes it before it
stops, so nothing is carried in anyone's head.

## Next steps

1. Operator: read `02_define/output/spec.md`; change it with `revise shell-rail-palette "<what>"`.
2. Operator: tick **Spec approved** in the body of https://github.com/k0d0minio/jamienisbet/pull/170.
3. Then `/pipeline build shell-rail-palette` — execute `plan.md` pass by pass.

## Blockers

- blocked on operator: tick **Spec approved** on https://github.com/k0d0minio/jamienisbet/pull/170

## Do not

- Do not start Build before the Spec approved box is ticked; never tick it.
- Do not remove the Money route, its page, its Stripe code, or the feed's Money / Today's tickets
  sections — `inbox-rebuild` and D-17 own that.
- Do not restyle the screens inside the shell — the later stubs own them.
- Do not add a GitHub fetch path for the palette — reuse `readBoard()`.
