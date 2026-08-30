# Stub: Needs you becomes the daily cockpit

- feature-slug: outreach-queue-home
- sequence: 6 of 8
- depends-on: touch-log-next-action
- priority: P1
- size: M

## What this is

Jamie's decision 5: the daily outreach queue lives on the home screen, not on a new
nav destination. The Needs you feed already answers "what needs me today" for stale
leads, todos and compliance — outreach due joins it, and the feed becomes the one
surface a 30-minute morning block works from.

- **Outreach due** — a section fed by the sequence-2 crack-finder queries: rows due
  or overdue today, **capped at ~10** (the estate's daily ritual number; overflow
  rolls forward rather than scrolling), ordered overdue-first then fit tier. Each row:
  name · next action · channel glyph · the due state — tapping opens the lead profile
  with the draft panel ready (sequence 5). An empty section reads as done for the
  day; that emptiness is the motivation loop, give it the voice it deserves.
- **Wakes** — nurture rows whose `wake_at` has passed: one row each, offering
  re-promote to `prospect` with a fresh next action, or push the wake out again.
- **Crack-finder rows** — quiet counts, not a section per problem: "N prospects with
  no next action" · "N leads idle in discussion 14+ days". Tap-through lands on the
  relevant filtered list. Gentle (decision 7): these inform, they never nag with
  badges or block anything.
- The existing stale-lead rows keep their meaning (open leads only — prospects never
  appear there; their absence from staleness is sequence 1's contract).
- Feed ordering among sections (overdue todos vs outreach vs wakes) is the session's
  call; the feed must still read in one screenful on the phone — this is the PWA
  Jamie lives in.

## Prompt

Read `.icm/intake/lead-engine/breakdown.md` and
`.icm/intake/lead-engine/outreach-queue-home.md` in the jamienisbet repo. Add the
outreach-due queue (capped ~10, overdue-first then tier), nurture wakes, and the
quiet crack-finder count rows to the Needs you feed in the admin dashboard, using the
crack-finder queries from `packages/services`. Prospects stay out of the stale-lead
rows. Keep the feed one screenful on the phone.

Follow the `design-dna` skill for any UI copy. CI is the source of truth — don't run
builds locally. Work on a `claude/` branch, push, open a PR, and `git mv` this stub
to `.icm/intake/lead-engine/_done/` in that PR.
