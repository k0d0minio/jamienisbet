# Packages

> **ICM role:** Layer 1 — router
> **Purpose:** Shared packages and services available to **all** of Jamie's websites at once — the common code layer beneath [`websites/`](../websites/).

## What this folder accomplishes
This is the home for reusable code shared across the web estate, so a fix or a brand change
happens **once** and every site inherits it. Today it holds the design system; it is the
landing place for future shared services (an API client, auth helpers, analytics, a Stripe
wrapper, etc.) as they're extracted.

## Contents
- [`ui/`](ui/) — **`@jamie-nisbet/ui`**: the design system in code, built on
  **Tailwind CSS v4 + shadcn/ui**. Brand tokens (`styles.css` = Tailwind theme entry, `tokens.css`/`tokens/` =
  variables-only, light + dark), reusable React components (Button, Card, Input, Dialog, …)
  themed with those tokens, and brand assets (logo marks, social card, email signature, icon
  helper). It is the canonical implementation of the brand defined in
  [`_config/brand/visual/`](../_config/brand/visual/). See [`ui/README.md`](ui/README.md).
- [`services/`](services/) — **`@jamie-nisbet/services`**: the database models and business
  logic shared across the estate, built on **Drizzle ORM + Neon Postgres**. Typed schema (under
  a dedicated `biz` Postgres schema), a lazy DB client, and query helpers (lead capture today;
  billing/invoicing/proposals later). Source-only like `ui`, consumed via `transpilePackages`.
  See [`services/README.md`](services/README.md).
- [`icm/`](icm/) — **`@jamie-nisbet/icm`**: the ICM runtime for the admin dashboard's AI
  pipeline. Maps each generatable document kind onto its governing stage `CONTEXT.md`, loads
  only the Layer-3 files that contract names (templates, brand voice, rates, rubrics), and
  carries the model policy from
  [`_config/conventions/model-and-scaling.md`](../_config/conventions/model-and-scaling.md)
  as code. Server-only, source-only. See [`icm/README.md`](icm/README.md).
- [`app-shell/`](app-shell/) — **`@jamie-nisbet/app-shell`**: the shared Next.js app shell for
  the public marketing sites (portfolio, sellers-site, payment-gateway). i18n routing +
  locale-aware navigation + a request-config factory (en/pt/fr), theme provider/toggle,
  language switcher, layout sections, and the parametrised site header/footer. Next-,
  next-intl- and next-themes-coupled pieces live here so `ui` stays framework-light;
  source-only, consumed via `transpilePackages`.

## How it connects to the architecture
- **Upstream / reads from:** the brand contract in [`_config/brand/`](../_config/brand/) (visual + voice).
- **Downstream / feeds:** every app in [`websites/`](../websites/) consumes these packages —
  e.g. `import { Button } from '@jamie-nisbet/ui'` and `import '@jamie-nisbet/ui/styles.css'`.

## Conventions
- One source of truth: a package owns its concern; sites compose it, they don't fork it.
- Each package carries its own `README.md` (router/narrative) and `package.json`.
- Scope packages under `@jamie-nisbet/*`. The repo is a **pnpm workspace** (root `package.json`
  and `pnpm-workspace.yaml` cover `packages/*` and `websites/*`); run `pnpm install` at the root,
  then wire each new site as a workspace dependency of `@jamie-nisbet/ui`.
