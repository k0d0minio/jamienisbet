# Brand logo rollout — breakdown

- epic: brand-logo-rollout
- cut: 2026-09-01, from Jamie's brief and an inventory of every current monogram
  consumption point across the estate
- scope: `packages/ui` (the brand source of truth) + `websites/admin-dashboard` +
  `websites/portfolio` + `websites/sellers-site`. The `websites/payment-gateway`
  deprecation is **out of scope** — that is a separate triage ticket
  (`.icm/intake/triage/deprecate-payment-gateway.md`).

## What was understood

- **The new assets are a logo *set*, not per-site logos.** Four files were added to
  `websites/admin-dashboard/public/logos/` (`1.png` … `4.png`). Per Jamie's clarification
  these are the **full logo form** and the **icon form**, each in **light** and **dark**
  theme readings — i.e. a single logo and icon that serve *every* state the brand appears
  in: the page-header wordmark, the compact icon/monogram, mastheads, the PWA manifest
  icon, the tab/favicon, and the apple-touch icon. There is no per-app mapping.
- **The identity currently lives in one place and fans out.** `packages/ui` owns the JN
  monogram (`assets/logo/mark-monogram.svg`, `-solid.svg`, and `src/components/brand/logo.tsx`
  → `LogoMark` / `LogoMarkSolid`), and every app consumes the package. That is exactly the
  single-source-of-truth the rollout must keep: the new logo set lands in `packages/ui`
  once, and the apps just inherit it. The **one deliberate exception** is the admin's PWA
  icon generator (`lib/app-icon.tsx`), which hand-copies the monogram paths and the brand
  hex into an `ImageResponse` because an auto-generated PNG cannot read the theme's CSS
  custom properties — that duplication must be re-derived from the new set, not left behind.
- **The current brand colour is a disciplined single slate blue** (`--primary` = `#3A5A78`,
  the ramp in `packages/ui/tokens/colors.css`). The new logos bring their own "minimal
  design and colour palette", which will likely amend that primary. Scope: a fresh session
  that can see the PNGs decides the palette values, but the standing rule holds — **any
  change to `--primary`/the colour ramps stays semantic-token-only and flips correctly
  between light and dark `[data-theme]`**. The app-tier tint (`--app-tint` *is* `--primary`)
  follows automatically.
- **The brand is a tier, and the rollout must respect it.** The marketing sites
  (portfolio, sellers) and the app tier (admin) render the same mark through the same
  package but in different chrome. Nothing app-tier may leak into a marketing site and
  vice-versa; the new set should slot into the existing `LogoMark`/`LogoMarkSolid`/`Monogram`
  call sites rather than invent a new chrome vocabulary.
- **This is a plan, not a build.** The deliverable is the intake batch — the epic here
  plus the payment deprecation triage stub. The pick-up work ships later on a `claude/`
  branch through a PR (design-dna and pr-conventions apply during the PR).

## Decisions (all Jamie's, 2026-09-01)

1. **The logo set lands in `packages/ui` once** — the design system stays the single
   source of truth. New SVG assets go in `assets/logo/`, the components are re-derived to
   render the full logo form and the icon form for both theme readings, and any palette
   change is recorded in `tokens/colors.css` + `BRAND.md`.
2. **The palette is extracted from the PNGs by the pick-up session** (Jamie's call) — a
   fresh session that can see the images derives the hex values and the per-theme tints.
   This stub is written cold and names the files to open.
3. **Every app inherits the mark from the package** — app stubs swap call sites to the
   updated components; no app re-draws the artwork. The one hand-copied path (the admin's
   `lib/app-icon.tsx` and its `app/icon-*.png`/`apple-icon.png` routes) is re-derived from
   the new set.
4. **Payment-gateway deprecation is a separate ticket** — not widened into this epic
   (`.icm/intake/triage/deprecate-payment-gateway.md`).

## Build order

1. `ui-logo-and-palette` — land the new logo set and palette in `packages/ui` (assets +
   components + tokens + BRAND.md). **The foundation; everything else consumes it.**
2. `admin-dashboard-rollout` — depends on 1. Swap the admin's chrome to the new mark and
   re-derive the PWA/apple icons + favicon.
3. `portfolio-rollout` — depends on 1. Swap the portfolio's header/footer/questionnaire
   marks and favicon.
4. `sellers-site-rollout` — depends on 1. Swap the sellers pitch/template marks and
   favicon.

2–4 are independent of each other once 1 lands; their ordering above is just the list
order. `triage/deprecate-payment-gateway.md` is orthogonal and may be cut at any time.

## Sources

- The new logo set: `websites/admin-dashboard/public/logos/` (`1.png`–`4.png`).
- Current monogram: `packages/ui/assets/logo/*.svg`, `packages/ui/src/components/brand/logo.tsx`.
- Palette: `packages/ui/tokens/colors.css` (current `--blue-*` ramp, `--primary` `#3A5A78`).
- App-tier notes: `packages/ui/BRAND.md` § App tier; `.claude/skills/design-dna/SKILL.md`.
