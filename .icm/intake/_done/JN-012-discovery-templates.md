> Dropped: superseded by JN-021 (house onboarding forms) + JN-022 (discovery templates) — referenced the retired /onboard command and _system/PROCESS.md. 2026-08-18

# JN-012 · House discovery templates in _system (berceo/messy-play patterns)

| | |
|---|---|
| Status | ready |
| Type | process |
| Priority | P2 |
| Size | M |

## Problem

Discovery is the estate's strongest pre-sale work and its least repeatable: berceo's
assessment `REPORT.md` + `QUESTIONS.md` (stable IDs, `[BLOCKER]`/`[LAWYER]` tags, "the
short list if we only get one meeting") and messy-play's `DISCOVERY-PROMPT.md`
(interview-as-prompt → project brief) were each invented from scratch in one repo, and
neither has ever produced a ticket. `/onboard` step 3 now says "thin discovery → cut a
discovery ticket", but there's nothing house-standard to cut it *from* — every new
deal reinvents the artifacts.

## Acceptance

- [ ] `_system/discovery/` holds skeleton templates distilled from the real artifacts:
      an interview script (`DISCOVERY-PROMPT.md` style), a questions doc
      (stable IDs + `[BLOCKER]` tags), and an assessment report shape
- [ ] Each template ends by producing tickets, not just a document — the last section
      is "cut what we now know into `.icm/intake/`"
- [ ] `_system/PROCESS.md` §2 and the `/onboard` command reference the templates
- [ ] Templates are generic (no client specifics) — this repo travels to the cloud

## Prompt

Create house discovery templates in _system/discovery/. Read
.icm/intake/JN-012-discovery-templates.md for full context, then distill the real
artifacts — projects/berceo/.icm/docs/QUESTIONS.md and REPORT.md, and
projects/messy-play/DISCOVERY-PROMPT.md (client repos beside this one, only present on
the machine) — into generic skeletons (interview script,
questions doc with stable IDs and [BLOCKER] tags, assessment report). Each template's
final section must instruct converting findings into .icm/intake/ tickets per
_system/TICKETS-SPEC.md. Update _system/PROCESS.md §2 and
.claude/commands/onboard.md to point at them. No client-specific content — this repo
is the one estate repo designed to travel.
