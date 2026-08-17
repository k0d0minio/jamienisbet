# JN-002 · Seed the compliance calendar

| | |
|---|---|
| Status | blocked |
| Type | owner |
| Priority | P1 |
| Size | S |

## Problem

The dashboard's working list surfaces upcoming compliance dates from
`biz.compliance_dates`, but the actual PT dates (IRS payments-on-account, quarterly
Segurança Social declarations, IES, IVA if applicable) must come from Jamie's contabilista.
Blocked on: the entity decision (sole trader vs Unipessoal Lda) and the contabilista's
confirmed obligations list. (Carried over from the retired BACKLOG.md, ticket B6.)

A **draft** calendar now exists in [`.icm/docs/contabilista/`](../docs/contabilista/) — §5 of
`02-trabalhador-independente-obligations.md`, with every entry marked confident or
needs-confirmation. It is **not** yet enterable: it still needs the contabilista's sign-off, and
the start date it derives from is undecided. Unblocks when she returns the pack reviewed.

## Acceptance

- [ ] The known annual/quarterly PT obligations are entered with source + as-of date in the
      notes.
- [ ] The working list shows the next deadline correctly; recurring items re-arm on
      completion.

## Prompt

Seed the compliance calendar in the jamienisbet admin dashboard. Read
.icm/intake/JN-002-seed-compliance-calendar.md for full context. This is data entry into
`biz.compliance_dates` via the dashboard's working list — the dates themselves must be
supplied/confirmed by Jamie's contabilista; do not invent them. Decision-support only:
everything needs review by a licensed Portuguese contabilista certificado.
