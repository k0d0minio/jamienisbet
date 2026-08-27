# JN-031 · Dark mode for the admin dashboard

| | |
|---|---|
| Status | ready |
| Type | feature |
| Priority | P1 |
| Size | M |

## Problem

The token system fully supports dark (`[data-theme="dark"]` flips every semantic alias)
but the admin hardcodes `data-theme="light"` in `app/layout.tsx` and never looks back.
A phone cockpit checked in the evening deserves a dark theme, and the brand already
paid for one.

## Build

In `websites/admin-dashboard`:

- **System-following by default**: resolve `prefers-color-scheme` to `data-theme`
  before first paint (inline script in the root layout — no flash of wrong theme).
- **Manual override**: a three-state control (system / light / dark) tucked where
  chrome already lives — next to Sign out is fine. Persist in `localStorage`; the
  inline script reads it first.
- **PWA plumbing follows the theme**: `theme-color` meta switches with
  `prefers-color-scheme` media queries; the manifest/`background_color` and
  `offline.html` stop assuming light; the sticky header's translucent backdrop uses
  tokens, not hardcoded background.
- **Sweep for light-only assumptions** across the app and any `packages/ui` component
  the dashboard uses: raw hexes, `bg-white`, hardcoded shadows, the swipe-row action
  tray colours, status/badge colours — everything must read from semantic tokens and be
  checked visually in both themes.

Semantic status colours (the red "waiting 7+ days" flag, invoice states, overdue todos)
must keep their meaning and contrast in dark — muted, never neon, per BRAND.md.

## Acceptance

- [ ] App follows system theme with no first-paint flash; manual override persists
- [ ] Every screen (Leads, lead profile, Tickets, Money, login) legible in both themes
- [ ] `theme-color` / manifest / offline page match the active theme
- [ ] No raw colour values left in app code — semantic tokens only
- [ ] CI green

## Prompt

Wire up dark mode in the admin dashboard. Read .icm/intake/JN-031-dashboard-dark-mode.md
for full context. The design system already themes via [data-theme="dark"]
(packages/ui/tokens/colors.css); the app hardcodes light in
websites/admin-dashboard/app/layout.tsx. Implement system-following theme with a
persisted manual override and no first-paint flash, update PWA theme-color/manifest/
offline.html, and sweep the app for light-only colour assumptions. Open a PR on a
claude/ branch; do not run local checks — CI is the source of truth.
