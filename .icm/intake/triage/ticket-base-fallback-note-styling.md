# Stub: A missing UAT branch reads as an unreadable repo on the Tickets board

- lane: tweak
- found-by: Release code review of `dashboard-reads-ticket-base` · 2026-09-23
- priority: P2
- size: S
- sources: `websites/admin-dashboard/app/(app)/tickets/page.tsx` → the "Couldn't be read"
  section · `websites/admin-dashboard/lib/tickets.ts` → `TicketFetchError.fallback`

## What this is

When a repo declares a UAT ticket base branch that GitHub can't find, the board reads its default
branch and returns a `fallback: true` entry alongside the tickets. The Tickets page renders that
entry under the red **Couldn't be read** heading with the destructive row styling, so the repo
reads as unreadable while its tickets sit right below it. The home feed already leaves these
entries out. The spec placed the note in that banner on purpose; this tweak gives it its own,
non-destructive treatment.

## Prompt

In jamienisbet, read `.icm/intake/triage/ticket-base-fallback-note-styling.md`. On the Tickets
board (`websites/admin-dashboard/app/(app)/tickets/page.tsx`), render `errors` entries with
`fallback: true` apart from the unreadable ones: a caveat row (not `variant="destructive"`, not
under "Couldn't be read") naming the repo and the missing branch — follow the `design-dna` skill.
Leave the real unreadable repos as they are. Ship as `tweak` on a `claude/` branch and `git mv`
this stub into `.icm/intake/triage/_done/` in the same PR.
