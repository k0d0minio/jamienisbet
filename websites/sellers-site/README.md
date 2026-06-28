# Sellers Site (Public Affiliate & Partner Intake)

> **ICM role:** Layer 4 — working (a hosted web app; this README routes into it)
> **Purpose:** The public front door for the affiliate program — where local sellers submit a lead with their referral code, and partners register referrals.

## What this folder accomplishes
A public Next.js (App Router) site, deployed on Vercel, that powers Jamie's lead-generation channel without ad spend. Two jobs: (1) a local **affiliate seller** submits a customer lead tagged with their unique referral code (which makes the 10% payout unambiguous); (2) **partners** (accountants, print shops, co-working spaces, agencies) register reciprocal referrals. Submitted leads flow into [workspaces/lead-generation/](../../workspaces/lead-generation/) for triage. On-brand like every other site.

Two surfaces:
- **The affiliate landing** (`/`, route group `(site)`) — seller-facing: pitch → how the 10% works → what you sell → seller kit → partners → FAQ, with both capture forms as tabs in the `#refer` section. The `#kit` section is the seller toolkit: copy-paste opener messages and a follow-up sequence (WhatsApp / email / in-person, with their referral link baked in), objection handling, a packages & price sheet, a "what makes a lead worth sending" checklist, and a worked 10% earnings table.
- **The customer pitch** (`/pitch`, route group `(pitch)`) — a clean, customer-facing page a seller shows or sends a prospect. It sells the work (clear scope, clear price), never the commission, and prints to a one-pager (`Save as PDF`). It wears minimal brand chrome instead of the affiliate header.

Modelled on [../portfolio/](../portfolio/) — same stack and brand wiring. The seller-kit and pitch copy mirror the canonical source in [workspaces/lead-generation/stages/03_affiliate_program/output/sales-kit/](../../workspaces/lead-generation/stages/03_affiliate_program/output/sales-kit/) (edit-source: change the kit there, then mirror into `lib/site.ts`).

## How it connects to the architecture
- **Upstream / reads from:** public submissions (seller leads + partner referrals); the seller/partner registry and referral codes defined in [workspaces/lead-generation/stages/03_affiliate_program/](../../workspaces/lead-generation/stages/03_affiliate_program/).
- **Downstream / feeds:** a new lead into [workspaces/lead-generation/](../../workspaces/lead-generation/) (then project-triage). Attribution (the referral code) carries through so the 10% is paid on payment received.
- **Draws on (Layer 3 reference):** [_config/brand/visual/](../../_config/brand/visual/) + [_config/brand/voice/](../../_config/brand/voice/) (the seller-facing copy), [workspaces/lead-generation/references/](../../workspaces/lead-generation/references/) (the productised offer + pitch).

## Contents
- `app/` — App Router. Root `layout.tsx` is the shell (theme only); each route group supplies its own chrome. `(site)/` is the affiliate landing (`page.tsx` + `layout.tsx` with `site-header`/`site-footer`); `(pitch)/pitch/` is the customer pitch page (`page.tsx` + minimal `layout.tsx`). `actions/referral.ts` holds the two Server Actions; `robots.ts`, `sitemap.ts`, `icon.svg`, `not-found.tsx` live at the app root.
- `components/` — `site-header`/`site-footer`, `referral-forms` (the tabbed seller + partner forms), `pitch-scripts` (copy-to-clipboard opener + follow-up cards), `copy-button` / `print-button` (shared client controls), and `sections/` (hero, how-it-works, what-you-sell, sales-kit, partners, faq, refer-section).
- `lib/` — `site.ts` (copy + section data, incl. `pitchScripts` / `followUps` / `objections` / `packages` / `goodLeadSigns` / `earningExamples` / `pitch`) and `referral-schema.ts` (Zod schemas + form state types).
- Brand: consumes `@jamie-nisbet/ui` via `workspace:*` and `@import "@jamie-nisbet/ui/styles.css"`; theming is light/dark via the `data-theme` attribute (no per-site token overrides) — same pattern as `../portfolio/`.

## Notes
- One job: capture attributed leads from sellers and partners. Quoting/closing stays with Jamie (proposals); a seller may quote a landing page + contact form for ≥ €200 without approval, anything more complex needs sign-off.
- Sellers can share `/?ref=THEIR-CODE` links — the referral code prefills on the seller form so attribution is captured at first contact.
- **Delivery is deferred.** Both forms validate and confirm success, but submissions are only console-logged until a delivery target (e.g. `RESEND_API_KEY`, see `.env.example`) is configured and reviewed — honouring "no outbound action without review". Wire-up point: `app/actions/referral.ts`.
- Public site, deployed on Vercel. Run locally with `pnpm --filter @jamie-nisbet/sellers-site dev`.
