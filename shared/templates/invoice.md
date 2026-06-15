<!-- TEMPLATE — fill {{tokens}}. Bill-from facts: _config/business/ (NIF/IBAN pending entity setup).
     IVA: workspaces/legal-and-tax/references/iva-vat-notes.md. Tokens: see README.md. -->
# Invoice {{invoice.number}}

**From:** {{business.name}} · {{business.email}} · Mafra, Portugal
NIF: {{business.nif}}  <!-- pending entity setup; do not print until established -->

**To:** {{client.legal_name}}
{{client.address}}{{client.vat_id_line}}

**Invoice date:** {{date}} · **Due:** {{invoice.due}} (net {{terms.net_days}})

---

| Description | Qty | Unit (€) | Amount (€) |
|---|---|---|---|
| {{line.1.desc}} | {{line.1.qty}} | {{line.1.unit}} | {{line.1.amount}} |
| {{line.2.desc}} | {{line.2.qty}} | {{line.2.unit}} | {{line.2.amount}} |

**Subtotal:** €{{invoice.subtotal}}
**IVA:** {{iva.note}}
**Total due: €{{invoice.total}}**

## Payment
- **IBAN:** {{business.iban}}  <!-- pending entity setup -->
- **Reference:** {{invoice.number}}
- Terms: net {{terms.net_days}} days.

> {{iva.legal_note}}
> <!-- EU B2B: "Reverse charge — IVA autoliquidação (Art. 196, Directive 2006/112/EC)."
>      UK/US/non-EU: "Services outside the scope of Portuguese VAT." -->
> Status tracked in workspaces/finance/ and shared/clients/{{client.slug}}/finances.md
> (`draft` → `sent` → `paid` | `overdue`). Tax treatment confirmed with a contabilista.
<!-- provenance: from proposals/07_invoice; IVA per legal-and-tax/references/iva-vat-notes.md -->
