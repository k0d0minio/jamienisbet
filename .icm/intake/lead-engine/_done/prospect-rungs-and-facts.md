# Stub: A ladder and a lead row that can hold the cold pool

- feature-slug: prospect-rungs-and-facts
- sequence: 1 of 8
- depends-on: none
- priority: P1
- size: L

## What this is

`biz.clients` learns to hold an imported prospect without lying about it, and the
ladder gains the two rungs cold outreach needs.

Model (`packages/services/src/queries/clients.ts` + `src/schema/index.ts`):

- `clientStatuses` grows `prospect` (imported, cadence running, has not engaged) and
  `nurture` (cadence exhausted or "not now"; parked with a wake date). Exact stored
  strings are the session's call, but the migration is **additive only** — no renames,
  no data `UPDATE`, default stays `lead` (inbound). Cold rows enter as `prospect`
  explicitly; engagement (a reply, an answered call) moves prospect straight to
  `discussing` — `lead` remains the inbound rung, per the breakdown.
- Sets: `openStatuses` unchanged (`lead`, `discussing`) — prospects are never "open",
  never stale, and never in `totals()`; they are driven purely by next-action due
  dates (sequence 2). `nurture` is in nothing except its own wake query. Audit every
  consumer: `lib/leads.ts`, `leads/page.tsx` `FILTERS`/`totals()`, the Needs you
  feed's stale rows, `actions.ts` — and the three client-side status copies
  (`components/lead-status-row.tsx:25`, `client-status-select.tsx`,
  `client-create-form.tsx:58`). A status change touches four files by design; name
  all four in the PR.
- New columns (nullable unless said): `sector varchar`, `town varchar`,
  `language varchar(8)` (en / pt / en-pt), `hook text` (the per-lead pain-point pitch
  angle — the most valuable field in the pool), `fit_tier varchar(1)` (A/B/C, null =
  untiered), `website_url varchar(300)`, `website_grade varchar(20)` (none /
  social-only / dated / decent — session's call on the vocabulary),
  `review_count integer`, `whatsapp varchar(40)` (E.164; wa.me falls back to `phone`),
  `instagram varchar(100)`, `source_detail varchar(200)` (provenance, e.g.
  "2026-07-23 Mafra/Lisbon prospect list"). `clientSources` gains `import`.
- `next_action varchar(200)`, `next_action_due timestamptz`, `wake_at timestamptz`
  belong to sequence 2 — do not add them here.
- Indexes finally: `status`, and the list sort `coalesce(last_touched_at, created_at)`
  can at least get `last_touched_at` covered. Migration precedent: `0016`/`0017`
  comment style (Neon branch first).

Surfaces:

- The leads list keeps its four segments meaning what they mean today; prospects get
  their own way in (a fifth Prospects segment, tier-sorted, with `nurture` shown muted
  inside it — or a separate filter; session's call) so All/Open stay readable as
  *engaged relationships*. The partition arithmetic must still add up.
- Status pickers carry the new rungs with hints in the house voice — e.g. Prospect
  "Imported, working the cadence, hasn't engaged" · Nurture "Parked; wakes on a date".
- The lead profile's Person tab shows the new facts (sector · town · language ·
  tier · hook) as a compact block; hook is text, not a badge.
- `ClientProfilePatch` grows the editable facts; provenance (`source_detail`) stays
  read-only like `source`.

## Prompt

Read `.icm/intake/lead-engine/breakdown.md` and
`.icm/intake/lead-engine/prospect-rungs-and-facts.md` in the jamienisbet repo. Grow
the client status ladder with `prospect` and `nurture` rungs (additive migration
only) and add the cold-pool profile columns to `biz.clients` (sector, town, language,
hook, fit tier, website facts, whatsapp/instagram, source_detail; sources gain
`import`). Keep prospects out of openStatuses, staleness and money totals; re-audit
every status consumer including the three client-side status copies. Give the leads
list a prospects view and the profile a facts block.

Follow the `design-dna` skill for any UI copy. CI is the source of truth — don't run
builds or migrations locally; push and read the checks. Work on a `claude/` branch,
push, open a PR, and `git mv` this stub to `.icm/intake/lead-engine/_done/` in that
PR.
