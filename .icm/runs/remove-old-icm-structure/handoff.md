# Handoff remove-old-icm-structure

## Next action

The operator answers Q4 on the HUD card of pull request #218. Then the operator says `revise triage/remove-old-icm-structure` with the change that Q1 and Q4 decide. The revise session edits `spec.md` and refreshes the body. Then the operator ticks Spec approved again and says `build triage/remove-old-icm-structure`.

## Answers of record

- Q1: Replace `ci.yml` with a workflow of this repo in this ticket. This is not the default.
- Q2: Remove the lane `hotfix`. A production fault uses the lane `bug`. This is the default.
- Q3: Delete the skills `pr-conventions` and `ticket-craft`. This is the default.

## Why the build stopped

The build session of 2026-11-16 found Spec approved ticked. The spec keeps `ci.yml` with no change: the section Proposed change, the second acceptance criterion and the section Out of scope. The answer to Q1 replaces `ci.yml`. The spec does not say what the new workflow runs. That is a requirement, so Build does not decide it. Q4 asks it.

## How to test

Open the Vercel preview of pull request #218. Look at the home page and two case studies. They must look the same as on jamienisbet.com.

## Blockers

- Q4 waits for the operator (pull request #218).
- `revise` is necessary: the spec conflicts with the answer to Q1.
- Spec approved must be ticked again after the revise.

## Do not touch

- `.icm/_system/`, `.icm/.copier-answers.yml`, `.github/workflows/icm.yml`.
- The stubs in `_done/`.
