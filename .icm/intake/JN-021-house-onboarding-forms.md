# JN-021 · House onboarding forms — project-intake + client-onboarding

| | |
|---|---|
| Status | ready |
| Type | process |
| Priority | P1 |
| Size | M |

## Problem

The onboarding wiring is complete end to end (send → frozen snapshot → answers →
touchClient → answers committed into the client repo as `.icm/docs/form-*.md`), but the
house library is **empty**: `.icm/onboarding/` holds only README.md, whose Files section
links to a deleted `project-intake.md`. A lead without a delivery repo can be sent
nothing. The proven pattern sits ungeneralized in one client repo:
`projects/casey-hebbel/.icm/onboarding/casey-scoping.md` (pre-quote, "before I quote
you") and `casey-onboarding.md` (post-sale content gathering).

## Build

1. `.icm/onboarding/project-intake.md` — pre-quote scoping, generalized from
   casey-scoping.
2. `.icm/onboarding/client-onboarding.md` — post-sale content/access gathering, from
   casey-onboarding.
3. Fix the README's Files section to list what actually exists.
4. Close the intake→project loop: one line in `_system/contracts/PROJECT.md` — **in the
   `icm-board` repo**, so a separate commit there — naming
   committed form answers (`.icm/docs/form-*.md` in the client repo) as first-class
   provenance input for `/project`'s first run.

Format per the `.icm/onboarding/README.md` spec: front matter title/intro, one `##` per
question, field types text/textarea/select/boolean only. Generic — no client specifics;
this repo travels to the cloud.

Explicitly out of scope: auto-sending the scoping link from the portfolio thank-you page
— that would breach "no outbound action without review". A deliberate decision for
Jamie, not a default.

## Acceptance

- [ ] The form picker on a lead with no delivery repo offers both forms
- [ ] Both forms parse — verified by sending one to a test lead (`sendFormToClient`
      inserts nothing on parse failure)
- [ ] README links only real files
- [ ] PROJECT.md carries the provenance line

## Prompt

Create the house onboarding form library. Read
.icm/intake/JN-021-house-onboarding-forms.md for full context, then generalize
projects/casey-hebbel/.icm/onboarding/casey-scoping.md and casey-onboarding.md (client
repo beside this one, only present on this machine) into .icm/onboarding/
project-intake.md and client-onboarding.md, following the format spec in
.icm/onboarding/README.md and fixing its Files section. Add the form-answer provenance
line to _system/contracts/PROJECT.md in the icm-board repo (separate commit, that repo).
No client-specific content. Open a PR on a claude/
branch; do not run local checks — CI is the source of truth.
