# Stub: Native polish sweep

- feature-slug: native-polish-sweep
- sequence: 8 of 8
- depends-on: needs-you-inbox, money-native, tickets-board-native
- priority: P2
- size: M

## What this is

The pass that makes the redesign feel finished rather than converted. Whole-app, no new
surfaces.

- **Motion and haptics audit** — every spring, collapse, sheet, and swipe measured
  against the app-tier tokens; haptics present at every state change and absent
  everywhere else; `prefers-reduced-motion` verified to stop every loop and spring.
- **States audit** — every screen's empty, loading (layout-true skeletons), error, and
  not-configured states re-checked in the new idiom, both colour modes, phone and desk.
- **Login** — the one screen outside the shell restyled to match: material card,
  native type scale, correct keyboard attributes.
- **PWA shell** — `offline.html` restyled; manifest reviewed (name, mode-aware
  `theme-color`, icon set including maskable) so install, splash, and status bar read
  native in both modes; app icons re-rendered if the monogram tile needs the new shape
  language.
- **Accessibility** — contrast of text on materials in both modes, focus visibility in
  the sidebar layout, touch floor intact under the new chrome, VoiceOver labels on the
  circular action rows and swipe actions.
- **Performance** — backdrop blur cost on mid phones; the floating chrome must not
  jank the leads scroll. Degrade material to translucency-without-blur where the
  platform is weak, behind a capability check, not a user setting.
- **Docs** — `websites/admin-dashboard/README.md` § Mobile & PWA and § Layout brought
  in line with what now exists; anything the redesign retired deleted from the tree
  (old table components, dead utilities, the working-list remnants).

## Prompt

Read `.icm/intake/admin-native-redesign/breakdown.md` and then
`.icm/intake/admin-native-redesign/native-polish-sweep.md` (this stub) in the
`jamienisbet` repo. Every earlier stub in this epic must be merged — this is the closing
pass over the finished redesign.

Sweep `websites/admin-dashboard` (and `packages/ui` app tier where a fix belongs in the
package) through the checklist in the stub: motion/haptics audit, four-states audit,
login restyle, PWA shell and icons, accessibility, blur performance with capability-based
degradation, README updates, and deletion of everything the redesign orphaned. File
anything larger than a fix you find along the way as a triage stub in
`.icm/intake/triage/` rather than widening this PR.

Follow the amended `design-dna` skill. Work on a `claude/` branch, push, and verify on
the Vercel preview installed to a real phone home screen — splash, status bar, offline,
haptics — in both colour modes. When done, `git mv` this stub to
`.icm/intake/admin-native-redesign/_done/`, and if every stub is then in `_done/`,
archive the epic whole: `git mv .icm/intake/admin-native-redesign/
.icm/intake/_done/admin-native-redesign/`.
