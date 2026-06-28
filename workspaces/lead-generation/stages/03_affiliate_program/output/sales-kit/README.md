# Sales Kit

> **ICM role:** Layer 4 — working. The seller-facing toolkit: everything a non-technical friend needs
> to pitch with confidence. This is the **source of truth**; the public sellers-site mirrors it.

| File | What it's for | Surfaced on the site as |
|---|---|---|
| [`pitch.md`](pitch.md) | The customer-facing pitch narrative | the `/pitch` page |
| [`price-sheet.md`](price-sheet.md) | Packages and starting prices | the seller kit's "packages" block |
| [`objection-handling.md`](objection-handling.md) | Pushbacks and honest answers | the seller kit's "objections" block |
| [`follow-up-sequence.md`](follow-up-sequence.md) | The nudges that close a referral | the seller kit's "follow-up" messages |

The copy-paste opener messages and the "what makes a good lead" checklist also live on the site
(`websites/sellers-site/lib/site.ts`). Brand assets (logo, colours) come from `_config/brand/`.

**Edit-source:** if a line reads wrong on the site, fix it here first, then mirror it into
`websites/sellers-site/lib/site.ts` so the next change inherits it.
