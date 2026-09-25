# Tweak: inbox-badge-live-on-navigation

- change: `websites/admin-dashboard/components/{nav.tsx,inbox-list.tsx,inbox-live-count.ts}`,
  `lib/inbox.ts`: the Inbox screen now pushes its own read (visible follow-ups + gate rows —
  the same rule `countInbox` uses) into a live override the rail/tab bar badge prefers over the
  layout's streamed `countInbox()` promise, which a client-side navigation never re-runs. Cleared
  on unmount, so leaving the Inbox falls back to the streamed value.
- changelog: announce: none (this repo has no changelog — `_shared/project-rules.md` → Reporting)
- learned: none
