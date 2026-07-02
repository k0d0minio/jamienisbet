# Email templates (Resend)

> **ICM role:** Layer 3 — reference (brand implementation)
> **Purpose:** Branded HTML source for Resend's dashboard **Templates** feature, styled from the
> same tokens as [`@jamie-nisbet/ui`](../) so every email looks like the rest of the brand.

These are plain HTML files, not React components — Resend's Template feature renders a
template it stores, referenced by `id`, so nothing needs to be built or imported from code.
Styling is inlined (table layout, inline `style` attributes, no external CSS) for mail-client
compatibility, using the light-mode brand colours, Hanken Grotesk / IBM Plex Mono font stacks,
and the wordmark lockup from [`_config/brand/visual/`](../../../_config/brand/visual/).

## Setup (once per template)

1. Resend Dashboard → **Emails → Templates → New**.
2. Choose **Import HTML** and paste the file's contents.
3. Set the template's **From**, **Subject**, and (optionally) **Preview text** fields in the
   dashboard — these aren't in the HTML body. For the two notification templates, set Subject
   to `{{{SUBJECT}}}` so the calling code controls it; for the other three, set a fixed subject
   or write one using the template's own variables.
4. Declare each variable listed below (key, type `string`, and a fallback — Resend won't send if
   a variable without a fallback is missing).
5. **Publish** the template, then copy its template ID into the relevant `.env.local`.

Variable syntax in the body is Resend's triple-brace form: `{{{VARIABLE_NAME}}}`.

## Templates

### Wired into website code (sent automatically, no per-send review — same as today)

| File | Used by | Env var for the template ID | Variables |
|---|---|---|---|
| [`contact-form-notification.html`](contact-form-notification.html) | `websites/portfolio` contact form → `app/actions/contact.ts` | `RESEND_CONTACT_NOTIFICATION_TEMPLATE_ID` | `SUBJECT`, `NAME`, `EMAIL`, `SERVICE`, `MESSAGE` |
| [`referral-lead-notification.html`](referral-lead-notification.html) | `websites/sellers-site` referral form → `app/actions/referral.ts` | `RESEND_REFERRAL_NOTIFICATION_TEMPLATE_ID` | `SUBJECT`, `REFERRAL_CODE`, `CUSTOMER_NAME`, `CUSTOMER_PHONE`, `CUSTOMER_EMAIL`, `BUDGET`, `PREFERRED_CALL_TIME`, `NEED` |

These two replace the internal notification Jamie already receives automatically today — the
refactor is template-vs-inline-text only, it doesn't change what gets sent or when.

### Manual use only — do not call from code

Per the repo's standing rule ("no outbound action without review"), client-facing email is
drafted and sent by a human, not fired automatically. These mirror
[`shared/templates/email/`](../../../shared/templates/email/) but as branded HTML you can compose,
preview, and send by hand from the Resend dashboard (**Emails → Send → From a template**) instead
of the plain-text draft-then-`scripts/send-email.sh` flow. Fill the variables per client/lead,
review the preview, then send.

| File | Mirrors | Variables |
|---|---|---|
| [`invoice-payment-reminder.html`](invoice-payment-reminder.html) | `shared/templates/email/chase.md` | `CLIENT_NAME`, `INVOICE_NUMBER`, `AMOUNT`, `DUE_DATE`, `BUSINESS_EMAIL` |
| [`outreach-first-touch.html`](outreach-first-touch.html) | `shared/templates/email/outreach.md` | `CLIENT_NAME`, `OPENER`, `WHAT`, `HOOK`, `CTA`, `BUSINESS_EMAIL` |
| [`follow-up.html`](follow-up.html) | `shared/templates/email/follow-up.md` | `CLIENT_NAME`, `CONTEXT`, `RECAP`, `NEXT_STEP` |

`CONTEXT` should include its own leading punctuation/space if used, e.g. `" — great to finally
put a voice to the emails"`, to match the "Good to talk{{{CONTEXT}}}." sentence it drops into.

## Brand reference

- Colours: `--blue-600 #3A5A78` (primary/links), neutrals `#FFFFFF`/`#F7F8F9` (surfaces),
  `#E2E5E9` (border), `#15181C`/`#4C545D`/`#6B747F` (text-1/2/3) — see
  [`_config/brand/visual/tokens.json`](../../../_config/brand/visual/tokens.json). Dark mode is
  intentionally not implemented here — most inboxes strip `<style>`/media queries, so all values
  are hardcoded light-mode.
- Fonts: `'Hanken Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto,
  sans-serif` for body/headings; `'IBM Plex Mono', ui-monospace, 'SF Mono', 'Cascadia Code',
  Menlo, Consolas, monospace` for the uppercase eyebrow label and footer — the one place brand
  voice allows uppercase.
- Logo: the wordmark ("Jamie Nisbet" in Hanken Grotesk 700) is the lockup used here, per
  [`_config/brand/visual/logo.md`](../../../_config/brand/visual/logo.md) — no image asset
  required, so nothing breaks when images are blocked by default.
- Voice: first person singular, sentence case, no emoji, no exclamation marks, quiet/specific
  CTAs — see [`_config/brand/voice/`](../../../_config/brand/voice/).
