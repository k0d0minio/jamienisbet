# Client & deal UX — breakdown

- epic: client-deal-ux
- cut: 2026-08-29, interrogation of Jamie (three rounds)
- scope: `websites/admin-dashboard` + `packages/services` (the `biz.clients` model)

## What was understood

The client/deal machinery works but the *vocabulary and shape* don't match how the
business actually runs:

- **The ladder is vague.** `new / talking / client / lost` — "talking" and "lost" say
  little, and one undifferentiated `client` rung means an active engagement and a
  finished one read identically. There is no notion of a past client at all.
- **Deals assume money.** An equity- or commission-based engagement still demands a euro
  figure: `conversionGaps()` flags `valueMinor <= 0` as a gap and the convert flow's
  deal step only counts as done when a value is set. The model treats cash as the deal
  and everything else as decoration.
- **The profile is noisy.** Nine grouped sections down the page; data-rich but not
  navigable. GitHub and Stripe each take full rows (plus a setup sheet) for facts that
  are set once and then only ever glanced at. "How they came in" holds a whole section
  for provenance read exactly once.
- **Convert is ceremony.** A four-step walkthrough plus persistent warning badges, when
  the only thing that actually makes someone a client is the status.
- **Deal / notes / todos all edit through sheets** — read-only rows with every change a
  sheet away.
- **Form sharing is create-then-hunt.** Send a form, then open a fold to find the URL
  to copy.

## Decisions (all Jamie's, 2026-08-29)

1. **Ladder** — minimal rename plus a past rung: **Lead · In discussion · Active
   client · Past client · Not won**. Five statuses; `lost` becomes "Not won",
   `client` splits into active/past.
2. **Past client** — a manual move, made when the engagement ends. Past clients stay
   on the list (inside the Clients filter, visually muted), keep repo/Stripe/history,
   and drop out of staleness nagging and the monthly total. Archive stays a separate,
   rarer act.
3. **Deal = composable terms.** A deal is any combination of components — cash value
   (one-off or monthly), equity %, commission %, barter — and is "set" when at least
   one exists. Money is one possible component, never required.
4. **Money stays cash-only.** The masthead totals count only invoiceable cash; barter
   keeps its separate "in kind" figure. A lead whose deal is equity-only shows the
   **percentage** as its headline figure instead of €0.
5. **Profile becomes two tabs** — *Person / Everything else*: the record (status,
   contact, deal) and the working surface (notes, todos, forms). GitHub and Stripe
   shrink to **status icons in the identity header** — active or inactive, tap to
   link/open — the Delivery & billing section dies.
6. **Convert flow dies.** Changing status to Active client *is* conversion. The
   walkthrough sheet, gap badges and "Finish conversion" row all go; the header's
   inactive GitHub/Stripe icons are the only quiet reminder that plumbing is missing.
7. **Edit in place.** Notes edit inline, todos get an always-present quick-add, deal
   components edit per row. Sheets survive only where a phone keyboard genuinely
   needs the screen.
8. **Intake demoted** — a single folded row at the foot of the Person tab; no section.
9. **Form sharing, all four ways**: picking a form creates the link *and* opens
   share in the same gesture; a share action on every row (native share sheet, copy
   fallback); a prefilled email draft to the lead's address; a QR code for in-person.
10. **List filters stay four**: All · Open · Clients · Not won. Clients covers active
    and past, with past muted in the rows rather than given a fifth segment.

## Build order

1. `status-ladder-past-clients` — the five-status vocabulary in `packages/services`
   and every surface that names a rung; data migration for existing rows.
2. `composable-deal-terms` — the deal-component model: nothing mandatory, "set" means
   any component present; totals and headline figures follow (equity % as the figure
   on an equity-only deal).
3. `profile-person-work-tabs` — the profile restructured: two tabs, header
   GitHub/Stripe status icons, convert flow removed, intake demoted.
4. `edit-in-place` — deal, notes and todos become directly editable on the page.
5. `form-sharing` — send-and-share in one gesture, share/email/QR from every row.

1 and 2 are model work and independent of each other; 3 needs both (it removes the
gap badges that 2 obsoletes and renders the vocabulary 1 defines); 4 and 5 refine the
surfaces 3 lays out. The app is coherent after 3; 4 and 5 are the finish.
