# Websites

> **ICM role:** Layer 1 — router
> **Purpose:** Routes to every web app Jamie hosts under his own roof — portfolio, payment gateway, admin dashboard, and the public sellers site — all sharing one brand identity.

## What this folder accomplishes
This is the home for Jamie's **own** front-facing and internal web apps. Each is a Next.js (App Router) app deployed on Vercel, and the unifying thread is brand identity — every app pulls its design tokens (color, type, logo, spacing) from one source ([_config/brand/visual/](../_config/brand/visual/)) so the whole estate looks coherent. **Client websites do not live here** — each client site is its own external repo (with its own ICM pipeline); this repo only points to it (see [shared/clients/](../shared/clients/) `repo-link.md`). This folder is the skeleton: it routes an agent to the right app and defines the rules each obeys. No app code or deploy config lives here yet.

## How it connects to the architecture
- **Upstream / reads from:** human input (Jamie chooses what to host); business state across the repo (for the admin dashboard); the affiliate program in [workspaces/lead-generation/](../workspaces/lead-generation/) (for the sellers site).
- **Downstream / feeds:** Vercel deployments (hosting/domains added later); leads back into [workspaces/lead-generation/](../workspaces/lead-generation/) (sellers site); payments into [workspaces/finance/](../workspaces/finance/) (payment gateway).
- **Draws on (Layer 3 reference):** [_config/brand/visual/](../_config/brand/visual/) for design tokens, [_config/brand/voice/](../_config/brand/voice/) for copy, [_config/brand/assets/](../_config/brand/assets/) for logos/favicons.

## Contents
- `portfolio/` — Jamie's own portfolio, the proof-of-work showcase (**build first**).
- `payment-gateway/` — Stripe-powered payment surface where clients pay invoices/retainers.
- `admin-dashboard/` — private internal control panel: pipeline, deals, invoices, metrics.
- `sellers-site/` — public affiliate + partner referral intake (the 10% program's front door).

## Brand-as-code
Each app resolves its theme from `_config/brand/visual/` design tokens (the brand pass emits these as machine-readable JSON / CSS variables), so one brand change updates documents *and* every site. No per-app brand overrides.

## Notes
- Stack intent is Next.js App Router on Vercel; actual hosting, domains, and deploy config are added later — this is the folder skeleton only.
- Client sites are external repos — see [shared/clients/](../shared/clients/) and [_config/conventions/client-and-slug.md](../_config/conventions/client-and-slug.md).
