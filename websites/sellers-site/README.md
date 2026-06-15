# Sellers Site (Public Affiliate & Partner Intake)

> **ICM role:** Layer 4 — working (a hosted web app; this README routes into it)
> **Purpose:** The public front door for the affiliate program — where local sellers submit a lead with their referral code, and partners register referrals.

## What this folder accomplishes
A public Next.js (App Router) site, deployed on Vercel, that powers Jamie's lead-generation channel without ad spend. Two jobs: (1) a local **affiliate seller** submits a customer lead tagged with their unique referral code (which makes the 10% payout unambiguous); (2) **partners** (accountants, print shops, co-working spaces, agencies) register reciprocal referrals. Submitted leads flow into [workspaces/lead-generation/](../../workspaces/lead-generation/) for triage. On-brand like every other site. Skeleton only — intent, not code.

## How it connects to the architecture
- **Upstream / reads from:** public submissions (seller leads + partner referrals); the seller/partner registry and referral codes defined in [workspaces/lead-generation/stages/03_affiliate_program/](../../workspaces/lead-generation/stages/03_affiliate_program/).
- **Downstream / feeds:** a new lead into [workspaces/lead-generation/](../../workspaces/lead-generation/) (then project-triage). Attribution (the referral code) carries through so the 10% is paid on payment received.
- **Draws on (Layer 3 reference):** [_config/brand/visual/](../../_config/brand/visual/) + [_config/brand/voice/](../../_config/brand/voice/) (the seller-facing copy), [workspaces/lead-generation/references/](../../workspaces/lead-generation/references/) (the productised offer + pitch).

## Contents
- `app/` — (planned) Next.js App Router pages: the offer, a seller lead form (with referral code), a partner referral form.
- `theme.config` — (planned) imports brand tokens from `_config/brand/visual/`.

## Notes
- One job: capture attributed leads from sellers and partners. Quoting/closing stays with Jamie (proposals); a seller may quote a landing page + contact form for ≥ €200 without approval, anything more complex needs sign-off.
- Public site. Stack intent: Next.js App Router on Vercel — skeleton only.
