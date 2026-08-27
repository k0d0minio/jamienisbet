# Contabilista Pack

Two documents to send to the contabilista, together, before filing *início de atividade*.

| File | What it is |
|---|---|
| [`01-contabilista-brief.md`](01-contabilista-brief.md) | The **questions** — the decisions that should not be made without her, each with my working stance so she can correct rather than start from zero. |
| [`02-trabalhador-independente-obligations.md`](02-trabalhador-independente-obligations.md) | The **answers I think I have** — what the status is, every obligation, and every due date, marked ✅ confident / ⚠️ needs confirmation. |

The point of sending both is to get back: *what is wrong, what is missing, and what does not apply.*

## Provenance

These consolidate the legal-and-tax research carried out 15 June – 1 July 2026, which lived in
`workspaces/legal-and-tax/` until that tree was retired with the ICM factory on 2026-08-11
(commit `e4bd7cb`). The originals remain in git history:

- `workspaces/legal-and-tax/output/contabilista-brief.md` — the first version of document 01
- `workspaces/legal-and-tax/references/portugal-business-structure-analysis.md` — the root analysis, with the full source list
- `workspaces/legal-and-tax/references/` — accounting regimes, social security, IVA/VIES, IRS rates, entity structures, deductibles, glossary
- `workspaces/legal-and-tax/output/bar-management-decision.md` — the bar profit-share decision note

Read any of them with `git show e4bd7cb^:<path>`.

The compliance calendar that stage 05 of that workspace was meant to produce **was never generated** —
it was blocked on exactly this conversation. Document 02 §5 is that calendar, pending her review;
once confirmed it feeds [`JN-027`](../../intake/JN-027-seed-compliance-calendar.md) and the
dashboard's `biz.compliance_dates`.

## Standing caveat

Decision-support only. Nothing in either document is asserted as fact or as tax advice.
