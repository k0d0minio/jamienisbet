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
- **Upstream / reads from:** human input (Jamie's case studies, bio, selected projects); finished work in the client delivery repos (linked on `biz.clients`)
- **Downstream / feeds:** new leads into Neon `biz.clients`, worked from the admin dashboard
- **Draws on (Layer 3 reference):** [packages/ui](../../packages/ui/) — tokens, components, assets, and [BRAND.md](../../packages/ui/BRAND.md) (the brand guide)

## Contents

- `app/` — Next.js App Router: home (`page.tsx`, a single scrolling page), `work/` (index + `work/[slug]` case-study pages), `actions/contact.ts` and `actions/form.ts` (server actions), `f/[token]` (customer questionnaires — see below), plus `icon.png`, `opengraph-image.tsx`, `sitemap.ts`, `robots.ts`.
- `components/` — site chrome (`site-header`, `site-footer`, `theme-*`), layout primitives (`section.tsx`), the contact form, the customer questionnaire form, the markdown renderer, and the home `sections/`.
- `content/work/*.md` — case studies as markdown + YAML front-matter, editable as plain text (ICM Principle 2). Four real engagements (Vine Cliff Vineyards, Agorasim, Collabimmo, Boys To Men Retreat). Front-matter `url` is optional: set it to the live site and the case-study page renders a "Visit the live site" link.
- `lib/` — `site.ts` (copy/config), `work.ts` (content loader), `contact-schema.ts` (shared zod schema), `form-answer-schema.ts` (validation derived from a questionnaire snapshot), `services.ts` (the offered services as locale-invariant ids, shared by the Services section, contact form, and contact action).
- Brand/theme are **not** redefined here — the design system from [`packages/ui`](../../packages/ui/) is the single source of truth, linked via `app/globals.css`. (The earlier `theme.config` idea is replaced by that import.)
- The **marks** come from that same source. The header, footer and questionnaire render `LogoMark`/`LogoMarkSolid` from the package, so they follow it without this app holding any artwork. The two places that need a *file* — the favicon [`app/icon.png`](app/icon.png) and the Open Graph card, which inlines it because Satori cannot paint through a CSS mask — carry a 64px crop of the icon form's dark reading, cut from the brand artwork rather than redrawn. Nothing here draws the logo by hand; see [BRAND.md](../../packages/ui/BRAND.md) § Iconography → Logo.

## Customer questionnaires — `/f/[token]`

The site hosts one page that has nothing to do with marketing: the questionnaire a lead is sent
from the admin dashboard's **Forms** card. It lives here because this app already has the brand
chrome and a server action writing to `biz.clients` — a form doesn't justify a fifth app, and
nothing customer-facing belongs on the owner-only dashboard.

- **The token in the URL is the credential.** It is the `biz.form_links` row's uuid —
  unguessable, so there is no account and no password. `dynamic = "force-dynamic"`, `noindex` on
  the page *and* the layout, and `/f/` is disallowed in [`robots.ts`](app/robots.ts).
- **The page never reads markdown.** Every question comes from the link's `form_snapshot`,
  frozen when the dashboard sent it, so rewording a question in `.icm/onboarding/` afterwards
  can't change a form already in someone's inbox.
- **Validated against that same snapshot.** [`lib/form-answer-schema.ts`](lib/form-answer-schema.ts)
  builds a Zod schema from the frozen questions at submit time — required fields, select options,
  yes/no coercion — so a hand-crafted POST can't smuggle in an answer that was never offered.
  Submitting writes the answers and stamps the lead as touched.
- **Exactly once.** The "not yet completed" guard is in the UPDATE's WHERE clause, so a
  double-submit can only land one set of answers; an unknown or spent token renders a dead end
  (two different ones — "check the link" vs "you're already done"), never the form.
- **Its own root layout** ([`app/f/layout.tsx`](app/f/layout.tsx)): brand tokens and the
  mark, no nav, and none of the locale machinery — questionnaires are authored in one
  language, which is why the route sits outside `/[locale]` and is excluded from the
  next-intl matcher in [`proxy.ts`](proxy.ts).

## Notes
- One job: present Jamie and his work. Client sites live in their **own external repos**, not here.
- **Build first:** the portfolio is the first website to go live — it drives the word-of-mouth lead channel.
- Portfolio entries are **auto-suggested from completed engagements** (the delivery acceptance + retro in each client repo), then curated before publishing.
- Stack: Next.js App Router (React 19, Tailwind v4 via `@jamie-nisbet/ui`). Built and runnable locally; domains and Vercel deploy config come later.
- The contact form is fully built but **does not send yet** — it validates and confirms. Wiring (Resend) is deferred until `RESEND_API_KEY` is set (see `.env.example`), per the repo rule "no outbound action without review".
- Case studies should reference real delivered work without exposing any client-confidential material.
