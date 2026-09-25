# Project: lead-profile-columns

The run's context card — what a fresh session needs before it reads anything else. Pointers,
not copies: the spec stays the spec, the scope stays the scope. Seeded when the run is opened
(`new-run.sh` → `run-pack.sh --init`), sharpened by whichever stage learns something. Read with
`status.md` and `handoff.md` on every resume (`_shared/stage-preamble.md`).

- stub: intake/admin-cockpit-redesign/lead-profile-columns.md
- scope: .icm/runs/admin-cockpit-redesign/01_scope/output/scope.md
- spec: 02_define/output/spec.md
- touches: websites/admin-dashboard/app/(app)/leads/[id]/page.tsx, websites/admin-dashboard/app/(app)/leads/[id]/loading.tsx, websites/admin-dashboard/app/(app)/leads/[id]/error.tsx, websites/admin-dashboard/app/(app)/leads/page.tsx, websites/admin-dashboard/components/lead-action-row.tsx, websites/admin-dashboard/components/lead-next-action.tsx, websites/admin-dashboard/components/lead-status-row.tsx, websites/admin-dashboard/components/lead-links.tsx, websites/admin-dashboard/components/lead-contact-card.tsx, websites/admin-dashboard/components/lead-facts-card.tsx, websites/admin-dashboard/components/lead-deal-card.tsx, websites/admin-dashboard/components/lead-deal-folder.tsx, websites/admin-dashboard/components/lead-intake.tsx, websites/admin-dashboard/components/lead-suppress.tsx, websites/admin-dashboard/components/lead-touches.tsx, websites/admin-dashboard/components/lead-reply.tsx, websites/admin-dashboard/components/lead-draft.tsx, websites/admin-dashboard/components/lead-notes-card.tsx, websites/admin-dashboard/components/lead-segments.tsx, websites/admin-dashboard/components/touch-row.tsx, websites/admin-dashboard/components/client-actions.tsx, websites/admin-dashboard/components/form-links.tsx, websites/admin-dashboard/components/next-step-pane.tsx, websites/admin-dashboard/components/mark-touched-button.tsx, websites/admin-dashboard/components/work-started-button.tsx, websites/admin-dashboard/components/app-screen.tsx, websites/admin-dashboard/lib/lead-segments.ts, websites/admin-dashboard/README.md
- complexity: standard → model: sonnet (executor — select-model.sh --stage 03_build)

## Constraints

- Behaviour of every existing sheet, panel and server action is unchanged — layout and styling
  only (spec Out of scope).
- No schema change: the "came in" row is derived from `created_at` + `source`; status history is
  out of scope.
- j / k order is session storage only; no list query is re-run on the profile.
- Todos stay gone (D-16); the brand does not change (D-3, D-4); tickets are untouched.
- `leads/page.tsx` belongs to `leads-table-board` too — one import and one mounted component,
  nothing else there.

## Context budget

- Define read the current profile page, the canvas "Lead profile" artboard and a few targeted
  files (action row, next-step pane, form-links copy, touches schema) to pin behaviour and
  `touches:`; no wider codebase read.
