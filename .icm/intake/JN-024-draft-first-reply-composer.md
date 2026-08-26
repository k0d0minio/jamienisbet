# JN-024 · Draft-first reply composer on the lead profile

| | |
|---|---|
| Status | ready |
| Type | feature |
| Priority | P2 |
| Size | M |

## Problem

Three branded Resend templates exist in `projects/jamienisbet/packages/ui/emails/`
(`outreach-first-touch.html`, `follow-up.html`, `invoice-payment-reminder.html`),
documented in its README as manual-send-only — and no code path uses them. Replying to a
lead starts from a blank page every time. The assets exist; only the surface is missing.

## Build

A "Compose" card on the lead profile
(`projects/jamienisbet/websites/admin-dashboard/app/(app)/leads/[id]/`): pick a template, fill it with the
lead's context (name, service, last activity), and hand back copy-out text and/or a
`mailto:` link. **Never sends** — no Resend call, no send button; the send stays human,
per the standing "no outbound action without review" rule. Composing is client-side
string work; keep it simple.

## Acceptance

- [ ] Composer fills each template with the lead's real context
- [ ] Output is copyable text / mailto only — there is no code path that sends
- [ ] CI green

## Prompt

Add a draft-first reply composer to the admin dashboard's lead profile. Read
.icm/intake/JN-024-draft-first-reply-composer.md for full context. Templates live in
projects/jamienisbet/packages/ui/emails/ (see its README); the profile is
projects/jamienisbet/websites/admin-dashboard/app/(app)/leads/[id]/. Copy-out text or mailto only — never
send email from this feature. Open a PR on a claude/ branch; do not run local checks —
CI is the source of truth.
