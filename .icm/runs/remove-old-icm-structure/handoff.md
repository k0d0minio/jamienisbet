# Handoff remove-old-icm-structure

## Next action

The operator answers Q1, Q2 and Q3 on the HUD card of pull request #218. Then the operator says `new triage/remove-old-icm-structure` again. That session runs `questions.sh`, puts the answers in `spec.md` and refreshes the body. Then the operator ticks Spec approved and says `build triage/remove-old-icm-structure`.

## How to test

Open the Vercel preview of pull request #218. Look at the home page and two case studies. They must look the same as on jamienisbet.com.

## Blockers

- Q1, Q2 and Q3 wait for the operator (pull request #218).
- Spec approved is not ticked.

## Do not touch

- `.icm/_system/`, `.icm/.copier-answers.yml`, `.github/workflows/icm.yml`.
- The stubs in `_done/`.
