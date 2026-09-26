# Chore: gates-badge-inbox-only

- invariant: the badge on the rail and the tab bar still reads "follow-ups plus gates and PRs
  rows" once GitHub has actually been read this session, and still hides at 0 and on a failed
  read; only *when* the gates half is read changes.
- change: `app/(app)/layout.tsx` streams `countFollowUps()` (Neon only) instead of `countInbox()`
  — the layout no longer calls `lib/gates.ts` → `loadGates` (the roster, the PR GraphQL query, a
  tree read per roster repo and a blob per run folder on main) on every screen's render, including
  every screen's own pull-to-refresh. Only `app/(app)/inbox/page.tsx` still reads it.
  `components/inbox-live-count.ts` now persists the Inbox's last combined total (follow-ups plus
  gates) across navigation and a reload in this tab, instead of clearing it the moment the Inbox
  unmounts, so the rail and the tab bar (`components/nav.tsx`) show that exact number on every
  other screen too. `lib/inbox.ts` → `countInbox` and `lib/gates.ts` → `countGates` are now dead
  and removed. `README.md`'s two descriptions of the badge (the shell section and the Inbox
  section, which had drifted apart already) are brought back in line with this.
- rollback: revert the commit — `countInbox()` (and `countGates()`) come back and the layout goes
  back to reading gates on every render.
- learned: none
