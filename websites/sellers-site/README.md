# Sellers Site (Public Affiliate & Partner Intake)

> **ICM role:** Layer 4 — working (a hosted web app; this README routes into it)
> **Purpose:** The public front door for the affiliate program — where local sellers submit a lead with their referral code, and partners register referrals.

## What this folder accomplishes
A public Next.js (App Router) site, deployed on Vercel, that powers Jamie's lead-generation channel without ad spend. Two jobs: (1) a local **affiliate seller** submits a customer lead tagged with their unique referral code (which makes the 10% payout unambiguous); (2) **partners** (accountants, print shops, co-working spaces, agencies) register reciprocal referrals. Submitted leads flow into [workspaces/lead-generation/](../../workspaces/lead-generation/) for triage. On-brand like every other site.

Built as a single-page landing (pitch → how the 10% works → what you sell → seller kit → partners → FAQ) with both capture forms presented as tabs in the `#refer` section. The `#kit` section equips sellers to actually sell: copy-paste pitch messages (WhatsApp / email / in-person) with their referral link baked in, a "what makes a lead worth sending" checklist, and a worked 10% earnings table. Modelled on [../portfolio/](../portfolio/) — same stack and brand wiring.

## How it connects to the architecture
- **Upstream / reads from:** public submissions (seller leads + partner referrals); the seller/partner registry and referral codes defined in [workspaces/lead-generation/stages/03_affiliate_program/](../../workspaces/lead-generation/stages/03_affiliate_program/).
- **Downstream / feeds:** a new lead into [workspaces/lead-generation/](../../workspaces/lead-generation/) (then project-triage). Attribution (the referral code) carries through so the 10% is paid on payment received.
- **Draws on (Layer 3 reference):** [_config/brand/visual/](../../_config/brand/visual/) + [_config/brand/voice/](../../_config/brand/voice/) (the seller-facing copy), [workspaces/lead-generation/references/](../../workspaces/lead-generation/references/) (the productised offer + pitch).

## Contents
- `app/` — App Router: `page.tsx` composes the landing sections; `layout.tsx` wires the brand theme; `actions/referral.ts` holds the two Server Actions; `robots.ts`, `sitemap.ts`, `icon.svg`.
- `components/` — `site-header`/`site-footer`, `referral-forms` (the tabbed seller + partner forms), `pitch-scripts` (the copy-to-clipboard pitch cards), and `sections/` (hero, how-it-works, what-you-sell, sales-kit, partners, faq, refer-section).
- `lib/` — `site.ts` (copy + section data, incl. `pitchScripts` / `goodLeadSigns` / `earningExamples`) and `referral-schema.ts` (Zod schemas + form state types).
- Brand: consumes `@jamie-nisbet/ui` via `workspace:*` and `@import "@jamie-nisbet/ui/styles.css"`; theming is light/dark via the `data-theme` attribute (no per-site token overrides) — same pattern as `../portfolio/`.

## Notes
- One job: capture attributed leads from sellers and partners. Quoting/closing stays with Jamie (proposals); a seller may quote a landing page + contact form for ≥ €200 without approval, anything more complex needs sign-off.
- Sellers can share `/?ref=THEIR-CODE` links — the referral code prefills on the seller form so attribution is captured at first contact.
- **Delivery is deferred.** Both forms validate and confirm success, but submissions are only console-logged until a delivery target (e.g. `RESEND_API_KEY`, see `.env.example`) is configured and reviewed — honouring "no outbound action without review". Wire-up point: `app/actions/referral.ts`.
- Public site, deployed on Vercel. Run locally with `pnpm --filter @jamie-nisbet/sellers-site dev`.
