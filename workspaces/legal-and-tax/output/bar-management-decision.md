<!-- run: ad-hoc | date: 2026-06-30 | source: conversation 2026-06-30; references/iva-vat-notes.md, accounting-regimes.md, social-security-notes.md, entity-structures.md -->
# Decision Note — Bar Management Profit-Share (Trial Period)

> **Decision-support only.** Not reviewed by a *contabilista certificado* / lawyer yet.
> Confirm IVA wording, the management-services coefficient, and the single-client rule
> before the first invoice / IVA filing. No figure or legal conclusion asserted as fact.

## Context
Jamie is opening as **trabalhador independente (recibos verdes), regime simplificado** for
consulting/software (foreign clients) — see [`setup/output/config.md`](../setup/output/config.md).
Separately, a bar's owners have proposed Jamie **operates the bar** and **invoices 75% of its
profits** as his fee. The owners **retain ownership, all licences, staff employment, supplier
contracts, the bar's own VAT-on-sales, IRC and premises liability**. There is a **3-month trial**
before either side commits.

## Decision (trial period)
**Invoice the bar from the existing trabalhador independente activity during the 3-month trial.**
Do **not** open an Lda speculatively. Add a **management-services activity** to the *início de
atividade* on the Portal das Finanças (activities are easily added/removed).

**Rationale:** the risks that would justify a separate company — the **>80% single-client rule**
and **disguised-employment** exposure — accrue annually and over sustained time; a 3-month, low-
volume trial is too short/small to trip them. Operating liability is governed by the **contract**,
not the tax vehicle, so the Lda buys little during a low-stakes trial.

## Guardrails (apply from day one)
1. **Charge 23% IVA** on the bar invoices — it is a **Portuguese client** (domestic IVA), unlike
   the foreign consulting work. The bar reclaims it (wash for them) but Jamie must charge/remit it.
   Tell the contabilista **before the first IVA filing** — this is the point the setup stops being
   "near-zero IVA." See [`../references/iva-vat-notes.md`](../references/iva-vat-notes.md).
2. **Written services agreement** even for the trial: states Jamie operates as an independent
   contractor, the 75% formula, and that **owners retain ownership, licences, staff, supplier
   contracts**. This — not the tax vehicle — is what keeps the bar's liability with the owners.
3. **Track the € amount** of the 75% share — it drives the post-trial migration decision.

## Post-trial plan
- **Deal dies** → remove the management-services activity. No harm done.
- **Deal sticks and is material** → form a **Unipessoal Lda** Jamie owns; migrate the bar
  management contract into it to ring-fence IVA, single-client dependence, and operating
  liability away from the clean consulting activity. (An Lda is wrong for consulting — full
  extraction → IRC + 28% dividend, no liability need — but right for the bar, where liability
  isolation has value. See [`../references/entity-structures.md`](../references/entity-structures.md).)
- **Deal sticks but modest** → staying on recibos verdes for the bar stays defensible.

## Open questions for the contabilista
- Correct **IVA invoice wording** for a domestic B2B management service.
- **Coefficient** for the management-services activity (0.35 "other services" vs 0.75) — and any
  interaction with the year-1/2 startup coefficient reduction. See
  [`../references/accounting-regimes.md`](../references/accounting-regimes.md).
- **>80% single-client / economic-dependence** consequences if the bar becomes a large share of
  annual invoicing — incl. any additional SS contribution owed by the bar. See
  [`../references/social-security-notes.md`](../references/social-security-notes.md).
- Confirm the **owners-retain-everything** split holds for SS/labour and licensing purposes.

## Revisit trigger
Bar deal confirmed after trial **or** bar share becomes large/permanent → re-open the structure
decision (form the Lda). This pairs with the existing "real liability exposure" trigger in
[`setup/output/config.md`](../setup/output/config.md).
