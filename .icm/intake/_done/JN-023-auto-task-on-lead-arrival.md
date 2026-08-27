> Dropped: the leads list already surfaces who is waiting (longest-waiting first, new leads on top); the auto-task would duplicate that signal. 2026-08-27 estate ticket audit.

# JN-023 · Auto-task on lead arrival

| | |
|---|---|
| Status | ready |
| Type | feature |
| Priority | P2 |
| Size | S |

## Problem

When the portfolio contact form or the sellers-site referral persists a lead, the only
signal is topping a list sorted longest-waiting-first. The lead should also exist in the
working list: a "Reply to <name>" task, due in 2 days, linked to the client. The human
still writes and sends the reply — this only makes the follow-up impossible to lose.

## Build

In `websites/portfolio/app/actions/contact.ts` and
`websites/sellers-site/app/actions/referral.ts`, after `createClientFromContact` /
`createClientFromReferral` succeeds, call `createTask` from `packages/services`
("Reply to <name>", `due_date` +2 days, `client_id`). Non-fatal on failure, same as the
Resend send. If JN-017's `source` column has landed, don't mark these `sweep` — they're
intake-triggered; use `manual` or add an `intake` value, whichever reads better in the
migration.

## Acceptance

- [ ] A new contact-form or referral lead has an open linked reply task, due +2 days
- [ ] Task failure never breaks the submission
- [ ] CI green

## Prompt

Add an auto reply-task on lead arrival. Read
.icm/intake/JN-023-auto-task-on-lead-arrival.md for full context. Touch
websites/portfolio/app/actions/contact.ts and
websites/sellers-site/app/actions/referral.ts, calling createTask from
packages/services after the lead persists; non-fatal on failure. Open a PR on a claude/
branch; do not run local checks — CI is the source of truth.
