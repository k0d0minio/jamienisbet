# Stub: The board's `[`/`]` repo keys can't be typed on AltGr/Option layouts

- lane: tweak
- found-by: keyboard-nav release review · 2026-09-24
- complexity: low

## Problem

The Tickets board's keyboard map (`websites/admin-dashboard/components/use-board-keys.ts`)
ignores every keypress with Ctrl, Meta or Alt held — the `keyboard-nav` spec's rule, so browser
and OS shortcuts are never taken. On layouts where `[` and `]` are themselves typed with AltGr
(Windows: reported as Ctrl+Alt) or Option (macOS) — Portuguese, German, Spanish among them — the
`[`/`]` repo-switching keys can therefore never fire. The spec's two rules conflict on those
layouts; Release parked it rather than change the spec's modifier rule pre-merge.

## Prompt

In `websites/admin-dashboard/components/use-board-keys.ts`, let a keypress through the modifier
guard when the character it produced (`event.key`) is exactly `[`, `]` or `?` and Meta is not
held — AltGr/Option produce the character itself in `event.key`, so no browser shortcut can
collide — while every other key keeps ignoring Ctrl/Alt. Keep Meta always ignored. Update the
comment above the guard and the keyboard paragraph in `websites/admin-dashboard/README.md`
(Tickets → "The keyboard, from `lg`") to say so. Verify on the preview with a Portuguese layout
(macOS: Option+8 / Option+9) that `[`/`]` step the repo chips, and that Ctrl+R / Cmd+R still
reload the page rather than refresh the board.
