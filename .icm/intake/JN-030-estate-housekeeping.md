# JN-030 · Estate housekeeping — stale references and conformance gaps

| | |
|---|---|
| Status | ready |
| Type | chore |
| Priority | P2 |
| Size | S |

## Problem

The audit names the estate's failure mode: "aspirational docs are richer than the
running system." Current instances, all small:

1. `_system/TICKETS-SPEC.md` (now `_system/contracts/TICKETS.md`) still cited in four
   live places: `README.md:40`, `.icm/intake/README.md:4`,
   `websites/admin-dashboard/lib/tickets.ts:5,33` (comments),
   `websites/admin-dashboard/README.md:158`.
2. `.icm/docs/decisions.md:15` points at `_system/icm-template` and `/onboard`, both
   retired.
3. `_system/template/README.md` cross-references "README.md § Decisions #3" — that
   section moved to `AUDIT.md` on 2026-08-14.
4. `_system/scripts/icm-check.sh` discovers repos with `-mindepth 2`, so the house repo
   is exempt from its own conformance check — include the root.
5. `projects/the-library` has no `.icm`/`.claude` baseline — one `icm-check.sh --fix`
   away; run it and confirm the suggested prefix.

## Acceptance

- [ ] Zero references to retired paths/commands remain (grep for TICKETS-SPEC,
      icm-template, /onboard, PROCESS.md)
- [ ] `icm-check.sh` checks the root repo
- [ ] the-library passes `icm-check.sh`
- [ ] CI green

## Prompt

Do the estate housekeeping pass. Read .icm/intake/JN-030-estate-housekeeping.md for the
itemized list: fix the four stale TICKETS-SPEC.md citations, the retired pointers in
.icm/docs/decisions.md and _system/template/README.md, make
_system/scripts/icm-check.sh include the root repo, and seed projects/the-library with
icm-check.sh --fix (client repo on this machine only). Code/script changes go through a
PR on a claude/ branch; do not run local checks — CI is the source of truth.
