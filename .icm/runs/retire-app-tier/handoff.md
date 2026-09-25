# Handoff: retire-app-tier

For the next session — human or agent — what to do first and what stands in the way.
Rewritten, not appended, at every stage stop; a stage that STOPs mid-way writes it before it
stops, so nothing is carried in anyone's head.

## Next steps

1. The operator reads `02_define/output/spec.md`, then ticks **Spec approved** in the body of
   https://github.com/k0d0minio/jamienisbet/pull/182.
2. Then `/pipeline build retire-app-tier`: execute `plan.md` pass by pass, one commit per pass.

## Blockers

- blocked on operator: tick **Spec approved** on https://github.com/k0d0minio/jamienisbet/pull/182

## Do not

- Do not start Build before the Spec approved tick, and never tick it yourself.
- Do not change Stripe or Money server code, or put Money back in the navigation (D-17).
- Do not touch `websites/portfolio/`, `websites/sellers-site/` or the marketing tokens (D-22).
- Do not remove sheet detents (D-48).
