# Stub: Leads list in the native idiom

- feature-slug: leads-list-native
- sequence: 4 of 8
- depends-on: lead-profile-contacts-card
- priority: P1
- size: M

## What this is

The most-seen screen, converted to the proven vocabulary. Behaviour that already works —
the swipe gestures, the staleness sort, the filter semantics — is kept; the presentation
and glanceability change.

- **Header** — "Leads" as the large title; the three money figures (in play, / month,
  in kind) become a proper glance row of mono stat figures under it, not a subtitle
  sentence.
- **Rows** — the list becomes an inset grouped list. Each row keeps its two-line shape
  but reads at a glance: name and value in stronger contrast, the waiting line in
  footnote size, overdue-for-a-nudge carried by the muted destructive tint. Deal badges
  stay a third line only when present.
- **Swipes** — `swipe-row` stays the engine; the trays are restyled to the iOS
  full-colour swipe-action idiom (leading swipe = touched in slate, trailing = call /
  email / archive), with a haptic at the commit threshold.
- **Filters** — the chip rail becomes a native-feeling segmented control (All / Open /
  Customers / Lost with counts); Archived stays a separate view switch near the title.
- **Add lead** — the floating button restyles to sit above the floating tab bar; the
  create form keeps its Lead / Customer fork in a detented sheet.
- **Desktop** — the table is retired. The same grouped list scales up in the sidebar
  layout with a wider row (status changeable in place via menu, actions on hover *and*
  focus); nothing hover-only.
- Empty, loading (layout-true skeleton rows), and error states in the new idiom; both
  colour modes.

The working-list strip is *not* touched here — it dies in `needs-you-inbox` (sequence 5),
which replaces it. Until then it renders as-is above the new list.

## Prompt

Read `.icm/intake/admin-native-redesign/breakdown.md` and then
`.icm/intake/admin-native-redesign/leads-list-native.md` (this stub) in the `jamienisbet`
repo. Sequences 1–3 must be merged; build strictly from the app tier and the patterns the
lead profile proved, extending `packages/ui` where a primitive is missing.

Rework `websites/admin-dashboard/app/(app)/page.tsx` and its list components
(`lead-row`, `chip`, `client-create-form`, `deal-badges`, `client-status-select`,
`client-actions`) as specified: large-title header with a mono stat glance row, inset
grouped rows, restyled iOS-idiom swipe actions with a threshold haptic, segmented
filters, the floating add button re-seated above the floating tab bar, and the desktop
table replaced by the scaled-up list. Keep the sort, filter semantics, counts, and every
gesture behaviour identical; leave the working-list strip untouched for sequence 5.

Follow the amended `design-dna` skill. Work on a `claude/` branch, push, verify on the
Vercel preview from a phone (swipes, haptics, reach) and at desk width (no table, no
hover-only affordances), in both colour modes. When done, `git mv` this stub to
`.icm/intake/admin-native-redesign/_done/`.
