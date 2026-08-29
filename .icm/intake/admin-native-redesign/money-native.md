# Stub: Money in the native idiom

- feature-slug: money-native
- sequence: 6 of 8
- depends-on: lead-profile-contacts-card
- priority: P2
- size: M

## What this is

The Stripe cockpit converted to the proven vocabulary. All money behaviour — draft-first
invoicing, finalize-and-send as a separate deliberate click, link minting — is untouched;
this is presentation and glanceability.

- **Header** — "Money" as the large title; balance (available, pending, outstanding) as
  the glance row of mono figures directly under it — the screen's answer before any
  scrolling.
- **Sections** — Invoices, Payment links, Recent payments as inset grouped lists. An
  invoice row reads at a glance: counterparty, mono amount, status carried by the muted
  semantic tint (draft grey, open slate, overdue red, paid green) — the badge component
  restyled, not re-invented.
- **Create flows** — raise-an-invoice and mint-a-link move into detented sheets from
  row-level or section-header add buttons; the lead picker keeps its from-the-database
  rule. Finalize-and-send keeps a deliberate confirm step.
- **Desktop** — the card-list/table split is retired; the same grouped lists scale up in
  the sidebar layout.
- Not-configured (no `STRIPE_SECRET_KEY`), loading skeletons, empty sections, and error
  states in the new idiom; both colour modes.

## Prompt

Read `.icm/intake/admin-native-redesign/breakdown.md` and then
`.icm/intake/admin-native-redesign/money-native.md` (this stub) in the `jamienisbet`
repo. Sequences 1–3 must be merged (5 need not be); build from the app tier and proven
patterns, extending `packages/ui` where a primitive is missing.

Rework `websites/admin-dashboard/app/(app)/money/` and its components
(`invoice-create-form`, `invoice-actions`, `invoice-status-badge`,
`payment-link-create-form`, `payment-link-actions`) as specified: large title with the
balance glance row, inset grouped lists for the three sections, status carried by muted
semantic tints, create flows in detented sheets, desktop scaled up without tables. Change
no server action, no Stripe call, and no rule — drafts stay drafts, sending stays a
separate click, amounts never come from the browser.

Follow the amended `design-dna` skill. Work on a `claude/` branch, push, verify on the
Vercel preview with Stripe configured and unconfigured, both colour modes, phone and
desk. When done, `git mv` this stub to `.icm/intake/admin-native-redesign/_done/`.
