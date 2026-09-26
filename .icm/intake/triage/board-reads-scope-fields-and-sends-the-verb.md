# Stub: The tickets board reads the template's stub fields and sends only the verb and the slug

- lane: chore
- found-by: estate audit 2026-09-26 (Jamie's rulings 2 and 3: the pipeline template's fields are the contract; `## Prompt` is optional) · 2026-09-26
- priority: P1
- complexity: medium

## Problem

`websites/admin-dashboard/lib/tickets.ts` reads `- epic:` (ten references) and never `- scope:`,
while every pipeline repo's stubs carry `- scope:` / breakdowns `- scope-slug:` / `- complexity:`
(the template's `intake/CONTEXT.md`, now `_system/contracts/TICKETS.md` too). "Copy prompt" still
sends the `## Prompt` body where a repo has no router, and the `/pipeline …` form where it has one;
the ruling is one string everywhere: the verb and the slug.

## Proposed change

- Parse `scope:` as the folder field (accept `epic:` as a legacy alias while old stubs exist),
  `scope-slug:` in breakdowns, `complexity:` as a badge beside `priority:`.
- "Copy prompt" and the deep links send `new <scope>/<slug>` for a scope stub, `<lane> <slug>`
  for a triage stub (`chore fix-dependencies`), `build <slug>` / `release <slug>` for a run in
  flight — the bare form `route-request.sh` routes — in every repo, router or not. Show a stub's
  `## Prompt`, when it has one, beside the button; never send it instead.
- The ticket detail shows the exact string it will send.
