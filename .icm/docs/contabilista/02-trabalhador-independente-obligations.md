<!-- date: 2026-08-17 | source: retired workspaces/legal-and-tax/ research corpus (2026-06-15 → 2026-07-01), refreshed -->
# Trabalhador Independente — Status, Obligations & Due Dates

**Jamie Nisbet** · Mafra · software engineering / AI consulting
**Prepared:** 17 August 2026 · **Status: not yet registered** — no *início de atividade* filed.

> **Purpose.** This is my own written understanding of what the *trabalhador independente /
> regime simplificado* status is, everything it obliges me to do, and when each thing falls due.
> It accompanies the **Brief for the Contabilista**, which lists the decisions I need help with.
>
> **This is decision-support, not advice.** Every line is my research, not a settled fact. Items are
> marked **✅ confident** or **⚠️ needs confirmation** — please correct the ✅s you disagree with and
> resolve the ⚠️s. Rates and thresholds are **2026 tax year** unless stated.

---

## 1. What the status actually is

**Trabalhador independente** is self-employed service-provider status. You trade **under your own
name and your own NIF** — no company is formed, no separate registration number is issued, and there
is no share capital, no articles, and no corporate filing.

- **"My business number" is my personal NIF.**
- **"My VAT number" is the same NIF, activated** — declaring *início de atividade* with IVA
  registration turns the NIF into the VAT ID (intra-EU form: `PT` + NIF).
- Liability is **unlimited** — there is no separation between me and the business. Accepted here:
  the consulting work carries no meaningful liability exposure.
- A **dedicated bank account is not legally required**, but is worth opening for clean books.

### Why this status rather than an ENI or a company
Recorded so the reasoning stays auditable:

| Structure | Social security | Tax on extracted profit | Accounting | Verdict |
|---|---|---|---|---|
| **Trabalhador independente, simplificado** | 21.4% on 70% of invoicing | IRS on the coefficient base | none mandatory | **chosen** |
| ENI (*Empresário em Nome Individual*) | **25.2%** | same as above | similar | worse — higher SS, no upside here |
| Unipessoal Lda | ~29.6% on director salary | 15% IRC **+ 28% dividend** | organised, ~€1.5–3k/yr | worse — double layer on full extraction |

**The deciding factor:** everything is drawn out to live on. A company's advantage is *retaining*
earnings to defer the second tax layer — pulling it all out incurs both layers. So the simplest
vehicle is also the most tax-efficient here. Net in pocket, steady state: **~€29–30k simplified vs
~€27–28k** for a fully-extracting Lda.

**IFICI is ruled out** — remote work for foreign clients with no connection to a recognised
Portuguese entity does not confer eligibility. ⚠️ *Confirm.*

**Revisit the structure if:** income scales to ~€100k+ · real liability exposure appears (IP
indemnities, warranties, hiring) · profit retention becomes possible · **or the bar deal goes ahead
and becomes material** (see §7).

---

## 2. How I get taxed

### 2.1 The coefficient — the mechanism that defines the regime
Under the *regime simplificado* you do **not** itemise expenses. A **coefficient** is applied to
gross service income to produce the **taxable base**; the remainder is a **deemed** expense
allowance.

| Coefficient | Applies to | Taxable base on €50k |
|---|---|---|
| **0.75** | Services listed in the **Art. 151.º CIRS** table (professional services) | €37,500 |
| **0.35** | *"Other services"* not on that list | €17,500 |

**⚠️ Which one applies to my work is the single biggest open question** — see Q1 of the brief. The
AT assesses the **substance** of the work, not the CAE code chosen. Planning assumes **0.75**.

**Why the regime wins here:** at 0.75, 25% of revenue is deemed expenses while real costs are ~8% —
so roughly **17% of revenue is permanently untaxed**. Organised accounting cannot replicate that.
The simplified regime only loses when real expenses exceed the allowance — the opposite of my case.

### 2.2 Startup reductions (front-loaded, and time-sensitive)
- **Coefficient reduction:** **−50% in year 1**, **−25% in year 2** (Art. 31.º n.º 10 CIRS),
  conditional on no employment (Cat. A) or pension (Cat. H) income in those years — satisfied.
  ⚠️ **Applied per calendar tax year, not rolling 12 months** — this is why the start date matters.
- **Social security: total exemption for the first 12 months**, automatic on first-time
  registration. ✅ This one *is* rolling, so a late start does not waste it.

### 2.3 IRS brackets (2026 — OE 2026 / Lei 73-A/2025)
Thresholds raised 3.51%; brackets 2–5 cut 0.3pp.

| Bracket | Taxable income (€) | Marginal rate |
|---|---|---|
| 1 | 0 – 8,342 | 13.0% |
| 2 | 8,342 – 12,587 | 16.2% |
| 3 | 12,587 – 17,838 | 21.7% |
| 4 | 17,838 – 23,089 | 24.7% |
| 5 | 23,089 – 29,397 | 31.7% |
| 6 | 29,397 – 41,952 | 35.5% |
| 7–9 | above 41,952 | 43.5% / 45% / 48% |

Two dependent children generate IRS credits on top — excluded from the figures below to keep the
comparison clean.

### 2.4 Segurança Social
- **21.4%** applied to **70% of service invoicing**.
- Steady state on €50k: `21.4% × 70% × €50,000 = ` **€7,490/yr (~€624/month)**.
- Monthly base ~€2,917 — well under the 2026 cap of **€6,445.56** (12 × IAS).
- Relevant income is **adjustable ±25% in 5% steps** to smooth lumpy project income.
- **Minimum €20/month** applies in any quarter declared at or near zero.

### 2.5 IVA
Client base is 100% non-Portuguese, which does most of the work:

| Client | Treatment |
|---|---|
| **EU B2B** | **Reverse charge** — invoice without IVA; show both VAT numbers + the reverse-charge clause |
| **UK / US B2B** | **Outside the scope** of Portuguese IVA |
| **Portuguese B2B** (only the bar, if it happens) | **23% IVA** charged and remitted normally |

**Net effect: little or no IVA actually charged — but the declarations must still be filed.**
⚠️ **And note the reverse direction:** buying SaaS/tooling from foreign suppliers appears to make me
liable to **self-assess IVA on those purchases** and declare it (recovering it in the same return,
so normally net nil). See Q5 of the brief.

### 2.6 The three-year ramp (0.75 assumed, pre-credits)

| Period | Social security | Taxable base | IRS (approx) | Effective wedge |
|---|---|---|---|---|
| **Year 1** | €0 (exempt) | ~€18.7–22k | ~€3.5–4k | **~7–8%** |
| **Year 2** | ~€7,490 | ~€28.1k | ~€5.8k | **~27%** |
| **Year 3+** | ~€7,490 | €37.5k | ~€9.0k | **~31–33%** |

**Reserve policy:** a flat **30% of gross** set aside for IRS + SS. Deliberately over-reserves in
year 1 while SS is exempt; approximately correct from year 3. ⚠️ *Sanity-check this.*

### 2.7 Records — why keep receipts at all
The **15% expense-justification rule** applies to both coefficients: part of the deemed allowance
must be backed by **real documented expenses**, and **mandatory social-security contributions count
toward it**. So keep documentation for SaaS and developer tooling, co-working/office rental,
work hardware, and professional fees (including the contabilista's). ⚠️ *Confirm what proportion
actually needs backing in my case.*

This is **not** an itemised-deduction strategy — beyond the 15% justification, tracking expenses
does not move the tax base under this regime.

---

## 3. One-off setup obligations

| # | Step | Who | Where |
|---|---|---|---|
| 1 | Confirm **NIF** + Portal das Finanças access (**Senha de Acesso** or **CMD**) | Jamie | Portal das Finanças |
| 2 | Confirm / obtain **NISS** — often auto-created at início; needed for the yr-1 SS exemption | Jamie / auto | Segurança Social Direta |
| 3 | **Settle the code + coefficient, and the start date** with the contabilista | Contabilista | — |
| 4 | Declare **Início de Atividade** — regime *simplificado*, activity code(s), **normal IVA regime** (not *franquia*) | Jamie / Contabilista | Portal → Entregar → Declaração de Início de Atividade |
| 5 | Register for **VIES** — ⚠️ expect a lag of a few days before the number validates | Jamie / Contabilista | Portal das Finanças |
| 6 | Open a dedicated **bank account** (NIF, ID, proof of address) | Jamie | Bank |
| 7 | Confirm **invoice wording** — EU reverse-charge clause + VIES IDs; UK/US out-of-scope | Contabilista | — |

> ⚠️ **Also to be settled at setup, and not in the original plan:** how income already received in
> 2026, before any *início de atividade* existed, gets regularised. See Q3 of the brief.

---

## 4. Recurring obligations

**Legend:** ✅ confident · ⚠️ needs confirmation

| Obligation | Cadence | Due | Who | |
|---|---|---|---|---|
| **Issue fatura-recibo** (*recibos verdes*) | Per payment | By the **5th working day** after the service / payment | Jamie | ⚠️ |
| **Communicate invoices to AT** | Monthly | By the **5th** of the following month — **automatic** if issued on the Portal | auto / Jamie | ⚠️ |
| **Declaração periódica de IVA** | Quarterly *(turnover ≤ €650k)* | By the **20th of the 2nd month** after the quarter | Contabilista | ⚠️ |
| **IVA payment** | Quarterly | By the **25th** of that same month | Jamie | ⚠️ |
| **Declaração recapitulativa (VIES)** | Quarterly *(services, quarterly filer)* | By the **20th** of the month after the quarter | Contabilista | ⚠️ |
| **SS quarterly declaration** | Quarterly | During **Jan / Apr / Jul / Oct**, for the previous quarter | Jamie | ✅ |
| **SS contribution payment** | Monthly | Between the **10th and 20th** of the following month | Jamie | ✅ |
| **IRS Modelo 3 + Anexo B** | Annual | **1 April – 30 June**, for the previous year | Contabilista | ✅ |
| **IRS settlement payment** | Annual | By **31 August** | Jamie | ✅ |
| **Pagamentos por conta** | 3× yearly | **20 Jul · 20 Sep · 20 Dec** | Jamie | ⚠️ |
| **e-fatura — validate personal invoices** | Annual | By **25 February**, for the previous year | Jamie | ⚠️ |

### Notes on the ⚠️ items
- **IVA periodicity** — quarterly assumed on turnover well under the €650k monthly threshold.
  Confirm I am not placed on monthly, and whether I can elect.
- **IVA and recapitulative deadlines** — I believe these moved to the 20th (declaration) and 25th
  (payment). Confirm the current dates; I do not want to work from a superseded rule.
- **Pagamentos por conta** — I believe these do **not** apply in the year of *início de atividade*,
  and that with 100% foreign clients there is **no retenção na fonte** prepaying anything during the
  year. Confirm **which year they first bite** and the formula.
- **IES / Modelo 22** — I believe **neither applies** to me under the simplified regime (both are
  company / organised-accounting obligations). Confirm.
- **Modelo 30** — may be triggered by payments to non-resident entities. Confirm whether my foreign
  SaaS spend brings me into it.

---

## 5. The annual calendar (steady state)

Assuming **quarterly IVA** and the SS exemption expired. ⚠️ **Confirm before I enter these dates.**

| When | What | For |
|---|---|---|
| **10th–20th, every month** | SS contribution payment | Previous month |
| **5th, every month** | Invoice communication to AT (auto via Portal) | Previous month |
| **1–30 January** | SS quarterly declaration | Oct–Dec |
| **20 January** | Declaração recapitulativa (VIES) | Q4 |
| **20 February** | IVA declaration *(payment by the 25th)* | Q4 (Oct–Dec) |
| **25 February** | e-fatura — validate prior-year invoices for personal deductions | Prior year |
| **1 April – 30 June** | **IRS Modelo 3 + Anexo B** | Prior year |
| **1–30 April** | SS quarterly declaration | Jan–Mar |
| **20 April** | Declaração recapitulativa (VIES) | Q1 |
| **20 May** | IVA declaration *(payment by the 25th)* | Q1 (Jan–Mar) |
| **1–30 July** | SS quarterly declaration | Apr–Jun |
| **20 July** | Declaração recapitulativa (VIES) · **pagamento por conta #1** | Q2 |
| **20 August** | IVA declaration *(payment by the 25th)* | Q2 (Apr–Jun) |
| **31 August** | **IRS settlement payment** | Prior year |
| **20 September** | Pagamento por conta #2 | — |
| **1–30 October** | SS quarterly declaration | Jul–Sep |
| **20 October** | Declaração recapitulativa (VIES) | Q3 |
| **20 November** | IVA declaration *(payment by the 25th)* | Q3 (Jul–Sep) |
| **20 December** | Pagamento por conta #3 | — |

---

## 6. The first two years, dated

Two scenarios, because the start date is still open (Q2 of the brief). **⚠️ Every date below is
derived from my understanding of the rules — please correct the derivation, not just the dates.**

### Scenario A — start **1 September 2026**

| Date | Event |
|---|---|
| **Sep 2026** | Início de atividade filed · VIES goes live a few days later · **SS exempt from day one** |
| **20 Oct 2026** | First declaração recapitulativa (Q3), if any EU B2B invoices were issued in September |
| **20 Nov 2026** | First IVA declaration (Q3 2026) · payment by 25 Nov |
| **1 Apr – 30 Jun 2027** | **First Modelo 3 + Anexo B** — 2026 income, **−50% coefficient year** |
| **31 Aug 2027** | First IRS settlement payment |
| **~1 Sep 2027** | ⚠️ **SS exemption ends** — contributory obligation begins (I read the rule as *the first day of the 12th month after the start of activity*; confirm) |
| **Oct 2027** | ⚠️ First SS quarterly declaration — confirm whether it is October 2027 or earlier to establish the base |
| **10–20 Oct 2027** | First SS contribution payment (~€624/month thereafter) |
| **2027 tax year** | **−25% coefficient year** |
| **2028 tax year** | First full-coefficient year · pagamentos por conta may begin ⚠️ |

### Scenario B — start **1 January 2027**

| Date | Event |
|---|---|
| **Jan 2027** | Início de atividade filed · SS exempt from day one |
| **20 Apr 2027** | First declaração recapitulativa (Q1) |
| **20 May 2027** | First IVA declaration (Q1 2027) · payment by 25 May |
| **2027 tax year** | **−50% coefficient year — applied to a full year of income** |
| **~1 Jan 2028** | ⚠️ SS exemption ends |
| **Jan 2028** | ⚠️ First SS quarterly declaration |
| **1 Apr – 30 Jun 2028** | First Modelo 3 + Anexo B — 2027 income |
| **2028 tax year** | **−25% coefficient year** |
| **2029 tax year** | First full-coefficient year |

**The trade-off in one line:** Scenario B puts the −50% reduction on a full year of income —
worth roughly **€6,000+ of IRS across 2027–28** — but Scenario A is the only one that lets me
invoice legally between now and January. ⚠️ **And Q3 of the brief (income already received in 2026)
may force the answer regardless.**

---

## 7. What changes if the bar deal goes ahead

**Status: uncertain.** The proposal is that I operate a local bar and invoice **75% of its profits**,
with a **3-month trial** first. The owners retain ownership, all licences, staff employment,
supplier contracts, the bar's own IVA-on-sales, IRC, and premises liability.

**Working plan:** invoice the trial from the existing trabalhador independente activity (adding a
management-services activity to the *início de atividade*), and form a **Unipessoal Lda** only if the
deal sticks and is material. Rationale: the risks that would justify a separate company accrue
**annually and over sustained time**, so a 3-month low-volume trial is too short to trip them — and
operating liability is governed by the **contract**, not the tax vehicle.

**Five things change if it happens:**

1. **23% IVA becomes real.** The bar is a *domestic* B2B client, so my invoices to it carry Portuguese
   IVA that I charge and remit. This is the point where "near-zero IVA" stops being true. ⚠️ Flag to
   the contabilista **before the first IVA filing**.
2. **Retenção na fonte may start.** A domestic client with organised accounting would withhold IRS at
   source (I believe 25%), unlike my foreign clients. ⚠️ Confirm, and whether a *dispensa* applies.
3. **The >80% single-client rule comes into play.** If the bar becomes a large share of annual
   invoicing, an **additional SS contribution owed by the bar** and **economic-dependence** /
   disguised-employment classification become live risks. ⚠️ Confirm the thresholds.
4. **A second coefficient question opens.** Management services may not carry the same coefficient as
   my consulting work, and interact differently with the startup reduction. ⚠️
5. **A written services agreement is required from day one** — stating that I operate as an
   independent contractor, the 75% formula, and that owners retain ownership, licences, staff and
   supplier contracts. This, not the tax vehicle, is what keeps their liability with them.

**Post-trial:** deal dies → remove the management-services activity. Deal sticks and is material →
form the **Unipessoal Lda** and migrate the bar contract into it, ring-fencing IVA, single-client
dependence and operating liability away from the clean consulting activity. Deal sticks but modest →
staying on recibos verdes stays defensible.

---

## 8. 2026 reference rates

| Item | Value |
|---|---|
| Coefficient — listed / other services | 0.75 / 0.35 |
| Startup coefficient reduction | −50% yr 1, −25% yr 2 (no Cat. A/H income) |
| Self-employed SS rate | 21.4% on 70% of service invoicing |
| ENI SS rate *(contrast)* | 25.2% |
| SS first-time exemption | 12 months, automatic |
| SS maximum monthly base | €6,445.56 (12 × IAS) |
| SS minimum monthly contribution | €20 |
| 15% expense-justification rule | Applies to both coefficients; mandatory SS counts toward it |
| Organised-accounting threshold | Mandatory above €200k gross |
| Domestic B2B IVA rate | 23% |
| IRC general / PME first €50k *(company contrast)* | 19% / 15% |
| Dividend tax, resident individual *(company contrast)* | 28% |
| Municipal derrama, Mafra *(company only)* | up to 1.5% |

---

## 9. What I most need corrected

1. **§2.1 — the coefficient.** 0.75 or 0.35, or split by substance? Everything else is secondary.
2. **§6 — the start date**, and whether income already received in 2026 forces the answer.
3. **§4 — every ⚠️ deadline.** I would rather be told my dates are stale than key them into a calendar.
4. **§4 — anything missing entirely.** I have almost certainly not found every obligation.
5. **§7 — the bar**, if it proceeds.
6. **Division of labour** — which of these you file, and which stay mine.

---

## Sources

The research behind this document was compiled 15 June – 1 July 2026 from: IRS 2026 brackets
(OE 2026 / Lei 73-A/2025); OCC guidance on the simplified regime and on the coefficient being
determined by the nature of the income rather than the CAE; Art. 31.º n.º 10 CIRS on the startup
coefficient reduction; Segurança Social guidance on the 21.4%/70% mechanics, the first-12-month
exemption, the 2026 IAS caps and the ±25% adjustment; and AT/RITI guidance on intra-EU B2B reverse
charge and VIES. Full source list retained in this repository's git history at
`workspaces/legal-and-tax/references/portugal-business-structure-analysis.md`.

> *Decision-support only. Not formal tax or legal advice. Activity-code classification, start date,
> and every deadline above are to be confirmed by a contabilista certificado before filing or before
> being relied upon.*
