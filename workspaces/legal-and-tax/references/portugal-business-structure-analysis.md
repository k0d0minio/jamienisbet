# Portugal Business-Structure & Tax Analysis — Solo Software Engineer / AI Consultant

> **Purpose of this file:** structured input for downstream higher-level planning. All figures are 2026 tax-year rules, verified against current sources (see Sources). Not formal tax advice — activity-code classification and final registration to be confirmed with a Portuguese *contabilista*.
> **Prepared:** 2026-06-15

---

## 1. Input parameters (assumptions this analysis rests on)

| Parameter | Value |
|---|---|
| Annual gross invoicing | ~€50,000 (€42k recurring retainer + ~€8k irregular project work) |
| Real business costs | ~€300–400/month (~€4,000/yr): SaaS + occasional office rental |
| Cost profile | Labour-dominant; real costs ≈ 8% of gross |
| Client base | 100% non-Portuguese; clients require only an invoice |
| Profit usage | All profit drawn to live on (no retention/reinvestment capacity) |
| Tax residency | Became Portuguese tax resident in 2026; no prior PT residency |
| Current regime status | Holds neither NHR nor IFICI; starting from zero (no início de atividade yet) |
| Limited-liability need | None |
| Horizon | Long-term Portugal setup |
| Trading name | Personal name "Jamie Nisbet" (no brand entity required) |
| Location | Mafra, Portugal (municipal derrama assumed up to 1.5%) |

---

## 2. Bottom line

**Freelancer wins decisively.** Register as a self-employed service provider (*trabalhador independente*, recibos verdes) under the **regime simplificado**.

A company (Unipessoal Lda) is strictly worse for this profile, and the deciding factor is the requirement to extract everything. A company's tax advantage comes from *retaining* earnings and deferring the second tax layer. The moment profit is pulled out to live on, it incurs corporate tax **plus** 28% dividend tax (or high social security on a director's salary) — more total tax than the freelancer route, plus mandatory organised accounting (~€1,500–3,000/yr), Modelo 22, IES, and more admin. It buys limited liability that is not needed.

**Note on "business entity":** the most tax-efficient vehicle here is the *simplest* one. Simple self-employment carries a 21.4% social-security rate on 70% of invoicing. Formalising as an *Empresário em Nome Individual* (ENI) triggers a 25.2% rate, and a company adds the dividend layer. So "set up as a business entity" is best satisfied by plain *trabalhador independente* status, not by an ENI designation or an Lda.

---

## 3. Why the simplified regime minimises tax

- **Deemed-expense gift:** under the simplified regime, 75% of service income is taxed and 25% is presumed as expenses. Real costs are ~8% of gross, so **~17% of revenue is permanently untaxed**. Organised accounting (company or freelancer) cannot replicate this — there, only real costs are deductible. The simplified regime only loses when real expenses exceed the 25% allowance; this is the opposite situation.
- **Lower social security:** 21.4% applied to 70% of invoicing (~15% of gross), versus ~29.6% on a company director's salary.
- **No mandatory accountant** under the simplified regime (recommended anyway at ~€600–1,200/yr for IVA/VIES filings and the classification question below).

### IFICI is ruled out — do not structure around it
Current guidance is explicit: working remotely for foreign clients with no connection to a recognised Portuguese entity does **not** confer IFICI eligibility. Eligibility is restricted to higher-education teachers, researchers, qualified staff inside companies with productive-investment tax benefits, certified start-ups, and similar. A solo freelancer invoicing foreign clients directly fits none of these. Even forcing a fit via a self-owned company would apply the flat 20% only to salary, and after social security + dividend tax it would still not beat the simplified regime at this income level.

---

## 4. The numbers (≈€50k/yr gross)

Two startup benefits front-load the savings:
- **First 12 months: total social-security exemption** (automatic on first-time registration).
- **Coefficient reduction:** the 0.75 coefficient is reduced **50% in year 1** and **25% in year 2**, provided there is no employment (Cat. A) or pension (Cat. H) income in those years — satisfied here.

### 4.1 Three-year ramp

| Period | Social security | Taxable base | IRS (approx, pre-credits) | Effective wedge (tax + SS) |
|---|---|---|---|---|
| Year 1 (2026) | €0 (exempt) | ~€18.7k–22k | ~€3.5–4k | **~7–8%** |
| Year 2 (2027) | ~€7,490 | ~€28.1k | ~€5.8k | **~27%** |
| Year 3+ (2028→) | ~€7,490 | €37.5k | ~€9.0k | **~31–33%** |

Dependent children (Maëlo, Amélia) generate additional IRS tax credits on top, lowering the IRS figures further. Excluded above to keep the business comparison clean.

### 4.2 Social-security calculation (steady state)
`21.4% × 70% × €50,000 = €7,490/yr (~€624/month)`
- Mechanism: quarterly declaration; base = relevant income (70% of services) ÷ 3.
- Monthly base €2,917 is well under the 2026 cap of €6,445.56 (12 × IAS).
- Relevant income adjustable ±25% in 5% steps to smooth lumpy project income.
- Minimum €20/month applies in any quarter declared at/near zero.

### 4.3 Steady-state effective wedge
`SS €7,490 + IRS ~€9,085 = €16,575 on €50,000 ≈ 33%` (tax + SS, pre personal credits).
Net cash after tax/SS and real costs ≈ **€29,000–30,000/yr**; lower with credits applied.

### 4.4 Freelancer vs company — net in pocket (steady state)

| Structure | Net after tax / SS / real costs |
|---|---|
| Simplified *trabalhador independente* | ~€29,000–30,000 |
| Unipessoal Lda, full extraction | ~€27,000–28,000 |

Company path = 15% IRC on first €50k profit + up to 1.5% municipal derrama, **plus** 28% dividend tax, **plus** ~€2.5k forced accounting, **and** forfeits both startup benefits (no coefficient reduction, no SS-exempt year). Loses on every axis relevant here.

---

## 5. Key lever worth real money — resolve with a contabilista

The activity-code classification sets the coefficient, and for software work it is contested:
- **0.75** — services listed in the Article 151 CIRS table (professional services).
- **0.35** — "other services" not on the Article 151 list.

At 0.35, the taxable base would be ~€17,500 instead of €37,500 — roughly **halving IRS**. Whether building products / software development defensibly qualifies for 0.35 is a genuine grey area; the AT assesses the *substance* of the work, not merely the CAE/activity code chosen. This single decision moves total tax more than freelancer-vs-company does. **Do not self-select the aggressive position blind** — have a contabilista assess specific deliverables and reclassification risk before filing início de atividade.

### Illustrative impact of the coefficient

| Coefficient | Taxable base (€50k gross) | IRS (approx, pre-credits) | Effective wedge incl. SS |
|---|---|---|---|
| 0.75 | €37,500 | ~€9,085 | ~33% |
| 0.35 | €17,500 | ~€2,900 | ~21% |

---

## 6. 2026 IRS brackets used (marginal rates on taxable income)

Thresholds raised 3.51%; 2nd–5th bracket rates cut 0.3pp (OE 2026, Lei 73-A/2025). Only brackets 1–6 are relevant at this income.

| Bracket | Taxable income (€) | Marginal rate |
|---|---|---|
| 1 | 0 – 8,342 | 13.0% |
| 2 | 8,342 – 12,587 | 16.2% |
| 3 | 12,587 – 17,838 | 21.7% |
| 4 | 17,838 – 23,089 | 24.7% |
| 5 | 23,089 – 29,397 | 31.7% |
| 6 | 29,397 – 41,952 | 35.5% |
| 7–9 | above 41,952 | 43.5% / 45% / 48% (approx upper thresholds ~€46.6k / ~€86.6k) |

---

## 7. Setup steps

1. **Início de atividade** at Finanças (Portal das Finanças): choose *regime simplificado*, set activity/CIRS code (the 0.75/0.35 decision in §5), and a start date that maximises the SS-exempt and reduced-coefficient window.
2. **VIES registration:** intra-EU B2B services require the normal IVA regime + VIES. EU-business clients are reverse-charged (invoice without IVA); UK/US B2B services are outside Portuguese IVA scope. Net effect: little/no IVA charged, but periodic IVA declarations + recapitulative statements still filed. Identical under either structure — not a deciding factor.
3. **Issue faturas-recibo** (recibos verdes) per invoice via the portal.
4. **Quarterly SS declaration** (Apr/Jul/Oct/Jan) once the 12-month exemption ends; use the ±25% adjustment for lumpy income.
5. **Annual IRS Modelo 3 + Anexo B.** No certified accountant legally required under the simplified regime; ~€600–1,200/yr recommended for IVA/VIES and the classification question.

---

## 8. When to revisit this recommendation

Re-model a company if any of these change:
- **Income scales materially** (≈€100k+): progressive rates bite harder; retention/structuring start to pay off. (Simplified regime caps at €200k gross.)
- **Liability exposure appears** (IP indemnities, deliverable warranties, hiring): limited liability earns its keep on non-tax grounds.
- **Retention becomes possible** (profit left inside the business to reinvest rather than fully drawn): the dividend-deferral advantage of a company activates.

None apply at present.

---

## 9. Reference rates snapshot (2026)

| Item | 2026 value |
|---|---|
| Simplified-regime coefficient (listed services) | 0.75 (taxable 75%) |
| Simplified-regime coefficient (other services) | 0.35 |
| Startup coefficient reduction | −50% yr 1, −25% yr 2 (no Cat. A/H income) |
| Self-employed SS rate | 21.4% on 70% of service invoicing |
| ENI SS rate (for contrast) | 25.2% |
| SS first-time exemption | 12 months, automatic |
| SS max monthly base | €6,445.56 (12 × IAS) |
| 15% expense-justification rule | applies to 0.75 and 0.35 coefficients; mandatory SS counts toward it |
| IRC general rate (mainland) | 19% |
| IRC PME rate, first €50k profit | 15% |
| Municipal derrama (Mafra assumed) | up to 1.5% |
| Dividend tax (resident individual) | 28% (or englobamento, 50% inclusion) |
| Organised-accounting threshold | mandatory above €200k gross |

---

## Sources

- IRS 2026 brackets (OE 2026 / Lei 73-A/2025): https://economiafinancas.com/2025/oficial-escaloes-das-taxas-de-irs-para-2026/ ; https://www.santander.pt/salto/escaloes-irs
- Simplified regime, 75%/25% coefficient and contabilista not required: https://www.abanca.pt/radar/irs-trabalhador-independente/ ; https://faccounting.pt/2025/03/05/1983/o-regime-simplificado-de-irs-em-portugal-o-que-e-e-como-funciona/
- Coefficient determined by nature of income, not CAE: https://www.occ.pt/pt-pt/noticias/irs-regime-simplificado-1
- Startup coefficient reduction (−50% / −25%, Art. 31.º n.º 10 CIRS): https://www.occ.pt/pt-pt/noticias/regime-simplificado-1 ; https://www.cgd.pt/Site/Saldo-Positivo/leis-e-impostos/Pages/Pode-aceder-ao-regime-simplificado.aspx
- 15% expense-justification rule: https://www.santander.pt/salto/regime-simplificado-irs
- Social security 21.4% on 70%, mechanics: https://www.deco.proteste.pt/dinheiro/impostos/noticias/recibos-verdes-obrigacoes-trabalhadores-independentes-seguranca-social ; https://www.montepio.org/ei/mais-recentes/trabalhador-independente-obrigacoes-para-com-a-seguranca-social/
- First-12-month SS exemption + 2026 caps (IAS, max contribution, ±25% adjustment): https://www.e-konomista.pt/obrigacoes-trimestrais-na-seguranca-social-freelancers/ ; https://simuladorneto.pt/seguranca-social-trabalhadores-independentes ; https://abilioo.pedroganco.com/blog/seguranca-social-trabalhador-independente-2026/
- ENI 25.2% rate contrast: https://www.abanca.pt/radar/pagamentos-seguranca-social-trabalhador-independente/
- IFICI eligibility restrictions / remote-foreign exclusion: https://expert-zoom.com/pt/revista/juridico/ifici-nhr-portugal-guia-fiscal ; https://contribuinte.pt/posts/explicacao-sobre-as-responsabilidades-fiscais-de-trabalhadores-estrangeiros-em-portugal
- IRC 2026 (19% general, 15% PME first €50k, derrama): https://contribuinte.pt/posts/irc-2026-taxa-calculo ; https://www.occ.pt/sites/default/files/public/2025-11/Alt_IRC.pdf ; https://www.cgd.pt/Site/Saldo-Positivo/negocios/Pages/obrigacoes-beneficios-fiscais-empresas.aspx

*Disclaimer: planning resource only, not formal tax or legal advice. Confirm activity-code classification and registration with a Portuguese contabilista before filing.*
