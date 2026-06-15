<!-- TEMPLATE — invoice chaser. Draft only; send after review via scripts/send-email.sh --confirm.
     Triggered from workspaces/finance + tracker when an invoice is overdue. Fill {{tokens}}. -->
Subject: Invoice {{invoice.number}} — {{chase.subject}}

Hi {{client.contact_name}},

A friendly nudge that invoice {{invoice.number}} (€{{invoice.total}}) was due on {{invoice.due}}.

If it's already on its way, please ignore this — and thank you. If anything's holding it up, let me
know and I'll help sort it.

IBAN and reference are on the invoice (attached again here).

Thanks,
Jamie
{{business.email}}
