# Stub: Land the new logo set and palette in the design system

- feature-slug: ui-logo-and-palette
- sequence: 1 of 4
- depends-on: none
- priority: P0
- size: medium

## What this is

The brand source of truth in `packages/ui` still ships the old JN monogram and the
slate-blue `#3A5A78` ramp. The new logo set — four PNGs presenting the **full logo form**
and the **icon form**, each in a **light** and **dark** theme reading — was dropped in
`websites/admin-dashboard/public/logos/`. This stub moves the brand, not just the assets:
the set is the single source of truth the rest of the estate inherits.

## Prompt

You are picking up work in a pnpm monorepo at the repo root `/`. Read this file first,
then the epic breakdown `.icm/intake/brand-logo-rollout/breakdown.md` for the full
context and build order, and `.claude/skills/design-dna/SKILL.md` + `packages/ui/BRAND.md`
(especially the App tier section) for the brand rules the change must respect.

The new logo set is four PNGs in `websites/admin-dashboard/public/logos/`
(`1.png`–`4.png`): the full logo form and the icon form, as both light and dark theme
readings — not per-site logos. **Open those images now** (you can see them; derive the
palette yourself). Extract the exact hex values for the logo's "minimal design and colour
palette" and decide, per Jamie's brief, where they land in the current ramp.

The identity lives in one place and fans out; keep it that way. Make the change in
`packages/ui` and the apps will inherit it:

- **Assets.** Add the new logo set under `packages/ui/assets/logo/` as SVGs (a
  `currentColor`/token-driven form, plus a solid/tile form for favicons and the app
  tier), replacing or extending `mark-monogram.svg` / `mark-monogram-solid.svg`.
- **Components.** Update `packages/ui/src/components/brand/logo.tsx` so `LogoMark`
  (icon form, inherits `currentColor`) and `LogoMarkSolid` (solid/tile form) render the
  new mark, with a `theme`/appearance path so both light and dark readings are available.
  Keep the public API and consumers compiling — check the barrel `src/index.ts` and the
  `brand/` exports, and grep the estate for every `LogoMark`/`LogoMarkSolid` call site so
  none of them silently break.
- **Tokens.** If the new palette changes the brand colour, update the semantic tokens in
  `packages/ui/tokens/colors.css` — `--primary`, the `--blue-*` ramp, and the dark-theme
  block under `[data-theme="dark"]`. The rules are non-negotiable: semantic tokens only,
  no raw hexes at call sites, and both themes flip correctly on `[data-theme="dark"]`.
  The app tier's `--app-tint` *is* `--primary`, so it follows automatically — do not
  introduce a per-domain accent.
- **Docs.** Update the logo/identity lines in `packages/ui/BRAND.md` and
  `packages/ui/README.md` to describe the new set (logo + icon, light + dark) and any
  palette change. Mark the old monogram as replaced; do not delete history.
- **Monogram.** The app-tier `Monogram` (`src/components/app/monogram.tsx`) is a *person's*
  initials disc, not the brand — leave it; it is unrelated to this mark.

Verify nothing else in the repo re-draws the artwork by hand — the admin's
`websites/admin-dashboard/lib/app-icon.tsx` does, but that is stub 2's job; note it in
the PR if it needs the new palette sooner. Run no local build/lint/typecheck — **CI is
the source of truth.** Ship on a `claude/` branch as a PR; when the PR merges and CI is
green, close this stub with `git mv .icm/intake/brand-logo-rollout/ui-logo-and-palette.md
.icm/intake/brand-logo-rollout/_done/`.
