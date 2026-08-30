# Stub: The touch log and the next-action spine

- feature-slug: touch-log-next-action
- sequence: 2 of 8
- depends-on: prospect-rungs-and-facts
- priority: P1
- size: L

## What this is

The system's memory and its engine. `biz.touches` returns — leaner than the version
`0013` dropped — and every open lead or prospect carries *what happens next, when*.

Model (`packages/services`):

- `biz.touches`: `id`, `client_id` (cascade), `channel` (email / phone / walkin /
  whatsapp / instagram / other), `direction` (out / in), `outcome` (session's call on
  the vocabulary — cover at least: sent, answered, no_answer, callback, replied, met,
  not_interested), `note text`, `draft_md text` (the draft that was used, if any),
  `model varchar(60)` (nullable — which model drafted it; a courtesy field, not spend
  tracking), `logged_at timestamptz`. Logging a touch stamps the client's
  `last_touched_at`, same as every mutation does today.
- On `biz.clients`: `next_action varchar(200)`, `next_action_due timestamptz`,
  `wake_at timestamptz` (nurture only). **Gentle invariant** (Jamie's decision 7):
  nothing refuses to save without a next action — instead, crack-finder queries in
  the services layer surface the gaps: due-today/overdue outreach (ordered overdue
  first, then tier), open-or-prospect rows with no next action, nurture rows whose
  `wake_at` has passed, and engaged/proposal-stage rows idle past N days. Sequence 6
  renders them; sequence 4's scripts read the same queries.
- A **cadence template as plain data** (a const in the services layer, not a table):
  ~5 steps over ~3 weeks, per the breakdown — first touch on the lead's best channel
  (whatsapp if a number exists, else email to a role address, else instagram), a
  day-3 second-channel bump, day-7 follow-up, a day-12 walk-in step for A-tier
  nearby leads, a day-18–21 breakup touch; exhausted ⇒ suggest `nurture` with
  `wake_at` +90 days. Exact spacing is the session's call; it's a suggestion engine,
  not a scheduler — completing a touch computes the next step and prefills it.

Surfaces (`websites/admin-dashboard`):

- The lead profile's Work tab gains the touch history (newest first, channel glyph +
  outcome + note, folded draft text) and a **one-tap log**: channel + outcome in two
  taps, note optional — the 10-second rule; if logging is slower than the call was
  short, it won't happen.
- After logging, the suggested next step appears prefilled (action text + due date +
  channel) — accept, edit, or dismiss. Dismissing is allowed; the crack-finder will
  say so later.
- The next action renders on the profile masthead area and on the lead row (replacing
  the bare "waited N days" as the primary line for prospects).

## Prompt

Read `.icm/intake/lead-engine/breakdown.md` and
`.icm/intake/lead-engine/touch-log-next-action.md` in the jamienisbet repo. Bring
back `biz.touches` (lean: channel, direction, outcome, note, draft_md, model,
logged_at), add `next_action`/`next_action_due`/`wake_at` to `biz.clients`, write the
crack-finder queries and the cadence-suggestion helper in `packages/services`, and
give the lead profile a touch history and a two-tap logging flow with the next step
prefilled after each log. Gentle: never block a save for a missing next action.

Follow the `design-dna` skill for any UI copy. CI is the source of truth — don't run
builds or migrations locally. Work on a `claude/` branch, push, open a PR, and
`git mv` this stub to `.icm/intake/lead-engine/_done/` in that PR.
