<!-- TEMPLATE — fill {{tokens}}. Pricing: workspaces/proposals/references/pricing-models.md + setup/output/config.md.
     IVA: workspaces/legal-and-tax/references/iva-vat-notes.md. Tokens: see README.md. -->
# Quote — {{deal.title}}

**{{business.name}}** · {{business.email}} · Mafra, Portugal
**Quote #:** {{quote.number}} · **Date:** {{date}} · **Valid until:** {{valid_until}}
**To:** {{client.legal_name}} ({{client.country}}){{client.vat_id_line}}

---

## Options

### Good — €{{tier.good.price}}
{{tier.good.items}}

### Better (recommended) — €{{tier.better.price}}
{{tier.better.items}}

### Best — €{{tier.best.price}}
{{tier.best.items}}

---

**Total (selected option): €{{price.total}}**

- **Deposit:** {{terms.deposit}} up front; balance on {{terms.balance_trigger}}.
- **Payment terms:** net {{terms.net_days}} days.
- **VAT / IVA:** {{iva.note}}
  <!-- EU B2B: "Reverse charge — IVA autoliquidação (Art. 196, Directive 2006/112/EC). VAT no.: {{client.vat_id}}."
       UK/US/non-EU: "Outside the scope of Portuguese VAT." -->

> Prices in EUR, valid until {{valid_until}}. Tax treatment is decision-support — confirmed with a
> Portuguese contabilista. NIF / payment details supplied on the invoice.
<!-- provenance: tiers from proposals/05_quote per pricing-models.md; IVA per legal-and-tax/references/iva-vat-notes.md -->
