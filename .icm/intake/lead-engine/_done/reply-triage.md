# Stub: A reply becomes a next step in one tap

- feature-slug: reply-triage
- sequence: 8 of 8
- depends-on: touch-log-next-action, ai-gateway-drafts
- priority: P2
- size: S

## What this is

Replies arrive in Jamie's mailbox, WhatsApp and Instagram — outside the app, by
design (decision 2). This closes the loop without inbound plumbing: paste what they
said, get the bookkeeping done.

- On the lead profile: a "log a reply" flow — paste the reply text (or a one-line
  summary of a call), the gateway model proposes: an `outcome`, a stage move
  (`prospect` → `discussing` on genuine engagement; `not_won` + suppression offer on
  a clear no), a `next_action` with due date, and — when the reply warrants an
  answer — a response draft grounded on the thread so far, handed off through the
  sequence-5 gestures.
- Everything is **one-tap accept, per element** — stage move, next action and draft
  are separately acceptable/editable; nothing applies until tapped. The pasted text
  lands as a `direction: in` touch either way.
- No inbound email capture, no Resend webhooks, no IMAP — the paste IS the
  integration, and it costs nothing to maintain. If pasting ever feels like the
  bottleneck, that's a future ticket cut from evidence, not this one.

## Prompt

Read `.icm/intake/lead-engine/breakdown.md` and
`.icm/intake/lead-engine/reply-triage.md` in the jamienisbet repo. Add the log-a-reply
flow to the lead profile: pasted reply text becomes an inbound touch, and the AI
Gateway proposes outcome, stage move, next action and (when warranted) a grounded
response draft — each element separately one-tap acceptable, nothing applied until
tapped.

Follow the `design-dna` skill for any UI copy. CI is the source of truth — don't run
builds locally. Work on a `claude/` branch, push, open a PR, and `git mv` this stub
to `.icm/intake/lead-engine/_done/` in that PR.
