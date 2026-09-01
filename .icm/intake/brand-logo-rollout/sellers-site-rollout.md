# Stub: Roll the new logo and palette into the sellers site

- feature-slug: sellers-site-rollout
- sequence: 4 of 4
- depends-on: ui-logo-and-palette
- priority: P1
- size: small

## What this is

The sellers site is a marketing-tier surface — the affiliate program's public front door.
It renders the mark in the pitch layout, in the shared header/footer, and in its favicon.
Once `packages/ui` ships the new set (stub 1), this stub points those call sites at it.

## Prompt

You are picking up work in a pnpm monorepo at the repo root `/`. Read this file first,
then the epic breakdown `.icm/intake/brand-logo-rollout/breakdown.md`, and
`.claude/skills/design-dna/SKILL.md` (the marketing tier) for the brand rules. This stub
depends on `ui-logo-and-palette` — confirm it is merged first.

Point every logo consumption point in `websites/sellers-site` at the new set:

- **`app/[locale]/(pitch)/layout.tsx`** — the pitch header `LogoMark` (this layout also
  renders the mark beside `site.name` and carries the language/theme toggles; the header
  and footer are `print:hidden` so a PDF yields a clean one-pager — keep that).
- **`components/site-header.tsx` / `components/site-footer.tsx`** — thin wrappers over the
  shared `@jamie-nisbet/app-shell` `SiteHeader` / `SiteFooter`; verify they inherit the new
  set via the package, and change the wrapper only if it passes something specific.
- **`app/icon.svg`** — the favicon; swap to the new icon form.

Marketing-tier rules hold: tokens not raw values, both themes correct, no app-tier chrome.
Check `messages/en.json` and `fr.json` for any logo-related copy only if the brand name
changes. Run no local build/lint/typecheck — **CI is the source of truth.** Ship on a
`claude/` branch as a PR; when CI is green, close this stub with
`git mv .icm/intake/brand-logo-rollout/sellers-site-rollout.md
.icm/intake/brand-logo-rollout/_done/`.
