# Stub: App shell — floating chrome, large titles, desktop sidebar

- feature-slug: app-shell-chrome
- sequence: 2 of 8
- depends-on: app-tier-foundations
- priority: P1
- size: M

## What this is

The admin's chrome rebuilt on the app tier, so every screen after this lands inside
native-feeling bones. Screens themselves are not redesigned here — they render as they
are inside the new shell.

- **Tab bar** (phones) — the fixed bottom bar becomes a **floating** tab bar in the
  Liquid Glass idiom: translucent material, elevated above content with a margin, content
  scrolling visibly underneath it. Still three tabs for now (Leads, Tickets, Money);
  `needs-you-inbox` adds the fourth. Keep the 3.5rem-class targets and safe-area
  handling; rework `bottom-above-tabs` and the Toaster offset to the new geometry.
- **Header** — the sticky brand bar is replaced by the `LargeTitleHeader` pattern:
  each screen declares its title, which sets large and collapses into a compact material
  bar on scroll. The wordmark stops leading every page; the JN monogram becomes a small
  trailing button in the compact bar carrying sign out (and later, app-level actions).
- **Desktop** — iPad-style scale-up: from the breakpoint where the tab bar hides, a
  leading **sidebar** (monogram, tabs with icons, sign out at the foot) replaces the
  top-bar links. Content sits in the same grouped-list column widths, wider.
- **Appearance** — follow the system. Both modes verified through the new materials;
  `theme-color` in the manifest/viewport reacts to mode.
- **View transitions** — keep the held-still chrome (`vt-app-header`/`vt-app-tabs`
  equivalents) and re-tune the page cross-fade to the new motion tokens.

Files in play: `components/nav.tsx`, `app/(app)/layout.tsx`, `app/globals.css`,
`app/layout.tsx`, `app/manifest.ts`.

## Prompt

Read `.icm/intake/admin-native-redesign/breakdown.md` and then
`.icm/intake/admin-native-redesign/app-shell-chrome.md` (this stub) in the `jamienisbet`
repo. The app tier from sequence 1 must already be in `packages/ui` — build on its
tokens and primitives, extending the package (not the app) if something is missing.

Rebuild the admin's chrome in `websites/admin-dashboard` as specified: floating
translucent tab bar on phones, collapsing large-title header per screen with the
monogram/sign-out in the compact bar, a sidebar on wide viewports replacing the top-bar
links, system-following appearance with both modes verified, and view transitions
re-tuned to the new motion tokens. Do not redesign the screens' content — they ship
as-is inside the new shell; keep pull-to-refresh and all routes working.

Follow the `design-dna` skill (as amended by sequence 1). Work on a `claude/` branch,
push, read CI and the Vercel preview on a real phone — the floating bar, safe areas, and
toast offsets are only provable there. When done, `git mv` this stub to
`.icm/intake/admin-native-redesign/_done/`.
