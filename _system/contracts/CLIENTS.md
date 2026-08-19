# The client lifecycle — `biz.clients.status`

*The contract for the one column that says where a relationship stands. Business state
lives in Neon and is operated through the admin dashboard — never mirrored into git, and
never into a repo's [`.icm/project.md`](PROJECT.md). Companions:
[TICKETS.md](TICKETS.md) (the work) · [PROJECT.md](PROJECT.md) (what a project is for).*

Everyone the business has ever spoken to is **one row** in `biz.clients` — a portfolio
contact enquiry, a sellers-site referral, or someone typed in by hand. There is no second
table for "opportunities" and no separate customer record: a lead who turns into repeat
work is still the same relationship, and the money itself lives in Stripe.

`status` is the only column that says where that relationship stands. It has **three
rungs and a drop-out**:

```
new  ──►  talking  ──►  client
 │           │            │
 └───────────┴────────────┴──►  lost
```

## The rungs, and what each one is a cue to do

| Rung | Means | What you do about it |
|---|---|---|
| `new` | They arrived. Nobody has replied yet. | **Reply.** A lead arriving mints a "Reply to *name*" todo due +2 days, linked to the row ([JN-023](../../.icm/intake/JN-023-auto-task-on-lead-arrival.md)). Replying moves them to `talking`. |
| `talking` | In conversation — scoping, quoting, waiting on their answer. Merges what used to be `contacted`, `qualified` and `proposed`. | **Send the scoping form.** The house questionnaires in `.icm/onboarding/` ([JN-021](../../.icm/intake/JN-021-house-onboarding-forms.md)) go out from the profile's Forms card; answers come back into the row. Then quote. |
| `client` | The deal is agreed. They are working with me. Merges what used to be `won` and `delivered`. | **Walk ConvertFlow until the conversion gaps clear** — delivery repo, deal terms, Stripe customer. The profile wears a warning badge per gap until each one exists. |
| `lost` | Terminal. It ended without a deal. | **Archive them** (`archived_at`), which takes them off the list and keeps the record. Nothing is deleted; a lost lead who comes back is restored and moved back up the ladder. |

Only `new` and `talking` are **open** — the two rungs the leads list counts as still being
worked, and the only two that can go stale (7 days without a touch turns the row red). A
client is not waiting on a reply, and neither is a lost lead.

## Why it is this short

The ladder used to have seven rungs (`new → contacted → qualified → proposed → won →
delivered`, plus `lost`). For a one-man business the middle three were one state in
practice — "we're talking" — and the last two duplicated signals that already exist
orthogonally. Rungs you never act on differently are not states; they are a form you fill
in for a CRM nobody reads. Decided 2026-08-18, migrated in
`packages/services/drizzle/0016_simplify_status_ladder.sql`.

**A rung has no side effects.** Moving someone up the ladder changes `status` and stamps
`last_touched_at`, and nothing else. Everything a rung might have implied is its own flag,
because each answers a question the ladder can't:

| Flag | Answers | Set by |
|---|---|---|
| `work_started_at` | Has the doing begun? Not the same question as "is the deal agreed" — work often starts on a handshake, and a barter or equity-only deal has no first invoice to mark the moment. | **Work started** on the profile (`setClientWorkStarted`) |
| `stripe_customer_id` | Has money moved, or can it? Stripe stays the source of truth for anything invoiced or paid; this column is only the join key. | The billing flow, or **Link Stripe customer** (`setClientStripeCustomerId`) |
| `archived_at` | Should they still be on the list? A soft, reversible hide — the archive view lists them, and nothing is lost. | **Archive** (`setClientArchived`) |
| `github_repo` | Where does their work live? Null means invisible on the tickets board. | **Connect / create repo** (`setClientRepo`) |
| `value_minor` + `billing_type` + `deal_type` | What is this worth, and is it money? Feeds the header totals: *in play* (open rows), */ month* (clients on a retainer), *in kind* (barter, never counted as income). | The deal card, or ConvertFlow |

Reading `status` for any of these is the mistake this contract exists to prevent. "Has it
started" is `work_started_at`, not `client`. "Have they paid" is Stripe, not a rung.

## Where it lives

| Concern | File |
|---|---|
| The ordered set, `openStatuses`, `customerStatuses`, `isClientStatus` | `packages/services/src/queries/clients.ts` |
| The column (`varchar(20)`, defaults `'new'`, no CHECK constraint) | `packages/services/src/schema/index.ts` |
| Moving a lead | `setClientStatus`, re-validated in the dashboard's `updateClientStatus` action |
| Filter chips + header totals | `websites/admin-dashboard/app/(app)/page.tsx` |
| ConvertFlow + `conversionGaps()` | `websites/admin-dashboard/components/convert-flow.tsx` · `app/(app)/leads/[id]/page.tsx` |
| The dropdown's option list | `websites/admin-dashboard/components/client-status-select.tsx` (mirrors the set; the server action is the authority) |

## Rules

- **Every intake starts at `new`.** The public forms never set a status — the column
  default does. Only a record added by hand may start higher, and only because you already
  know where they are (the Add sheet's Lead / Customer choice posts `new` or `client`).
- **The set is closed.** Adding a rung means a migration, both exported sets, the dropdown
  and this page — which is the point: a new rung must be worth all four, or it is a note
  on the profile instead.
- **`lost` is not delete.** Archive it; the record stays queryable.
- **No status is a money fact.** What was invoiced and what was paid is Stripe's answer,
  always.
