# Client Site Template

> **ICM role:** Layer 3 — reference (the factory: a stable scaffold copied to create each client site)
> **Purpose:** The master, on-brand starting point every client landing page is copied from, so each site begins consistent and brand-aligned.

## What this folder accomplishes
This is the factory for client sites (ICM Principle 5: configure the factory, not the product). It defines the canonical structure, brand wiring, and conventions of a Next.js (App Router) landing page so that producing a new client site is a copy-and-configure step rather than a from-scratch build. It is stable across runs: it changes when Jamie improves the standard offering, not per client. To create a client site, an agent copies this folder to `websites/clients/<client-slug>/` and fills it with that client's content. This README describes what the template contains; it does not scaffold app code.

## How it connects to the architecture
- **Upstream / reads from:** improvements proven in [websites/personal/](../../personal/) and patterns from [shared/knowledge/](../../shared/knowledge/)
- **Downstream / feeds:** every new `websites/clients/<client-slug>/` site; built per client inside [projects/](../../projects/)
- **Draws on (Layer 3 reference):** [_config/brand/visual/](../../../_config/brand/visual/) (design tokens), [_config/brand/voice/](../../../_config/brand/voice/) (copy rules), [_config/brand/assets/](../../../_config/brand/assets/) (logo, favicon)

## Contents
- `app/` — (planned) Next.js App Router skeleton: hero, services, about, contact, call-to-action
- `content/` — (planned) plain-markdown placeholder copy a human edits per client (ICM Principle 2)
- `public/` — (planned) placeholder images and brand assets
- `theme.config` — (planned) imports brand tokens from `_config/brand/visual/`; the single point where branding is wired in
- `SETUP.md` — (planned) the copy-and-configure checklist: rename slug, swap content, point at the client record

## How to use the template
1. Copy this folder to `websites/clients/<client-slug>/`, matching the slug in [shared/clients/](../../../shared/clients/) and [projects/](../../projects/).
2. Confirm `theme.config` resolves to the current brand tokens in `_config/brand/visual/`.
3. Replace placeholder content with the client's real copy and assets.
4. Review at the human gate (ICM Principle 4) before any deploy.

## Notes
- The leading underscore marks this as a non-deliverable scaffold; never deploy `_template-site/` itself.
- Keep brand wiring centralized in `theme.config` so a brand-token update in `_config/brand/visual/` propagates to all client sites.
- Stack intent is Next.js App Router on Vercel; hosting and deploy config come later — skeleton only.
