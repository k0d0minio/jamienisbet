# Tweak: board-keys-altgr-brackets

- change: `websites/admin-dashboard/components/use-board-keys.ts`: the modifier guard now lets
  `[`, `]` and `?` through with Ctrl/Alt held (Meta still always blocks) — AltGr/Option-layout
  keyboards (Portuguese, German, Spanish among them) report those as Ctrl+Alt or Option while
  `event.key` already carries the produced character, so no browser shortcut collides. Updated
  the README's keyboard paragraph to say so.
- changelog: announce: none (repo has no changelog — `_shared/project-rules.md` → Reporting)
- learned: none
