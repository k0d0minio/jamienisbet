# Client Sites

> **ICM role:** Layer 1 — router
> **Purpose:** Routes to each hosted client site — the landing-page deliverables sold through the affiliate program — all copied from one on-brand template.

## What this folder accomplishes
This holds one folder per client site: the landing pages that are the core product of Jamie's affiliate program (a local friend finds and sells the customer; Jamie builds the site; the affiliate earns 10%). Every client site is a Next.js (App Router) web app deployed on Vercel, scaffolded from [`_template-site/`](_template-site/) so each one starts on-brand and structurally consistent. A client site is the visible end of a full business pipeline — it only appears here after the lead has been generated, assessed, closed, and built. This folder is the skeleton: it routes to client sites and defines the rule that they all derive from the template.

## How it connects to the architecture
- **Upstream / reads from:** [projects/](../../projects/) — the site is built inside its delivery pipeline, then placed here; client facts from [shared/clients/](../../shared/clients/)
- **Downstream / feeds:** Vercel deployment (hosting/domain config later); [workspaces/finance/](../../workspaces/finance/) for invoicing once live
- **Draws on (Layer 3 reference):** [_template-site/](_template-site/) (the factory), [_config/brand/visual/](../../_config/brand/visual/), [_config/brand/voice/](../../_config/brand/voice/), [_config/brand/assets/](../../_config/brand/assets/)

## Contents
- `_template-site/` — the master template every client site is copied from (Layer 3 factory; leading underscore = not a deliverable)
- `<client-slug>/` — (planned) one folder per client site, named to match its [shared/clients/](../../shared/clients/) entry and its [projects/](../../projects/) pipeline

## The connection chain (lead -> live client site)
1. **Lead** — affiliate sources the customer via [workspaces/lead-generation/](../../workspaces/lead-generation/).
2. **Assess** — triaged in [workspaces/project-triage/](../../workspaces/project-triage/).
3. **Close** — priced and negotiated in [workspaces/proposals/](../../workspaces/proposals/).
4. **Build** — delivered through a [projects/](../../projects/) pipeline, then copied here from `_template-site/`.
5. **Invoice** — billed in [workspaces/finance/](../../workspaces/finance/), with the affiliate's 10% commission recorded.

## Notes
- Folder names should stay consistent across [shared/clients/](../../shared/clients/), [projects/](../../projects/), and here, so an agent can trace one client end to end.
- Affiliate-commission and payment terms are decision-support only; financial figures require review by a licensed Portuguese contabilista certificado before they are acted on.
- Stack intent is Next.js App Router on Vercel; hosting and deploy config come later — skeleton only.
