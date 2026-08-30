# Stub: Opt-outs that survive everything

- feature-slug: suppression-and-provenance
- sequence: 3 of 8
- depends-on: none
- priority: P1
- size: S

## What this is

The legal floor under the whole engine, built before the pool is imported.

- **`biz.suppressions`**: `id`, `kind` (email / phone / instagram), `value` (stored
  normalized — lowercased email, E.164 phone), `reason varchar(200)`,
  `created_at`. Unique on (`kind`, `value`). A suppression outlives the lead row: a
  deleted or purged client never resurrects a suppressed contact, and re-imports skip
  it (sequence 4 enforces this at the door).
- **Honored everywhere a handoff happens**: the draft/handoff surfaces (sequence 5)
  and the queue (sequence 6) check suppression and show a dead-end state instead of a
  send gesture. A "suppress this contact" action on the lead profile records the
  opt-out and moves the lead to `not_won` in one gesture.
- **Provenance is spoken.** The first-touch email drafts include a one-line "where I
  found you" (Art 14) and a reply-to-remove line honored by the suppress action.
- **Retention**: a purge script (lives with sequence 4's scripts) anonymizes
  `prospect`/`not_won` rows untouched for 12+ months — contact details cleared, the
  suppression entry kept.
- **The LIA**: a one-page legitimate-interest assessment at
  `.icm/docs/lia-cold-outreach.md` — B2B relevance, balancing test, the
  legal-person/natural-person channel split (role addresses opt-out per Lei 41/2004;
  sole traders get phone/walk-in first), opt-out handling, retention rule.

Gate (Jamie's, before the first email batch ever goes out — read, never tick):

- [ ] Jamie: check the batch's role addresses against the DGC national opt-out list
      (Direção-Geral do Consumidor) before the first send.

## Prompt

Read `.icm/intake/lead-engine/breakdown.md` and
`.icm/intake/lead-engine/suppression-and-provenance.md` in the jamienisbet repo. Add
the `biz.suppressions` table and its queries to `packages/services`, a
suppress-this-contact action on the lead profile (records the opt-out, moves the lead
to not_won), and write `.icm/docs/lia-cold-outreach.md`. Leave the checkbox gate in
this stub unticked.

CI is the source of truth — don't run builds or migrations locally. Work on a
`claude/` branch, push, open a PR, and `git mv` this stub to
`.icm/intake/lead-engine/_done/` in that PR.
