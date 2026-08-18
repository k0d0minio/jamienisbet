> Dropped: not part of the 2026-08-18 routines/onboarding plan — cut in the clean-slate rewrite; resurrect under a new number if still wanted. 2026-08-18

# JN-003 · Replace the portfolio's placeholder case-study content

| | |
|---|---|
| Status | ready |
| Type | feature |
| Priority | P2 |
| Size | M |

## Problem

The portfolio's case studies (`websites/portfolio/content/work/*.md`) were written as
placeholders before the engagements finished. Populate them from the first delivered
engagements — real outcomes, real numbers where shareable, live-site `url` front-matter
where a site shipped. (Carried over from the retired BACKLOG.md "Deferred" list.)

## Acceptance

- [ ] Each published case study describes a real delivered engagement in Jamie's voice
      (see `packages/ui/BRAND.md`).
- [ ] Front-matter `url` set where a live site exists.
- [ ] No placeholder copy remains on `/work`.

## Prompt

Rewrite the case studies in websites/portfolio/content/work/ from real engagement outcomes.
Read .icm/intake/JN-003-portfolio-case-studies.md for full context; ask Jamie for the facts
of each engagement rather than inventing detail. Match the voice rules in
packages/ui/BRAND.md. Open a PR on a claude/ branch; do not run local checks — CI is the
source of truth.
