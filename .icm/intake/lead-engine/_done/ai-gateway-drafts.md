# Stub: Grounded drafts, handed off — never sent

- feature-slug: ai-gateway-drafts
- sequence: 5 of 8
- depends-on: touch-log-next-action
- priority: P1
- size: L

## What this is

AI returns to the dashboard — leaner than what the 2026-08 reversal removed, and on
the other side of the standing rule: the app **composes and hands off**; Jamie sends
from his own mailbox and apps. No Resend in the dashboard, no auto-send path, no
document ceremony, no `generations` table.

Wiring (`websites/admin-dashboard`):

- The AI SDK (v7+) with the Vercel AI Gateway: model strings like
  `openai/gpt-5-nano` pass straight through — no provider packages. Auth via
  `AI_GATEWAY_API_KEY` (or OIDC once deployed). Default model gpt-5-nano-class for
  EN; whether PT-PT drafting warrants a step up (claude-haiku-class) is the
  session's call after reading a few drafts. Model ids live in one place.
- A server action, not an API route: `generateTouchDraft(clientId, kind)` where kind
  is a cadence step (first-touch, bump, follow-up, breakup). Grounding is everything
  on the row: name, company, sector, town, **language** (draft in PT-PT for `pt`
  leads), the **hook**, website facts, and the touch history for follow-ups (what
  was said, what they did). Style: a short voice prompt checked into the repo so the
  in-app generator and any Claude Code session write in the same register —
  `packages/ui/BRAND.md` voice, 3–5 sentences, one specific observation from the
  grounding, no flattery, never "I love your website". First-touch emails carry the
  provenance + reply-to-remove lines from sequence 3.

Surface (the lead profile, Work tab, above the touch history):

- A draft panel: generate → read → edit inline → regenerate. Then **handoff per
  channel**: `mailto:` with subject+body prefilled (the share-form-link precedent) ·
  `wa.me/<E.164>?text=` with the draft prefilled (whatsapp falls back to `phone`) ·
  copy-to-clipboard for Instagram. Suppressed contacts get a dead-end state, not a
  gesture. The handoff gesture offers to log the touch (channel + `sent`, draft
  attached) in the same movement — the draft lands in `touches.draft_md`, disposable
  by design.
- The existing manual Resend templates (`outreach-first-touch.html`, `follow-up.html`
  in `packages/ui/emails/`) stay for dashboard use but are not wired to anything —
  same as today.

Gates (read, never tick):

- [ ] Jamie: create the AI Gateway API key and set `AI_GATEWAY_API_KEY` in the
      `jamie-nisbet` Vercel project (never in git).
- [ ] Jamie: set a small monthly Gateway budget in the Vercel dashboard as the spend
      tripwire.

## Prompt

Read `.icm/intake/lead-engine/breakdown.md` and
`.icm/intake/lead-engine/ai-gateway-drafts.md` in the jamienisbet repo. Wire the AI
SDK through the Vercel AI Gateway in the admin dashboard, add the
`generateTouchDraft` server action grounded on the lead's facts, language, hook and
touch history, and build the draft panel with per-channel handoff (mailto, wa.me
prefill, copy) that offers to log the touch with the draft attached. The app never
sends; suppressed contacts get no handoff gesture. Leave the gates in this stub
unticked.

Follow the `design-dna` skill for any UI copy. CI is the source of truth — don't run
builds locally. Work on a `claude/` branch, push, open a PR, and `git mv` this stub
to `.icm/intake/lead-engine/_done/` in that PR.
