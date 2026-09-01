# @jamie-nisbet/app-shell

> **ICM role:** Layer 3 — reference (shared code)
> **Purpose:** The shared Next.js app shell for the public marketing sites — one copy of the
> chrome and i18n plumbing that portfolio and sellers-site used to duplicate.

## What lives here
- **`./i18n`** — the shared `next-intl` routing config (en/pt/fr + locale metadata), the
  locale-aware `Link`/`router` exports, and `createLocaleRequestConfig`, so each app's
  `i18n/request.ts` is a two-liner pointing at its own `messages/*.json`.
- **Components** — `ThemeProvider`, `ThemeToggle`, `LanguageSwitcher`,
  `Container`/`Section`/`SectionHeading`, `CopyButton`, and the parametrised
  `SiteHeader` (nav + CTA + mobile menu) and slotted `SiteFooter`. Each site keeps a thin
  `components/site-header.tsx` / `site-footer.tsx` wrapper that resolves its own translation
  catalogs and passes plain strings/nodes in.

## Boundaries
- Next-, next-intl- and next-themes-coupled code belongs here; framework-light primitives and
  brand tokens stay in [`@jamie-nisbet/ui`](../ui/) (which this package builds on).
- Source-only (no build step) — apps consume it via `transpilePackages`.
- The admin dashboard does not use this package (no i18n, different chrome).

## Adding a site
Add `"@jamie-nisbet/app-shell": "workspace:*"` to the app, list it in `transpilePackages`,
re-export the i18n stubs (`i18n/request.ts` via `createLocaleRequestConfig`), and wrap
`SiteHeader`/`SiteFooter` with the site's catalogs.
