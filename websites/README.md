# Websites

> **ICM role:** Layer 1 — router
> **Purpose:** Routes to every hosted web app Jamie operates — his portfolio, personal/experimental sites, and client-facing landing pages — all sharing one brand identity.

## What this folder accomplishes
This is the home for every site Jamie hosts under his own roof: his professional portfolio, personal/experimental sites, and the client landing pages sold through the affiliate program. Each site is intended to be a Next.js (App Router) web app deployed on Vercel, but the unifying thread is brand identity — every site pulls its design tokens (color, type, logo, spacing) from a single source so the whole estate looks coherent. This folder is the skeleton only: it routes an agent to the right sub-area and defines the rules each site obeys. No app code or deploy config lives here yet.

## How it connects to the architecture
- **Upstream / reads from:** [projects/](../projects/) (a client site is built inside its delivery pipeline, then lands here), human input (Jamie chooses what to host)
- **Downstream / feeds:** Vercel deployments (hosting/domain config added later); [workspaces/finance/](../workspaces/finance/) once a client site is invoiced
- **Draws on (Layer 3 reference):** [_config/brand/visual/](../_config/brand/visual/) for design tokens, [_config/brand/voice/](../_config/brand/voice/) for copy, [_config/brand/assets/](../_config/brand/assets/) for logos/favicons/letterhead

## Contents
- `portfolio/` — Jamie's own portfolio site, the proof-of-work showcase
- `personal/` — personal and experimental sites (sandbox, side projects)
- `clients/` — one folder per client site; deliverables sold via the affiliate program, copied from `clients/_template-site/`

## The connection chain (lead -> live site)
A client site travels the whole business pipeline before it lands here:
1. **Lead** — a local affiliate finds a customer via [workspaces/lead-generation/](../workspaces/lead-generation/) (the 10%-commission affiliate program).
2. **Assess** — the opportunity is triaged in [workspaces/project-triage/](../workspaces/project-triage/) (worth Jamie's time?).
3. **Close** — pricing and negotiation run through [workspaces/proposals/](../workspaces/proposals/).
4. **Build** — delivery happens in a [projects/](../projects/) pipeline; the finished site is placed under `clients/`.
5. **Invoice** — billing closes the loop in [workspaces/finance/](../workspaces/finance/).

## Notes
- Brand is the non-negotiable through-line: every site here sources tokens from `_config/brand/visual/` so Jamie's portfolio and a client landing page feel like the same studio made them.
- Stack intent is Next.js App Router on Vercel, but actual hosting, domains, and deploy config are added later — this is the folder skeleton only.
- `_template-site/` is the factory; each client folder is a product (ICM Principle 5: configure the factory, not the product).
