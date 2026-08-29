# Stub: Lead profile as a Contacts-style card

- feature-slug: lead-profile-contacts-card
- sequence: 3 of 8
- depends-on: app-shell-chrome
- priority: P1
- size: L

## What this is

The proving ground — the densest screen, rebuilt in the iOS Contacts idiom. If the new
language works here, it works everywhere.

- **Identity header** — monogram-style avatar, name set large, company and status under
  it, the value figure in mono beside them. Collapses on scroll into the compact bar
  (name only), scroll-linked via the app tier's spring tokens.
- **Action row** — the Contacts idiom: a row of prominent circular actions directly
  under the identity — call, WhatsApp, email, mark touched, work started. These replace
  the current button rail; disabled (not hidden) when the lead lacks the datum.
- **Grouped inset sections**, in working order: Deal, Notes, Forms, Delivery repo,
  Todos, Intake (folded), and a Danger zone as iOS-style red grouped rows at the very
  bottom. Each section is `GroupedSection` + rows; the existing per-section edit sheets
  stay, restyled with detents and springs, still posting the same scoped server actions
  (`saveClientContact` / `saveDealTerms` / `saveClientNotes`).
- **Contact facts as rows** — email row opens mail, phone row opens WhatsApp, copy
  affordance per row — the current cards' behaviour, in the grouped idiom.
- **Haptics** on state changes (status moved, touched, work started) via `lib/haptics.ts`.
- Desktop: same page, scaled up in the sidebar layout — sections may sit two-up; no
  return of form-like layouts.

This is a visual and structural rework, not a data change: no schema, no server-action
signatures, no new capabilities. All four view states designed (content, empty per
section, loading, error), both colour modes.

## Prompt

Read `.icm/intake/admin-native-redesign/breakdown.md` and then
`.icm/intake/admin-native-redesign/lead-profile-contacts-card.md` (this stub) in the
`jamienisbet` repo. Sequences 1–2 must already be merged — the app tier and the new
chrome are the vocabulary this screen is built from; extend `packages/ui` rather than
forking anything locally.

Rebuild `websites/admin-dashboard/app/(app)/leads/[id]/` and its components
(`lead-contact-card`, `lead-deal-card`, `lead-notes-card`, `client-actions`,
`work-started-button`, `form-links`, `client-repo-link`, `disclosure-card` usage) as the
Contacts-style card specified in the stub: collapsing identity header, circular action
row, grouped inset sections in the given order, red grouped danger zone, detented edit
sheets posting the unchanged server actions, haptics on state changes. Keep every
existing capability — forms, repo connect, Stripe link, todos — reachable; nothing is
dropped, only re-housed.

Follow the amended `design-dna` skill. Work on a `claude/` branch, push, and verify on
the Vercel preview from a phone: one-handed reach, the collapse, sheet detents, and both
colour modes. When done, `git mv` this stub to
`.icm/intake/admin-native-redesign/_done/`.
