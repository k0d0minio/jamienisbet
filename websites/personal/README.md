# Personal & Experimental Sites

> **ICM role:** Layer 4 — working (each site here is a per-instance product; this README routes into them)
> **Purpose:** A home for Jamie's personal and experimental web apps — the sandbox where ideas, demos, and side projects live on-brand.

## What this folder accomplishes
This is where Jamie hosts sites that are neither his portfolio nor a paid client deliverable: personal pages, experiments, demos, and proofs-of-concept. It is the low-stakes sandbox where he can try a new Next.js (App Router) pattern, prototype an AI feature, or stand up a one-off page — while still drawing on the shared brand so even experiments feel like part of the same studio. Lessons learned here often graduate into reusable patterns for client work. This folder is the skeleton: it describes intent, not code.

## How it connects to the architecture
- **Upstream / reads from:** human input (whatever Jamie wants to build or test)
- **Downstream / feeds:** proven patterns can inform [websites/clients/_template-site/](../clients/_template-site/) and the portfolio; reusable techniques can be written up in [shared/knowledge/](../../shared/knowledge/)
- **Draws on (Layer 3 reference):** [_config/brand/visual/](../../_config/brand/visual/) (tokens, applied loosely for experiments), [_config/brand/voice/](../../_config/brand/voice/), [_config/brand/assets/](../../_config/brand/assets/)

## Contents
- `<one-folder-per-site>/` — (planned) each personal or experimental site as its own Next.js app
- `README in each child` — (planned) one line per experiment: what it is, whether it is live

## Notes
- One job: personal/experimental hosting. Anything that becomes a paid deliverable moves to [../clients/](../clients/); anything that becomes Jamie's primary showcase moves to [../portfolio/](../portfolio/).
- Brand tokens still apply, but experiments may bend them deliberately — note any intentional deviation in the site's own README.
- Stack intent is Next.js App Router on Vercel; hosting and deploy config come later — skeleton only.
- Keep genuinely personal/private content clearly separated from business material, consistent with how [tracker/](../../tracker/) separates personal todos from business data.
