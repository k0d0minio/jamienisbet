# Stub: Roll the new logo and palette into the admin dashboard

- feature-slug: admin-dashboard-rollout
- sequence: 2 of 4
- depends-on: ui-logo-and-palette
- priority: P0
- size: medium

## What this is

The admin is the app-tier PWA and the attached surface — it carries the logo in its phone
tab bar, its desktop sidebar, its login screen, and every installable icon. Once
`packages/ui` ships the new set (stub 1), this stub points every admin call site at it and
re-derives the hand-copied PWA/apple icons.

## Prompt

You are picking up work in a pnpm monorepo at the repo root `/`. Read this file first,
then the epic breakdown `.icm/intake/brand-logo-rollout/breakdown.md`, and
`.claude/skills/design-dna/SKILL.md` + `packages/ui/BRAND.md` § App tier. This stub
depends on `ui-logo-and-palette` — confirm the updated `LogoMark`/`LogoMarkSolid`
components are merged before you start.

Point every logo consumption point in `websites/admin-dashboard` at the new set:

- **`components/nav.tsx`** — the `LogoMark` in the desktop `Sidebar` masthead.
- **`components/app-menu.tsx`** — the `LogoMark` on the phone's compact title bar (the
  app-level control that remains of the old brand bar); and its `SheetTitle`,
  "Consultancy JN", if it should show the full wordmark.
- **`app/login/page.tsx`** — the `LogoMarkSolid` that renders the installed icon on the
  sign-in screen after the splash.
- **`lib/app-icon.tsx` + `app/icon-192.png/route.tsx`, `app/icon-512.png/route.tsx`,
  `app/apple-icon.png/route.tsx`** — this is the one hand-copied path. It re-draws the
  monogram paths and a hard-coded `#3A5A78` into an `ImageResponse` so the auto-generated
  PNG can be a PWA/apple-touch icon. Re-derive it from the new set: the icon form plus
  the new palette tile, sized to survive an 80%-diameter maskable safe zone (the current
  mark sits at ~66% of the tile for exactly that reason — re-check the number if the
  artwork changes). `app/manifest.ts` references these routes and the name "Consultancy JN";
  update it only if the new brand changes the short/homescreen name.
- **`public/icon.svg`** — the favicon; swap to the new icon form.

App-tier rules hold: tokens not raw values, renders correctly in light **and** dark, the
44px touch floor, and nothing app-tier leaks into a marketing site. Run no local
build/lint/typecheck — **CI is the source of truth.** Also apply the design-dna PR
checklist before opening the PR. Ship on a `claude/` branch as a PR; when CI is green,
close this stub with `git mv .icm/intake/brand-logo-rollout/admin-dashboard-rollout.md
.icm/intake/brand-logo-rollout/_done/`.
