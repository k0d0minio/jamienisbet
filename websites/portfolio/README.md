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
- **Upstream / reads from:** human input (Jamie's case studies, bio, selected projects); finished work in the client delivery repos
- **Downstream / feeds:** new leads into the desk's pool (`desk.jamienisbet.com`, `POST /api/pool`), worked from the desk
- **Draws on (Layer 3 reference):** [packages/ui](../../packages/ui/) — tokens, components, assets, and [BRAND.md](../../packages/ui/BRAND.md) (the brand guide)

## Contents

- `app/` — Next.js App Router: home (`page.tsx`, a single scrolling page), `work/` (index + `work/[slug]` case-study pages), `actions/contact.ts` (the contact form's server action), plus `icon.png`, `opengraph-image.tsx`, `sitemap.ts`, `robots.ts`.
- `components/` — site chrome (`site-header`, `site-footer`, `theme-*`), layout primitives (`section.tsx`), the contact form, the markdown renderer, and the home `sections/`.
- `content/work/*.md` — case studies as markdown + YAML front-matter, editable as plain text (ICM Principle 2). Four real engagements (Vine Cliff Vineyards, Agorasim, Collabimmo, Boys To Men Retreat). Front-matter `url` is optional: set it to the live site and the case-study page renders a "Visit the live site" link.
- `lib/` — `site.ts` (copy/config), `work.ts` (content loader), `contact-schema.ts` (shared zod schema), `services.ts` (the offered services as locale-invariant ids, shared by the Services section, contact form, and contact action).
- Brand/theme are **not** redefined here — the design system from [`packages/ui`](../../packages/ui/) is the single source of truth, linked via `app/globals.css`. (The earlier `theme.config` idea is replaced by that import.)
- The **marks** come from that same source. The header, footer, hero, 404 and Open Graph card render `LogoFull` — the full lockup, traced from the artwork — from the package, so they follow it without this app holding any artwork. The one place that needs a raster is the favicon [`app/icon.png`](app/icon.png), the icon form's dark reading at 64px, cut from the brand artwork rather than redrawn. Nothing here draws the logo by hand; see [BRAND.md](../../packages/ui/BRAND.md) § Iconography → Logo.

## Notes
- One job: present Jamie and his work. Client sites live in their **own external repos**, not here.
- **Build first:** the portfolio is the first website to go live — it drives the word-of-mouth lead channel.
- Portfolio entries are **auto-suggested from completed engagements** (the delivery acceptance + retro in each client repo), then curated before publishing.
- Stack: Next.js App Router (React 19, Tailwind v4 via `@jamie-nisbet/ui`). Built and runnable locally; domains and Vercel deploy config come later.
- The contact form posts each lead to the desk's pool (`DESK_POOL_URL` + `DESK_POOL_TOKEN`) and mails Jamie through Resend (`RESEND_API_KEY`); see `.env.example`. A failed pool call never loses the lead: the mail still goes. Without the keys it validates, confirms and logs.
- Case studies should reference real delivered work without exposing any client-confidential material.
