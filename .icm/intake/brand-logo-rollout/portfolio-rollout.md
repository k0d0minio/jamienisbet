# Stub: Roll the new logo and palette into the portfolio

- feature-slug: portfolio-rollout
- sequence: 3 of 4
- depends-on: ui-logo-and-palette
- priority: P1
- size: small

## What this is

The portfolio is a marketing-tier site. It renders the mark in the sticky site header, the
footer, the customer-questionnaire layout, and its favicon. Once `packages/ui` ships the
new set (stub 1), this stub points those call sites at it.

## Prompt

You are picking up work in a pnpm monorepo at the repo root `/`. Read this file first,
then the epic breakdown `.icm/intake/brand-logo-rollout/breakdown.md`, and
`.claude/skills/design-dna/SKILL.md` (the marketing tier) for the brand rules. This stub
depends on `ui-logo-and-palette` — confirm it is merged first.

Point every logo consumption point in `websites/portfolio` at the new set:

- **`components/site-header.tsx` / `components/site-footer.tsx`** — thin wrappers over
  the shared `@jamie-nisbet/app-shell` `SiteHeader` / `SiteFooter`, which render `LogoMark`
  (header) and `LogoMarkSolid` (footer). Verify the shell components pick up the new set
  via the package; change the wrapper only if it passes something specific.
- **`app/f/layout.tsx`** — the questionnaire's header `LogoMark`.
- **`app/icon.svg`** — the favicon; swap to the new icon form.

Marketing-tier rules hold: tokens not raw values, both themes correct, no app-tier chrome.
Run no local build/lint/typecheck — **CI is the source of truth.** Ship on a `claude/`
branch as a PR; when CI is green, close this stub with
`git mv .icm/intake/brand-logo-rollout/portfolio-rollout.md
.icm/intake/brand-logo-rollout/_done/`.
