<!-- run: setup-exec v1 | date: 2026-07-01 | source: stages/03_setup_execution/CONTEXT.md; references/accounting-regimes.md, iva-vat-notes.md, social-security-notes.md; setup/output/config.md -->
# Início de Atividade — Action Plan (trabalhador independente, regime simplificado)

> **Decision-support only.** MANDATORY *contabilista certificado* review before anything is filed.
> The agent never files — every step is executed by Jamie or the contabilista on the Portal.
> Goal for today: **NIF confirmed + início de atividade filed (VAT-registered) + bank account open.**
> VIES listing follows in a few days, not same-day.

## Terminology reset (avoid the wrong expectation)
- **"Business number" = your personal NIF.** A trabalhador independente trades under your own NIF;
  no separate company number is issued.
- **"VAT number" = the same NIF, activated.** Declaring início de atividade + IVA registration turns
  your NIF into your VAT ID (intra-EU: `PT` + NIF). Domestic VAT status is immediate; **VIES**
  listing lags a few days.
- **Bank account** — not legally mandatory for a sole trader, but open a dedicated one for clean books.

## Two decisions to confirm BEFORE filing (do not self-select blind)
These are carried in full in [`../../../output/contabilista-brief.md`](../../../output/contabilista-brief.md) (Q1, Q2).

- **A — CIRS code & coefficient (0.75 vs 0.35).** The code sets the coefficient; the AT judges by
  substance. "Consultant/engineer" points to 0.75; 0.35 is strongest for genuine software-development
  output. Get the contabilista to back 0.35 **in writing** or register clean at 0.75. Splitting by
  substance (0.35 dev / 0.75 advisory) is on the table. See
  [`../../../references/accounting-regimes.md`](../../../references/accounting-regimes.md).
- **B — Start date.** The −50%/−25% coefficient reduction is **calendar-year** locked, so a mid-year
  start spends the −50% year on a half-year of income. The 12-month SS exemption is rolling, so it is
  **not** wasted. Confirm there is no smarter start date within the next few weeks, else start now and
  accept the partial window. See [`../../../references/social-security-notes.md`](../../../references/social-security-notes.md).

## Prerequisites checklist (today's gates)
- [ ] **NIF** confirmed (already held if PT-resident).
- [ ] **Portal das Finanças access** — Senha de Acesso **or** Chave Móvel Digital (CMD).
      *If neither: Senha is posted (~5 days) → file via CMD, in person at Finanças / Espaço Cidadão,
      or have the contabilista file today.*
- [ ] **NISS** (Social Security number) — often auto-created at início; needed for the yr-1 SS exemption.
- [ ] **IBAN** for refunds/contributions.
- [ ] Decisions **A** and **B** confirmed with the contabilista.

## Ordered steps (who / where)
| # | Step | Who | Where |
|---|---|---|---|
| 1 | Confirm NIF + Portal access (Senha/CMD) | Jamie | Portal das Finanças |
| 2 | Confirm/obtain NISS | Jamie / auto | Segurança Social Direta |
| 3 | Settle decision **A** (code + coefficient) and **B** (start date) | Contabilista + Jamie | — |
| 4 | Declare **Início de Atividade**: regime **simplificado**, activity code(s), **normal IVA regime** (not franquia) | Jamie / Contabilista | Portal → Entregar → Declaração de Início de Atividade |
| 5 | Register for **VIES** (intra-EU B2B) — expect a few days to go live | Jamie / Contabilista | Portal das Finanças |
| 6 | Open dedicated **bank account** (NIF, ID, proof of address) | Jamie | Bank / digital bank |
| 7 | Confirm **foreign-client invoice wording** (reverse-charge clause + VIES IDs; UK/US out-of-scope) | Contabilista | — |

## After registration — write entity facts back
Once filed, record CIRS code, IVA/VIES status, and start date to
[`_config/business/entity.md`](../../../../../_config/business/) and update
[`setup/output/config.md`](../../setup/output/config.md) if any locked assumption changed.

## Verify (stage gate)
- Every step traces to the decided structure (trabalhador independente, simplificado).
- The coefficient is **flagged for the contabilista**, not chosen blind.
- The start date is justified against the startup-benefit windows.
- **Review gate: MANDATORY contabilista review before anything is filed.**
