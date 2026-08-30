# Stub: Five statuses that say what they mean

- feature-slug: status-ladder-past-clients
- sequence: 1 of 5
- depends-on: none
- priority: P1
- size: M

## What this is

The ladder `new / talking / client / lost` becomes **Lead · In discussion · Active
client · Past client · Not won** — a rename for descriptiveness plus the one rung the
business actually lacked: a client whose engagement has ended but whose record, repo
and history should stay warm.

Model (`packages/services/src/queries/clients.ts` + `schema/index.ts`):

- `clientStatuses` → `["lead", "discussing", "active", "past", "not_won"]` (labels
  above; exact stored strings are the session's call, but they should read as words,
  not legacy codes). Schema default `"new"` → the new first rung; drizzle migration
  updates existing rows (`new`→lead, `talking`→discussing, `client`→active,
  `lost`→not_won). Nothing is on `past` yet — it only ever gets there by hand.
- `openStatuses` = lead + discussing (unchanged in meaning). `customerStatuses` =
  active + past — but **staleness and the monthly total look only at active**: a past
  client is never "waiting", and their retainer is over. Check every consumer of
  these two sets plus raw status strings (`lib/leads.ts`, leads page `totals()`,
  the Needs you feed's stale-lead rows, `client-status-select`, `lead-status-row`,
  `client-create-form`, `actions.ts`) — grep for the old strings estate-wide.

Surfaces:

- Status pickers (`lead-status-row.tsx`, `client-status-select.tsx`) carry the five
  new labels with hints in the existing voice — e.g. Lead "Came in, not spoken to
  yet" · In discussion "Conversation or negotiation running" · Active client "Work
  agreed or under way" · Past client "Engagement over, relationship kept" · Not won
  "Didn't happen".
- Leads list filters stay **four segments**: All · Open · Clients · Not won.
  Clients = active + past; a past client's row is visually muted (label and/or
  dimmed) so the distinction reads without a fifth segment. The partition/count
  arithmetic in `leads/page.tsx` still has to add up.
- The profile masthead's status word follows automatically; make sure nothing
  capitalises raw stored values into the UI (`capitalize` on `row.status` in the
  list row) — labels come from one lookup, not string-mangling.

The convert flow's `status === "client"` checks are touched here only enough to keep
compiling (`"active"`); the flow itself dies in `profile-person-work-tabs`.

## Prompt

Read `.icm/intake/client-deal-ux/breakdown.md` and
`.icm/intake/client-deal-ux/status-ladder-past-clients.md` in the jamienisbet repo.
Rename the client status ladder to Lead · In discussion · Active client · Past
client · Not won: constants and helpers in `packages/services`, a drizzle data
migration for existing rows, and every dashboard surface that names or filters a
status. Past clients stay listed under the Clients filter (muted), never count as
stale, and stay out of the monthly total.

Follow the `design-dna` skill for any UI copy. CI is the source of truth — don't run
builds locally. Work on a `claude/` branch, push, open a PR, and `git mv` this stub
to `.icm/intake/client-deal-ux/_done/` in that PR.
