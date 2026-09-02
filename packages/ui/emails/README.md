# Email templates (Resend)

> **ICM role:** Layer 3 — reference (brand implementation)
> **Purpose:** Branded HTML source for Resend's dashboard **Templates** feature, styled from the
> same tokens as [`@jamie-nisbet/ui`](../) so every email looks like the rest of the brand.

These are plain HTML files, not React components — Resend's Template feature renders a
template it stores, referenced by `id`, so nothing needs to be built or imported from code.
Styling is inlined (table layout, inline `style` attributes, no external CSS) for mail-client
compatibility, using the light-mode brand colours, Hanken Grotesk / IBM Plex Mono font stacks,
and the wordmark lockup from [`../BRAND.md`](../BRAND.md).

## Setup (once per template)

1. Resend Dashboard → **Emails → Templates → New**.
2. Choose **Import HTML** and paste the file's contents.
3. Set the template's **From**, **Subject**, and (optionally) **Preview text** fields in the
   dashboard — these aren't in the HTML body. For the two notification templates, set Subject
   to `{{{SUBJECT}}}` so the calling code controls it; for the other three, set a fixed subject
   or write one using the template's own variables.
4. Declare each variable listed below (key, type `string`, and a fallback — Resend won't send if
   a variable without a fallback is missing).
5. **Publish** the template, then copy its template ID into [`template-ids.ts`](template-ids.ts).
   Template IDs aren't secrets (they only work paired with `RESEND_API_KEY`), so they're checked
   into that one file rather than duplicated as an env var per site per template — add a new key
   there as the template set grows, instead of wiring a new env var through every site.

Variable syntax in the body is Resend's triple-brace form: `{{{VARIABLE_NAME}}}`.

## Templates

### Wired into website code (sent automatically, no per-send review — same as today)

| File | Used by | Key in `template-ids.ts` | Variables |
|---|---|---|---|
| [`contact-form-notification.html`](contact-form-notification.html) | `websites/portfolio` contact form → `app/actions/contact.ts` | `contactFormNotification` | `SUBJECT`, `NAME`, `EMAIL`, `SERVICE`, `MESSAGE` |
| [`referral-lead-notification.html`](referral-lead-notification.html) | `websites/sellers-site` referral form → `app/actions/referral.ts` | `referralLeadNotification` | `SUBJECT`, `REFERRAL_CODE`, `CUSTOMER_NAME`, `CUSTOMER_PHONE`, `CUSTOMER_EMAIL`, `BUDGET`, `PREFERRED_CALL_TIME`, `NEED` |

These two replace the internal notification Jamie already receives automatically today — the
refactor is template-vs-inline-text only, it doesn't change what gets sent or when.

### Manual use only — do not call from code

Per the repo's standing rule ("no outbound action without review"), client-facing email is
drafted and sent by a human, not fired automatically. These are branded HTML you can compose,
preview, and send by hand from the Resend dashboard (**Emails → Send → From a template**).
Fill the variables per client/lead, review the preview, then send.

| File | Variables |
|---|---|
| [`invoice-payment-reminder.html`](invoice-payment-reminder.html) | `CLIENT_NAME`, `INVOICE_NUMBER`, `AMOUNT`, `DUE_DATE`, `BUSINESS_EMAIL` |
| [`outreach-first-touch.html`](outreach-first-touch.html) | `CLIENT_NAME`, `OPENER`, `WHAT`, `HOOK`, `CTA`, `BUSINESS_EMAIL` |
| [`follow-up.html`](follow-up.html) | `CLIENT_NAME`, `CONTEXT`, `RECAP`, `NEXT_STEP` |

`CONTEXT` should include its own leading punctuation/space if used, e.g. `" — great to finally
put a voice to the emails"`, to match the "Good to talk{{{CONTEXT}}}." sentence it drops into.

## Brand reference

- Colours: ink `#1E1E1E` (primary/links — the logo's own; there is no second hue),
  neutrals `#FFFFFF`/`#F8F7F3` (surfaces), `#E4E3DD` (border), `#1E1E1E`/`#4F4E4B`/`#6F6E6A`
  (text-1/2/3) — see
  [`../tokens/`](../tokens/). Dark mode is
  intentionally not implemented here — most inboxes strip `<style>`/media queries, so all values
  are hardcoded light-mode.
- Fonts: `'Hanken Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto,
  sans-serif` for body/headings; `'IBM Plex Mono', ui-monospace, 'SF Mono', 'Cascadia Code',
  Menlo, Consolas, monospace` for the uppercase eyebrow label and footer — the one place brand
  voice allows uppercase.
- Logo: the wordmark ("Jamie Nisbet" in Hanken Grotesk 700) is the lockup used here, per
  [`../BRAND.md`](../BRAND.md) — no image asset
  required, so nothing breaks when images are blocked by default.
- Voice: first person singular, sentence case, no emoji, no exclamation marks, quiet/specific
  CTAs — see [`../BRAND.md`](../BRAND.md).
