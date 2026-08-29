# Stub: Tickets board in the native idiom

- feature-slug: tickets-board-native
- sequence: 7 of 8
- depends-on: lead-profile-contacts-card
- priority: P2
- size: M

## What this is

The batch board converted to the proven vocabulary. The board's contract is untouched:
read-only, repo as source of truth, every button a link or a pre-filled Claude launcher.

- **Header** — "Tickets" as the large title; the refresh affordance joins the compact
  bar.
- **Now-strip** — today's picks, runs in flight, and blocked stubs restyled as the
  screen's leading grouped section (it moves *into* the Needs you feed at sequence 5;
  here it remains the board's own opener, restyled).
- **Repo sections** — each repo an inset grouped section, batches as rows: batch name,
  progress (`N of M`) as a mono figure with the thin `Meter`, next stub as the footnote
  line. Triage and Backlog pseudo-batches ride as rows in the same idiom.
- **Batch sheet** — the stub list opens in a detented sheet (popover/dialog at desk),
  stubs expanding to the rendered ticket with the existing `.prose` styling reviewed
  against the new type scale.
- **Launchers and swipes** — Start in Claude Code, Copy prompt, Open in terminal, and
  the maintenance launchers keep their exact link shapes and caps; row swipes keep their
  behaviour, restyled to the iOS swipe idiom with the threshold haptic.
- Not-configured (no `GITHUB_TOKEN`), loading skeletons, empty board, and error states
  in the new idiom; both colour modes.

## Prompt

Read `.icm/intake/admin-native-redesign/breakdown.md` and then
`.icm/intake/admin-native-redesign/tickets-board-native.md` (this stub) in the
`jamienisbet` repo. Sequences 1–3 must be merged; build from the app tier and proven
patterns, extending `packages/ui` where a primitive is missing.

Rework `websites/admin-dashboard/app/(app)/tickets/` and its components (`batch-card`,
`board-ticket-row`, `ticket-detail`, `ticket-peek`, `repo-maintenance`, `board-refresh`)
as specified: large-title header, restyled now-strip, repo sections as grouped lists with
mono progress and `Meter`, batch contents in detented sheets, launchers and their URL
shapes byte-for-byte unchanged, swipes restyled with the threshold haptic. Touch nothing
in `lib/tickets.ts` link building or the parser — this is presentation only.

Follow the amended `design-dna` skill. Work on a `claude/` branch, push, verify on the
Vercel preview with the token configured and unconfigured, both colour modes, phone and
desk — including one real Start in Claude Code tap from a phone. When done, `git mv`
this stub to `.icm/intake/admin-native-redesign/_done/`.
