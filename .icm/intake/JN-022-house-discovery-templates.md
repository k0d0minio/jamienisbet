# JN-022 · House discovery templates in _system/discovery/

| | |
|---|---|
| Status | ready |
| Type | process |
| Priority | P2 |
| Size | M |

## Problem

Discovery is the estate's strongest pre-sale work and its least repeatable (formerly
JN-012, re-cut against the current layout): berceo's assessment `REPORT.md` +
`QUESTIONS.md` (stable IDs, `[BLOCKER]`/`[LAWYER]` tags, "the short list if we only get
one meeting") and messy-play's `DISCOVERY-PROMPT.md` (interview-as-prompt → project
brief) were each invented from scratch in one repo and never reused. Every new deal
reinvents the artifacts. Distinct from JN-021: these are working documents for Jamie,
not questionnaires sent to clients.

## Acceptance

- [ ] `_system/discovery/` holds skeleton templates distilled from the real artifacts:
      an interview script, a questions doc (stable IDs + `[BLOCKER]` tags), and an
      assessment report shape
- [ ] Each template's final section is "cut what we now know into `.icm/intake/`" per
      `_system/contracts/TICKETS.md` — discovery ends in tickets, not just a document
- [ ] Registered in `_system/README.md`'s routing so it can be found
- [ ] Templates are generic (no client specifics) — this repo travels to the cloud

## Prompt

Create house discovery templates in _system/discovery/. Read
.icm/intake/JN-022-house-discovery-templates.md for full context, then distill the real
artifacts — projects/berceo/.icm/docs/QUESTIONS.md and REPORT.md, and
projects/messy-play/DISCOVERY-PROMPT.md (client repos beside this one, only present on
this machine) — into generic skeletons. Each template's final section must instruct
converting findings into .icm/intake/ tickets per _system/contracts/TICKETS.md. Register
the folder in _system/README.md. No client-specific content. Open a PR on a claude/
branch; do not run local checks — CI is the source of truth.
