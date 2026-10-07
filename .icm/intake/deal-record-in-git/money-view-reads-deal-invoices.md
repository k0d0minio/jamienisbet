# Stub: The money view reads the records' invoices[] — Stripe pending

- feature-slug: money-view-reads-deal-invoices
- scope: deal-record-in-git
- sequence: 3 of 4
- depends-on: deal-record-read-write-git
- priority: P2
- complexity: medium
- found-by: icm-board restructure · 2026-10-07 (D53)
- sources: icm-board `_system/contracts/CLIENTS.md` § Money · `workspaces/deals/README.md` (`invoices: [{number, issued, due, paid, amount, currency, reference}]`) · `websites/admin-dashboard/lib/finance.ts` · `lib/clients-stripe.ts` · `lib/invoice-state.ts` · `components/invoice-status-badge.tsx`
- touches: `websites/admin-dashboard/lib/finance.ts` · `lib/invoice-state.ts` · the money page under `app/(app)/` · `components/invoice-status-badge.tsx`

## Problem

Invoices are raised by hand in Revolut Pro and recorded as `invoices[]` entries in each deal
record (D53); Stripe is pending and `stripe_customer_id` is a join key for a day that may not
come. The dashboard's money view and the invoice badges read Stripe, so they show nothing for
a business whose money facts are now in git.

## Proposed change

- The money view sums the records: *in play* from `value` on `discussing` rows, */ month* from
  `billing_type: monthly` and `support` on `active` rows, *in kind* from `deal_type: barter|equity`;
  *invoiced* / *paid* / *overdue* from `invoices[]` (`due` past and `paid` empty = overdue).
- The invoice badge on a profile reads the record's list; an entry is added or marked paid
  through the stub-1 write path (one commit), never through Stripe.
- The Stripe code paths stay, behind "Stripe: pending" — nothing reads them as a money fact
  until D53 re-opens; the `invoices[]` list is the migration source then.

## Acceptance criteria (rough)

- [ ] berceo's €3,750 deposit entry shows as paid; casey-hebbel's €800 shows in play; nothing is counted twice
- [ ] No Stripe call on the money page while Stripe is pending
- [ ] CI green
