# Project: inbox-rebuild

The run's context card — what a fresh session needs before it reads anything else. Pointers,
not copies: the spec stays the spec, the scope stays the scope. Seeded when the run is opened
(`new-run.sh` → `run-pack.sh --init`), sharpened by whichever stage learns something. Read with
`status.md` and `handoff.md` on every resume (`_shared/stage-preamble.md`).

- stub: intake/admin-cockpit-redesign/inbox-rebuild.md
- scope: .icm/runs/admin-cockpit-redesign/01_scope/output/scope.md
- spec: 02_define/output/spec.md
- touches: websites/admin-dashboard/app/(app)/inbox, websites/admin-dashboard/components/inbox-list.tsx, websites/admin-dashboard/components/inbox-detail.tsx, websites/admin-dashboard/components/inbox-row.tsx, websites/admin-dashboard/components/nurture-wakes.tsx, websites/admin-dashboard/components/lead-row.tsx, websites/admin-dashboard/components/swipe-row.tsx, websites/admin-dashboard/app/(app)/actions.ts, websites/admin-dashboard/lib/inbox.ts, websites/admin-dashboard/README.md
- complexity: standard → model: sonnet (executor — select-model.sh --stage 03_build)

## Constraints

- Nothing is sent from the Inbox — standing rule "no outbound action without review"; reach is a link, a touch is logged by hand (D-33).
- No change to the due, stale or crack-finder rules, or to the caps' values (spec → Out of scope).
- No Stripe or GitHub read on `/inbox`; Money's route and Stripe code stay dormant (D-17). Gates and PRs are `gates-read`'s.
- Desk tier only for new UI; do not restyle Leads through shared `LeadRow`/`SwipeRow`.

## Context budget

- Define read `app/(app)/inbox/page.tsx`, `lib/inbox.ts`, the wake/touch actions in `actions.ts` and the canvas's two Inbox artboards beyond its Inputs — to settle exact behaviour and the badge rule.
