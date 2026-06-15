# Portfolio Site

> **ICM role:** Layer 4 — working (the site is a per-instance product; this README is its Layer 1 router into that app)
> **Purpose:** Jamie's own portfolio web app — the showcase that turns networking and word-of-mouth interest into qualified leads.

## What this folder accomplishes
This holds Jamie's professional portfolio: a Next.js (App Router) site, deployed on Vercel, that presents who he is (software engineer / AI consultant, based in Mafra, Portugal), the work he has shipped, and how to reach him. Because his only lead channels today are networking and word of mouth, this site is the link he hands out — it must look like the brand and convert a warm introduction into a real conversation. It pulls every visual decision from the shared brand tokens so it is unmistakably "Jamie Nisbet". This folder is the skeleton: it describes what the app will be, not the code.

## How it connects to the architecture
- **Upstream / reads from:** human input (Jamie's case studies, bio, selected projects); finished work referenced from [projects/](../../projects/)
- **Downstream / feeds:** new leads back into [workspaces/lead-generation/](../../workspaces/lead-generation/); contact details sourced from [_config/business/](../../_config/business/)
- **Draws on (Layer 3 reference):** [_config/brand/visual/](../../_config/brand/visual/) (color, type, design tokens), [_config/brand/voice/](../../_config/brand/voice/) (bio and CTA copy rules), [_config/brand/assets/](../../_config/brand/assets/) (logo, favicon)

## Contents
- `app/` — (planned) Next.js App Router pages: home, work/case studies, about, contact
- `content/` — (planned) markdown case studies and bio copy, editable as plain text (ICM Principle 2)
- `public/` — (planned) images and exported brand assets
- `theme.config` — (planned) the file that imports brand tokens from `_config/brand/visual/`

## Notes
- One job: present Jamie and his work. Client sites live in their **own external repos**, not here.
- **Build first:** the portfolio is the first website to go live — it drives the word-of-mouth lead channel.
- Portfolio entries are **auto-suggested from completed [projects/](../../projects/)** (delivery acceptance + retro), then curated before publishing.
- Stack intent is Next.js App Router on Vercel; domains and deploy config come later — skeleton only.
- Case studies should reference real [projects/](../../projects/) work without exposing any client-confidential material.
