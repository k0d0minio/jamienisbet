# Portfolio Site

> **ICM role:** Layer 4 — working (the site is a per-instance product; this README is its Layer 1 router into that app)
> **Purpose:** Jamie's own portfolio web app — the showcase that turns networking and word-of-mouth interest into qualified leads.

## What this folder accomplishes
This holds Jamie's professional portfolio: a Next.js (App Router) site, deployed on Vercel, that presents who he is (software engineer / AI consultant, based in Portugal), the work he has shipped, and how to reach him. Because his only lead channels today are networking and word of mouth, this site is the link he hands out — it must look like the brand and convert a warm introduction into a real conversation. It pulls every visual decision from the shared brand tokens so it is unmistakably "Jamie Nisbet".

## Run it

```bash
pnpm install                                   # from the repo root (once)
pnpm --filter @jamie-nisbet/portfolio dev      # http://localhost:3000
pnpm --filter @jamie-nisbet/portfolio build    # production build
```
The app is a workspace member (`@jamie-nisbet/portfolio`) and consumes the design system from
[`packages/ui`](../../packages/ui/) — `app/globals.css` links `@jamie-nisbet/ui/styles.css` once
(tokens + fonts + shadcn theme) and `next.config.ts` transpiles the package's TSX source. Theme is
light/dark via the `data-theme` attribute (header toggle, `next-themes`). No tokens are forked here.

## How it connects to the architecture
- **Upstream / reads from:** human input (Jamie's case studies, bio, selected projects); finished work referenced from [projects/](../../projects/)
- **Downstream / feeds:** new leads back into [workspaces/lead-generation/](../../workspaces/lead-generation/); contact details sourced from [_config/business/](../../_config/business/)
- **Draws on (Layer 3 reference):** [_config/brand/visual/](../../_config/brand/visual/) (color, type, design tokens), [_config/brand/voice/](../../_config/brand/voice/) (bio and CTA copy rules), [_config/brand/assets/](../../_config/brand/assets/) (logo, favicon)

## Contents

- `app/` — Next.js App Router: home (`page.tsx`, a single scrolling page), `work/` (index + `work/[slug]` case-study pages), `actions/contact.ts` (server action), plus `icon.svg`, `opengraph-image.tsx`, `sitemap.ts`, `robots.ts`.
- `components/` — site chrome (`site-header`, `site-footer`, `theme-*`), layout primitives (`section.tsx`), the contact form, the markdown renderer, and the home `sections/`.
- `content/work/*.md` — case studies as markdown + YAML front-matter, editable as plain text (ICM Principle 2). Currently one clearly-marked sample; add real work here.
- `lib/` — `site.ts` (copy/config), `work.ts` (content loader), `contact-schema.ts` (shared zod schema), `services.ts` (the offered services as locale-invariant ids, shared by the Services section, contact form, and contact action).
- Brand/theme are **not** redefined here — the design system from [`packages/ui`](../../packages/ui/) is the single source of truth, linked via `app/globals.css`. (The earlier `theme.config` idea is replaced by that import.)

## Notes
- One job: present Jamie and his work. Client sites live in their **own external repos**, not here.
- **Build first:** the portfolio is the first website to go live — it drives the word-of-mouth lead channel.
- Portfolio entries are **auto-suggested from completed [projects/](../../projects/)** (delivery acceptance + retro), then curated before publishing.
- Stack: Next.js App Router (React 19, Tailwind v4 via `@jamie-nisbet/ui`). Built and runnable locally; domains and Vercel deploy config come later.
- The contact form is fully built but **does not send yet** — it validates and confirms. Wiring (Resend) is deferred until `RESEND_API_KEY` is set (see `.env.example`), per the repo rule "no outbound action without review".
- Case studies should reference real [projects/](../../projects/) work without exposing any client-confidential material.
